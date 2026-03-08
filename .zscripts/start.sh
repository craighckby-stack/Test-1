#!/usr/bin/env bash
set -euo pipefail

export GENKIT_VERSION="1.3.1-nexus"
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
declare -A NODE_REGISTRY

genkit_emit() {
    local type=$1 op=$2 status=$3 meta=$4 severity=${5:-INFO}
    local payload
    payload=$(printf '{"ts":"%s","type":"%s","op":"%s","status":"%s","traceId":"%s","v":"%s","severity":"%s","meta":%s}' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$type" "$op" "$status" "$TRACE_ID" "$GENKIT_VERSION" "$severity" "$meta")
    echo "$payload"
    [[ -n "$GENKIT_TELEMETRY_SERVER" ]] && curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$GENKIT_TELEMETRY_SERVER" >/dev/null 2>&1 || true
}

_nexus_shutdown() {
    genkit_emit "lifecycle" "shutdown" "INIT" "{\"active\":${#PIDS[@]}}" "WARN"
    [[ ${#PIDS[@]} -eq 0 ]] && exit 0

    kill -TERM "${PIDS[@]}" 2>/dev/null || true
    
    local timeout=10
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
    genkit_emit "lifecycle" "shutdown" "COMPLETE" "{\"force_killed\":${#PIDS[@]}}" "INFO"
    exit 0
}

trap _nexus_shutdown SIGINT SIGTERM

action_runtime_verify() {
    for bin in node bun caddy; do
        command -v "$bin" >/dev/null 2>&1 || {
            genkit_emit "action" "verify" "MISSING" "{\"bin\":\"$bin\"}" "ERROR"
            return 1
        }
    done
    mkdir -p "$BUNDLE_PATH/logs" "$GENKIT_CONFIG_DIR"
}

action_registry_sync() {
    if [[ -f "$SERVICE_MANIFEST" ]]; then
        mapfile -t SERVICES < <(node -e "
            try {
                const m = require('$SERVICE_MANIFEST');
                (Array.isArray(m.services) ? m.services : []).forEach(s => console.log(typeof s === 'string' ? s : s.id));
            } catch(e) { process.exit(1); }
        ")
        genkit_emit "action" "sync" "SUCCESS" "{\"services\":${#SERVICES[@]:-0}}" "INFO"
    else
        SERVICES=()
    fi
}

action_provision_state() {
    local src="$BUNDLE_PATH/next-service-dist/db"
    [[ -d "$src" ]] && {
        mkdir -p "/db"
        cp -ru "$src"/* "/db/" 2>/dev/null || true
    }
}

_spawn() {
    local name=$1 cmd=$2 log_file=$3
    genkit_emit "spawn" "$name" "STARTING" "{}" "DEBUG"
    
    eval "GENKIT_TRACE_ID=$TRACE_ID GENKIT_ENV=$GENKIT_ENV $cmd >> $log_file 2>&1 &"
    local pid=$!
    
    PIDS+=("$pid")
    NODE_REGISTRY[$pid]="$name"
    genkit_emit "spawn" "$name" "SUCCESS" "{\"pid\":$pid,\"log\":\"$log_file\"}" "INFO"
}

action_orchestrate_nexus() {
    local logs="$BUNDLE_PATH/logs"

    [[ -f "$BUNDLE_PATH/next-service-dist/server.js" ]] && \
        _spawn "gateway" "cd $BUNDLE_PATH/next-service-dist && bun server.js" "$logs/gateway.log"

    [[ -f "$BUNDLE_PATH/mini-services-start.sh" ]] && \
        _spawn "bus" "sh $BUNDLE_PATH/mini-services-start.sh" "$logs/bus.log"

    for sid in "${SERVICES[@]:-}"; do
        local bin="$BUNDLE_PATH/services/${sid}.js"
        [[ -f "$bin" ]] && _spawn "svc:$sid" "GENKIT_SERVICE_NAME=$sid node $bin" "$logs/svc_${sid}.log"
    done

    [[ -f "$BUNDLE_PATH/Caddyfile" ]] && \
        _spawn "ingress" "caddy run --config $BUNDLE_PATH/Caddyfile --adapter caddyfile" "$logs/ingress.log"

    [[ ${#PIDS[@]} -gt 0 ]] || return 1
    
    genkit_emit "lifecycle" "orchestrate" "STABLE" "{\"nodes\":${#PIDS[@]}}" "INFO"

    while true; do
        for pid in "${PIDS[@]}"; do
            if ! kill -0 "$pid" 2>/dev/null; then
                local label="${NODE_REGISTRY[$pid]:-unknown}"
                genkit_emit "node_fault" "$label" "CRASH" "{\"pid\":$pid}" "FATAL"
                _nexus_shutdown
            fi
        done
        sleep 5
    done
}

flow_execute() {
    genkit_emit "flow" "main" "START" "{\"path\":\"$BUNDLE_PATH\"}" "INFO"

    local actions=(
        "verify|action_runtime_verify"
        "sync|action_registry_sync"
        "provision|action_provision_state"
        "orchestrate|action_orchestrate_nexus"
    )

    for step in "${actions[@]}"; do
        IFS="|" read -r id fn <<< "$step"
        $fn || {
            genkit_emit "flow" "main" "FAILED" "{\"step\":\"$id\"}" "FATAL"
            exit 1
        }
    done
}

flow_execute "$@"