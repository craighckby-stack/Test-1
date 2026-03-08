#!/usr/bin/env bash
set -euo pipefail

export GENKIT_VERSION="1.3.0-nexus"
export BUNDLE_PATH="${BUNDLE_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
export GENKIT_CONFIG_DIR="${GENKIT_CONFIG_DIR:-$BUNDLE_PATH/.genkit}"
export SERVICE_MANIFEST="$BUNDLE_PATH/service_manifest.json"
export TRACE_ID="${TRACE_ID:-$(date +%s%N | cut -b1-16)}"
export NODE_ENV="${NODE_ENV:-production}"
export GENKIT_ENV="${GENKIT_ENV:-$NODE_ENV}"
export GENKIT_LOG_LEVEL="${GENKIT_LOG_LEVEL:-info}"
export GENKIT_TELEMETRY_SERVER="${GENKIT_TELEMETRY_SERVER:-}"
export PORT=${PORT:-3000}

declare -a PIDS=()
declare -A NODE_MAP

genkit_telemetry_emit() {
    local op=$1 status=$2 meta=$3 severity=${4:-INFO}
    local payload
    payload=$(printf '{"ts":"%s","op":"%s","status":"%s","traceId":"%s","v":"%s","severity":"%s","meta":%s}' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$op" "$status" "$TRACE_ID" "$GENKIT_VERSION" "$severity" "$meta")
    echo "$payload"
    [[ -n "$GENKIT_TELEMETRY_SERVER" ]] && curl -s -X POST -d "$payload" "$GENKIT_TELEMETRY_SERVER" >/dev/null 2>&1 || true
}

genkit_invoke_op() {
    local sid=$1 fn=$2
    genkit_telemetry_emit "$sid" "START" "{}" "DEBUG"
    if $fn; then
        genkit_telemetry_emit "$sid" "COMPLETED" "{}" "INFO"
    else
        genkit_telemetry_emit "$sid" "FAILED" "{\"error\":\"op_failure\"}" "ERROR"
        return 1
    fi
}

_nexus_shutdown() {
    genkit_telemetry_emit "nexus_shutdown" "INIT" "{\"active_nodes\":${#PIDS[@]}}" "WARN"
    [[ ${#PIDS[@]} -eq 0 ]] && exit 0

    kill -TERM "${PIDS[@]}" 2>/dev/null || true
    
    local timeout=15
    while [ $timeout -gt 0 ] && [ ${#PIDS[@]} -gt 0 ]; do
        local alive=()
        for pid in "${PIDS[@]}"; do
            kill -0 "$pid" 2>/dev/null && alive+=("$pid")
        done
        PIDS=("${alive[@]}")
        [[ ${#PIDS[@]} -eq 0 ]] && break
        sleep 1
        ((timeout--))
    done

    [[ ${#PIDS[@]} -gt 0 ]] && kill -9 "${PIDS[@]}" 2>/dev/null || true
    genkit_telemetry_emit "nexus_shutdown" "TERMINATED" "{\"force_killed\":${#PIDS[@]}}" "INFO"
    exit 0
}

trap _nexus_shutdown SIGINT SIGTERM

op_runtime_check() {
    local deps=("node" "bun" "caddy")
    for bin in "${deps[@]}"; do
        command -v "$bin" >/dev/null 2>&1 || {
            genkit_telemetry_emit "runtime_check" "MISSING_DEP" "{\"bin\":\"$bin\"}" "ERROR"
            return 1
        }
    done
    mkdir -p "$BUNDLE_PATH/logs" "$GENKIT_CONFIG_DIR"
}

op_registry_sync() {
    if [[ -f "$SERVICE_MANIFEST" ]]; then
        mapfile -t SERVICES < <(node -e "
            try {
                const m = require('$SERVICE_MANIFEST');
                (m.services || []).forEach(s => console.log(typeof s === 'string' ? s : s.id));
            } catch(e) { process.exit(1); }
        ")
        genkit_telemetry_emit "registry_sync" "SUCCESS" "{\"count\":${#SERVICES[@]:-0}}" "INFO"
    else
        SERVICES=()
    fi
}

op_db_provision() {
    local src="$BUNDLE_PATH/next-service-dist/db"
    local dest="/db"
    if [[ -d "$src" ]]; then
        [[ -d "$dest" ]] || mkdir -p "$dest"
        cp -ru "$src"/* "$dest/" 2>/dev/null || true
    fi
}

_spawn_resource() {
    local label=$1 cmd=$2 log=$3
    local full_cmd="GENKIT_TRACE_ID=$TRACE_ID GENKIT_ENV=$GENKIT_ENV $cmd"
    eval "$full_cmd >> $log 2>&1 &"
    local pid=$!
    PIDS+=("$pid")
    NODE_MAP[$pid]="$label"
    genkit_telemetry_emit "resource_spawn" "SUCCESS" "{\"label\":\"$label\",\"pid\":$pid}" "INFO"
}

op_nexus_orchestrate() {
    local log_dir="$BUNDLE_PATH/logs"

    if [[ -f "$BUNDLE_PATH/next-service-dist/server.js" ]]; then
        _spawn_resource "primary_gateway" \
            "cd $BUNDLE_PATH/next-service-dist && bun server.js" \
            "$log_dir/next_primary.log"
    fi

    if [[ -f "$BUNDLE_PATH/mini-services-start.sh" ]]; then
        _spawn_resource "micro_bus" \
            "sh $BUNDLE_PATH/mini-services-start.sh" \
            "$log_dir/mini_services.log"
    fi

    for svc_id in "${SERVICES[@]:-}"; do
        local bin="$BUNDLE_PATH/services/${svc_id}.js"
        [[ -f "$bin" ]] && _spawn_resource "svc:$svc_id" \
            "GENKIT_SERVICE_NAME=$svc_id node $bin" \
            "$log_dir/svc_${svc_id}.log"
    done

    if [[ -f "$BUNDLE_PATH/Caddyfile" ]]; then
        _spawn_resource "ingress_controller" \
            "caddy run --config $BUNDLE_PATH/Caddyfile --adapter caddyfile" \
            "$log_dir/caddy.log"
    fi

    [[ ${#PIDS[@]} -gt 0 ]] || return 1
    
    genkit_telemetry_emit "nexus_stable" "RUNNING" "{\"nodes\":${#PIDS[@]}}" "INFO"

    while true; do
        for pid in "${PIDS[@]}"; do
            if ! kill -0 "$pid" 2>/dev/null; then
                local label="${NODE_MAP[$pid]:-unknown}"
                genkit_telemetry_emit "node_crash" "CRITICAL" "{\"label\":\"$label\",\"pid\":$pid}" "FATAL"
                _nexus_shutdown
            fi
        done
        sleep 5
    done
}

execute_nexus_flow() {
    genkit_telemetry_emit "flow_init" "INIT" "{\"path\":\"$BUNDLE_PATH\",\"v\":\"$GENKIT_VERSION\"}" "INFO"

    local pipeline=(
        "runtime:check|op_runtime_check"
        "registry:sync|op_registry_sync"
        "db:provision|op_db_provision"
        "nexus:orchestrate|op_nexus_orchestrate"
    )

    for step in "${pipeline[@]}"; do
        IFS="|" read -r sid fn <<< "$step"
        genkit_invoke_op "$sid" "$fn" || {
            genkit_telemetry_emit "flow_abort" "FATAL" "{\"stage\":\"$sid\"}" "FATAL"
            exit 1
        }
    done
}

execute_nexus_flow "$@"