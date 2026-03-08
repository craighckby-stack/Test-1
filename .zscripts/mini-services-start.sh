#!/usr/bin/env bash
set -euo pipefail

export GENKIT_VERSION="1.3.0-nexus"
export BUNDLE_PATH="${BUNDLE_PATH:-./genkit_bundle}"
export SERVICE_MANIFEST="$BUNDLE_PATH/service_manifest.json"
export TRACE_ID="${TRACE_ID:-$(date +%s%N | cut -b1-16)}"
export NODE_ENV="${NODE_ENV:-production}"
export GENKIT_TELEMETRY_SERVER="${GENKIT_TELEMETRY_SERVER:-}"
export GENKIT_LOG_LEVEL="${GENKIT_LOG_LEVEL:-info}"

declare -a PIDS=()

genkit_telemetry_emit() {
    local op=$1 status=$2 meta=$3
    printf '{"ts":"%s","op":"%s","status":"%s","traceId":"%s","v":"%s","meta":%s}\n' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$op" "$status" "$TRACE_ID" "$GENKIT_VERSION" "$meta"
}

genkit_invoke_op() {
    local sid=$1 fn=$2
    genkit_telemetry_emit "$sid" "START" "{}"
    if $fn; then
        genkit_telemetry_emit "$sid" "COMPLETED" "{}"
    else
        genkit_telemetry_emit "$sid" "FAILED" '{"error":"execution_interrupted"}'
        return 1
    fi
}

_terminate() {
    genkit_telemetry_emit "nexus_shutdown" "INIT" "{\"active_nodes\":${#PIDS[@]}}"
    [[ ${#PIDS[@]} -gt 0 ]] && kill -TERM "${PIDS[@]}" 2>/dev/null || true
    
    local timeout=10
    while [ $timeout -gt 0 ] && [ ${#PIDS[@]} -gt 0 ]; do
        local remaining=()
        for pid in "${PIDS[@]}"; do
            kill -0 "$pid" 2>/dev/null && remaining+=("$pid")
        done
        PIDS=("${remaining[@]}")
        [[ ${#PIDS[@]} -eq 0 ]] && break
        sleep 1
        ((timeout--))
    done

    [[ ${#PIDS[@]} -gt 0 ]] && kill -9 "${PIDS[@]}" 2>/dev/null || true
    genkit_telemetry_emit "nexus_shutdown" "TERMINATED" "{}"
    exit 0
}

trap _terminate SIGINT SIGTERM

op_validate_runtime() {
    for bin in node bun; do
        command -v "$bin" >/dev/null 2>&1 || { 
            genkit_telemetry_emit "runtime_check" "CRITICAL" "{\"missing\":\"$bin\"}"
            return 1 
        }
    done
    [[ -d "$BUNDLE_PATH" ]] || return 1
}

op_hydrate_registry() {
    [[ -f "$SERVICE_MANIFEST" ]] || return 1
    SERVICES=($(node -e "try { const m = require('$SERVICE_MANIFEST'); console.log((m.services || []).join(' ')); } catch(e) { process.exit(1); }"))
    genkit_telemetry_emit "registry_load" "SUCCESS" "{\"discovered\":${#SERVICES[@]}}"
}

op_orchestrate_nexus() {
    local log_root="$BUNDLE_PATH/logs"
    mkdir -p "$log_root"

    if [[ -f "$BUNDLE_PATH/server.js" ]]; then
        genkit_telemetry_emit "node_spawn" "PRIMARY" '{"id":"standalone"}'
        GENKIT_TRACE_CONTEXT="{\"traceId\":\"$TRACE_ID\"}" \
        node "$BUNDLE_PATH/server.js" >> "$log_root/primary.log" 2>&1 &
        PIDS+=($!)
    fi

    for svc_id in "${SERVICES[@]:-}"; do
        local svc_path="$BUNDLE_PATH/services/${svc_id}.js"
        if [[ -f "$svc_path" ]]; then
            GENKIT_TRACE_ID="$TRACE_ID" \
            GENKIT_SERVICE_NAME="$svc_id" \
            GENKIT_ENV="$NODE_ENV" \
            node "$svc_path" >> "$log_root/svc_${svc_id}.log" 2>&1 &
            local pid=$!
            PIDS+=("$pid")
            genkit_telemetry_emit "node_spawn" "SUCCESS" "{\"id\":\"$svc_id\",\"pid\":$pid}"
        fi
    done

    [[ ${#PIDS[@]} -eq 0 ]] && return 1
    genkit_telemetry_emit "nexus_active" "STABLE" "{\"total_nodes\":${#PIDS[@]}}"
    wait
}

execute_nexus_flow() {
    genkit_telemetry_emit "pipeline_init" "INIT" "{\"bundle\":\"$BUNDLE_PATH\",\"trace\":\"$TRACE_ID\"}"

    local pipeline=(
        "runtime:validate|op_validate_runtime"
        "registry:hydrate|op_hydrate_registry"
        "nexus:orchestrate|op_orchestrate_nexus"
    )

    for stage in "${pipeline[@]}"; do
        IFS="|" read -r sid fn <<< "$stage"
        genkit_invoke_op "$sid" "$fn" || {
            genkit_telemetry_emit "pipeline_crash" "FATAL" "{\"failed_stage\":\"$sid\"}"
            exit 1
        }
    done
}

execute_nexus_flow "$@"