#!/usr/bin/env bash
set -euo pipefail

export GENKIT_VERSION="1.3.0-nexus"
export BUNDLE_PATH="${BUNDLE_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
export TRACE_ID="${TRACE_ID:-$(date +%s%N | cut -b1-16)}"
export NODE_ENV="${NODE_ENV:-production}"
export PORT=${PORT:-3000}
export HOSTNAME=${HOSTNAME:-0.0.0.0}

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
        genkit_telemetry_emit "$sid" "FAILED" "{\"error\":\"operation_failed\"}"
        return 1
    fi
}

_nexus_shutdown() {
    genkit_telemetry_emit "nexus_shutdown" "INIT" "{\"active_nodes\":${#PIDS[@]}}"
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
    genkit_telemetry_emit "nexus_shutdown" "TERMINATED" "{\"force_killed\":${#PIDS[@]}}"
    exit 0
}

trap _nexus_shutdown SIGINT SIGTERM

op_runtime_check() {
    local deps=("bun" "caddy" "node")
    for bin in "${deps[@]}"; do
        command -v "$bin" >/dev/null 2>&1 || {
            genkit_telemetry_emit "runtime_check" "MISSING_DEP" "{\"bin\":\"$bin\"}"
            return 1
        }
    done
}

op_db_init() {
    local src="$BUNDLE_PATH/next-service-dist/db"
    local dest="/db"
    if [[ -d "$src" && -d "$dest" ]]; then
        cp -r "$src"/* "$dest/" 2>/dev/null || return 0
    fi
}

op_nexus_orchestrate() {
    local log_dir="$BUNDLE_PATH/logs"
    mkdir -p "$log_dir"

    # Next.js Primary Node
    if [[ -f "$BUNDLE_PATH/next-service-dist/server.js" ]]; then
        (cd "$BUNDLE_PATH/next-service-dist" && \
         GENKIT_TRACE_ID="$TRACE_ID" \
         GENKIT_SERVICE_TYPE="primary" \
         bun server.js >> "$log_dir/next_primary.log" 2>&1) &
        PIDS+=($!)
        genkit_telemetry_emit "node_spawn" "SUCCESS" "{\"type\":\"primary\",\"pid\":${PIDS[-1]}}"
    fi

    # Mini-services Node
    if [[ -f "$BUNDLE_PATH/mini-services-start.sh" ]]; then
        sh "$BUNDLE_PATH/mini-services-start.sh" >> "$log_dir/mini_services.log" 2>&1 &
        PIDS+=($!)
        genkit_telemetry_emit "node_spawn" "SUCCESS" "{\"type\":\"micro\",\"pid\":${PIDS[-1]}}"
    fi

    # Caddy Ingress Node
    if [[ -f "$BUNDLE_PATH/Caddyfile" ]]; then
        caddy run --config "$BUNDLE_PATH/Caddyfile" --adapter caddyfile >> "$log_dir/caddy.log" 2>&1 &
        PIDS+=($!)
        genkit_telemetry_emit "node_spawn" "SUCCESS" "{\"type\":\"ingress\",\"pid\":${PIDS[-1]}}"
    fi

    [[ ${#PIDS[@]} -gt 0 ]] || return 1
    
    # Watchdog Loop
    while true; do
        for pid in "${PIDS[@]}"; do
            if ! kill -0 "$pid" 2>/dev/null; then
                genkit_telemetry_emit "node_crash" "CRITICAL" "{\"pid\":$pid}"
                _nexus_shutdown
            fi
        done
        sleep 10
    done
}

execute_nexus_flow() {
    genkit_telemetry_emit "flow_init" "INIT" "{\"path\":\"$BUNDLE_PATH\"}"

    local pipeline=(
        "runtime:check|op_runtime_check"
        "db:init|op_db_init"
        "nexus:orchestrate|op_nexus_orchestrate"
    )

    for step in "${pipeline[@]}"; do
        IFS="|" read -r sid fn <<< "$step"
        genkit_invoke_op "$sid" "$fn" || {
            genkit_telemetry_emit "flow_abort" "FATAL" "{\"stage\":\"$sid\"}"
            exit 1
        }
    done
}

execute_nexus_flow "$@"