#!/usr/bin/env bash

set -eo pipefail

# --- ARCHITECTURAL STATE: GENKIT CORE ---
readonly GENKIT_VERSION="0.3.1-siphon"
readonly TRACE_ID="${BUILD_ID:-$(date +%s%N)}"
readonly PROJECT_ROOT="${MINI_SERVICES_ROOT:-$(pwd)}"
readonly BUNDLE_PATH="${MINI_SERVICES_DIST:-/tmp/genkit-siphon-$TRACE_ID}"
readonly ARTIFACT_ROOT="${PROJECT_ROOT}/dist"
readonly TELEMETRY_LOG="${BUNDLE_PATH}/telemetry.jsonl"

# --- GENKIT: TRACING ENGINE ---
log_span() {
    local span_name=$1 status=$2 attr=$3
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    mkdir -p "$(dirname "$TELEMETRY_LOG")"
    local entry
    entry=$(printf '{"timestamp":"%s","traceId":"%s","spanName":"%s","status":"%s","attr":%s}' \
        "$timestamp" "$TRACE_ID" "$span_name" "$status" "${attr:-{}}")
    
    echo "$entry" >> "$TELEMETRY_LOG"
    [[ "$status" == "ERROR" ]] && echo "!! [SPAN_FAILURE] $span_name: $attr" >&2
}

# --- GENKIT: ACTION RUNNER ---
run_action() {
    local action_id=$1
    local action_fn=$2
    local start_ns
    start_ns=$(date +%s%N)

    log_span "$action_id" "STARTED" '{"version":"'"$GENKIT_VERSION"'"}'

    if $action_fn; then
        local end_ns=$(date +%s%N)
        local latency=$(( (end_ns - start_ns) / 1000000 ))
        log_span "$action_id" "SUCCESS" '{"latency_ms":'"$latency"'}'
    else
        local exit_code=$?
        log_span "$action_id" "ERROR" '{"exit_code":'"$exit_code"'}'
        return "$exit_code"
    fi
}

# --- ACTION: ENVIRONMENT SANITIZATION ---
action_entropy_pruning() {
    log_span "pruning" "PROCESSING" '{"scope":"cache_and_logs"}'
    find "$PROJECT_ROOT" -maxdepth 2 -name "node_modules" -type d -exec rm -rf {} +
    find "$PROJECT_ROOT" -name "*.log" -type f -delete
    mkdir -p "$BUNDLE_PATH/services"
}

# --- ACTION: RUNTIME VERIFICATION ---
action_verify_runtime() {
    local bin=("bun" "node")
    for b in "${bin[@]}"; do
        if ! command -v "$b" >/dev/null 2>&1; then
            log_span "runtime_check" "ERROR" '{"missing":"'"$b"'"}'
            return 1
        fi
    done
}

# --- ACTION: MULTI-SERVICE COMPILATION ---
action_compile_services() {
    local services_dir="${PROJECT_ROOT}/services"
    [[ ! -d "$services_dir" ]] && services_dir="$PROJECT_ROOT"

    while IFS= read -r -d '' pkg_json; do
        local dir
        dir=$(dirname "$pkg_json")
        local name
        name=$(basename "$dir")
        
        local entry=""
        for e in "index.ts" "main.ts" "src/index.ts" "src/main.ts"; do
            [[ -f "$dir/$e" ]] && entry="$dir/$e" && break
        done

        if [[ -n "$entry" ]]; then
            log_span "compilation" "PROCESSING" '{"service":"'"$name"'"}'
            bun build "$entry" \
                --outfile "$BUNDLE_PATH/services/$name.js" \
                --target node \
                --minify \
                --sourcemap=external \
                --define "process.env.GENKIT_TRACE_ID=\"$TRACE_ID\""
        fi
    done < <(find "$services_dir" -maxdepth 2 -name "package.json" -print0)
}

# --- ACTION: SCHEMA PROJECTION ---
action_project_schema() {
    local prisma_schema
    prisma_schema=$(find "$PROJECT_ROOT" -name "schema.prisma" | head -n 1)
    
    if [[ -n "$prisma_schema" ]]; then
        log_span "schema_projection" "PROCESSING" '{"path":"'"$prisma_schema"'"}'
        (
            cd "$(dirname "$prisma_schema")"
            bun x prisma generate
        )
        # Mirror schema for runtime migration potential
        cp "$prisma_schema" "$BUNDLE_PATH/schema.prisma"
    fi
}

# --- ACTION: ARTIFACT SEALING ---
action_seal_artifact() {
    mkdir -p "$ARTIFACT_ROOT"
    local output="${ARTIFACT_ROOT}/genkit-bundle-${TRACE_ID}.tar.gz"
    
    # Deterministic entrypoint generation
    cat <<EOF > "$BUNDLE_PATH/entrypoint.sh"
#!/usr/bin/env bash
set -e
echo "[GENKIT_RUNTIME] Starting services for trace: $TRACE_ID"
for svc in services/*.js; do
  echo "[BOOT] \$svc"
  node "\$svc" &
done
wait
EOF
    chmod +x "$BUNDLE_PATH/entrypoint.sh"
    
    tar -czf "$output" -C "$BUNDLE_PATH" .
    log_span "artifact_sealed" "SUCCESS" '{"artifact":"'"$output"'"}'
    echo "RELEASE_PATH: $output"
}

# --- GENKIT FLOW ORCHESTRATION ---
execute_genkit_flow() {
    log_span "flow_initiation" "SUCCESS" '{"root":"'"$PROJECT_ROOT"'"}'

    local pipeline=(
        "pruning|action_entropy_pruning"
        "runtime:check|action_verify_runtime"
        "services:build|action_compile_services"
        "schema:sync|action_project_schema"
        "artifact:seal|action_seal_artifact"
    )

    for stage in "${pipeline[@]}"; do
        IFS="|" read -r id fn <<< "$stage"
        run_action "$id" "$fn" || {
            log_span "flow_interrupted" "FATAL" '{"failed_stage":"'"$id"'"}'
            exit 1
        }
    done

    log_span "flow_completion" "SUCCESS" '{"status":"ARCHITECTURAL_PRECISION_ACHIEVED"}'
}

execute_genkit_flow "$@"