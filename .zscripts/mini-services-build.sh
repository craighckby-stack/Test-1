#!/usr/bin/env bash

set -eo pipefail

# --- ARCHITECTURAL STATE: GENKIT CORE v3.1 ---
readonly GENKIT_VERSION="0.4.2-siphon-precision"
readonly TRACE_ID="${BUILD_ID:-$(date +%s%N)}"
readonly PROJECT_ROOT="${MINI_SERVICES_ROOT:-$(pwd)}"
readonly BUNDLE_PATH="${MINI_SERVICES_DIST:-/tmp/genkit-siphon-$TRACE_ID}"
readonly ARTIFACT_ROOT="${PROJECT_ROOT}/dist"
readonly TELEMETRY_LOG="${BUNDLE_PATH}/telemetry.jsonl"
readonly SERVICE_MANIFEST="${BUNDLE_PATH}/manifest.json"

# --- GENKIT: TELEMETRY DISPATCHER ---
# Implements high-order tracing patterns for observability
log_telemetry() {
    local span_name=$1 status=$2 metadata=$3
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    mkdir -p "$(dirname "$TELEMETRY_LOG")"
    local entry
    entry=$(printf '{"timestamp":"%s","traceId":"%s","spanName":"%s","status":"%s","attr":%s}' \
        "$timestamp" "$TRACE_ID" "$span_name" "$status" "${metadata:-{}}")
    
    echo "$entry" >> "$TELEMETRY_LOG"
    [[ "$status" == "FATAL" || "$status" == "ERROR" ]] && echo "!! [TRACE_ERR] $span_name: $metadata" >&2
}

# --- GENKIT: ACTION INVOKER ---
# Wraps functional units in a timed, monitored execution block
invoke_action() {
    local action_id=$1
    local action_fn=$2
    local start_ns
    start_ns=$(date +%s%N)

    log_telemetry "$action_id" "STARTED" '{"version":"'"$GENKIT_VERSION"'"}'

    if $action_fn; then
        local end_ns=$(date +%s%N)
        local duration_ms=$(( (end_ns - start_ns) / 1000000 ))
        log_telemetry "$action_id" "SUCCESS" '{"latency_ms":'"$duration_ms"'}'
    else
        local err_code=$?
        log_telemetry "$action_id" "ERROR" '{"exit_code":'"$err_code"'}'
        return "$err_code"
    fi
}

# --- ACTION: ENTROPY NEUTRALIZATION ---
# Prunes workspace artifacts to ensure build determinism
action_prune_entropy() {
    log_telemetry "entropy_pruning" "PROCESSING" '{"scope":"workspace_cleanse"}'
    
    find "$PROJECT_ROOT" -maxdepth 2 -name ".next" -type d -exec rm -rf {} +
    find "$PROJECT_ROOT" -maxdepth 2 -name "node_modules" -type d -exec rm -rf {} +
    find "$PROJECT_ROOT" -name "*.log" -type f -delete
    
    mkdir -p "$BUNDLE_PATH/services"
}

# --- ACTION: RUNTIME VALIDATION ---
action_validate_runtime() {
    local missing=()
    for bin in bun node; do
        command -v "$bin" >/dev/null 2>&1 || missing+=("$bin")
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_telemetry "runtime_validation" "ERROR" '{"missing_binaries":"'"${missing[*]}"'"}'
        return 1
    fi
}

# --- ACTION: SERVICE COMPILATION (SIPHON DNA) ---
# Discovers and compiles service entrypoints into standalone bundles
action_compile_services() {
    local services_found=()
    
    while IFS= read -r -d '' pkg_json; do
        local dir
        dir=$(dirname "$pkg_json")
        local svc_name
        svc_name=$(basename "$dir")
        
        local entry=""
        for e in "index.ts" "main.ts" "src/index.ts" "src/main.ts" "server.js"; do
            [[ -f "$dir/$e" ]] && entry="$dir/$e" && break
        done

        if [[ -n "$entry" ]]; then
            log_telemetry "compilation" "PROCESSING" '{"service":"'"$svc_name"'"}'
            (
                cd "$dir"
                bun build "$entry" \
                    --outfile "$BUNDLE_PATH/services/$svc_name.js" \
                    --target node \
                    --minify \
                    --sourcemap=external \
                    --define "process.env.GENKIT_TRACE_ID=\"$TRACE_ID\""
            )
            services_found+=("\"$svc_name\"")
        fi
    done < <(find "$PROJECT_ROOT" -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" -print0)

    # Generate internal service manifest
    printf '{"traceId":"%s","services":[%s]}' "$TRACE_ID" "$(IFS=,; echo "${services_found[*]}")" > "$SERVICE_MANIFEST"
}

# --- ACTION: DATA PROJECTION ---
# Synchronizes Prisma schemas and generates client artifacts
action_project_schema() {
    local schema_path
    schema_path=$(find "$PROJECT_ROOT" -name "schema.prisma" -not -path "*/node_modules/*" | head -n 1)
    
    if [[ -n "$schema_path" ]]; then
        log_telemetry "schema_projection" "PROCESSING" '{"path":"'"$schema_path"'"}'
        (
            cd "$(dirname "$schema_path")"
            bun x prisma generate
        )
        cp "$schema_path" "$BUNDLE_PATH/schema.prisma"
    fi
}

# --- ACTION: ARTIFACT SEALING ---
# Packs the compiled bundle and generates the process entrypoint
action_seal_artifact() {
    mkdir -p "$ARTIFACT_ROOT"
    local output_file="${ARTIFACT_ROOT}/genkit-release-${TRACE_ID}.tar.gz"
    
    # Generate Process Manager Entrypoint
    cat <<'EOF' > "$BUNDLE_PATH/entrypoint.sh"
#!/usr/bin/env bash
set -e
export GENKIT_RUNTIME_BOOT=$(date +%s)
echo "[GENKIT] Initializing micro-services..."
for svc in services/*.js; do
    echo "[BOOT] Starting $svc"
    node "$svc" &
done
wait
EOF
    chmod +x "$BUNDLE_PATH/entrypoint.sh"
    
    tar -czf "$output_file" -C "$BUNDLE_PATH" .
    
    log_telemetry "artifact_sealed" "SUCCESS" '{"path":"'"$output_file"'"}'
    echo "FLOW_COMPLETED: $output_file"
}

# --- MAIN: GENKIT FLOW ORCHESTRATOR ---
# Declarative execution pipeline with error reflection
define_genkit_flow() {
    log_telemetry "genkit_flow_init" "SUCCESS" '{"root":"'"$PROJECT_ROOT"'"}'

    local flow_manifest=(
        "workspace:prune|action_prune_entropy"
        "runtime:validate|action_validate_runtime"
        "services:compile|action_compile_services"
        "schema:project|action_project_schema"
        "artifact:seal|action_seal_artifact"
    )

    for step in "${flow_manifest[@]}"; do
        IFS="|" read -r action_id action_fn <<< "$step"
        invoke_action "$action_id" "$action_fn" || {
            log_telemetry "flow_aborted" "FATAL" '{"failed_at":"'"$action_id"'"}'
            exit 1
        }
    done

    log_telemetry "genkit_flow_terminal" "SUCCESS" '{"architectural_precision":"achieved"}'
}

define_genkit_flow "$@"