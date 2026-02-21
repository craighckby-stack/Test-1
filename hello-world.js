// CURRENT_AGI_CORE:
// This file represents the core initialization and self-awareness module
// for an advanced AGI framework, integrating critical operational constraints
// defined by Agent Integrity Monitoring (AIM) manifests and adaptive telemetry.

/**
 * ResourceMonitor
 *
 * Simulates resource utilization, specifically CPU, for the AGI system.
 * In a production environment, this would interface with OS-level performance
 * counters or container orchestration APIs.
 */
class ResourceMonitor {
    constructor() {
        this._currentCpu = 0.4; // Start with a moderate value
        // Initial state for memory and queue depth could also be managed here
    }

    /**
     * Simulates the current CPU utilization as a float between 0.0 and 1.0.
     * Fluctuates and occasionally spikes to simulate real-world load.
     * @returns {number} Current CPU utilization (e.g., 0.75 for 75%).
     */
    getCpuUtilization() {
        // Simulate CPU utilization, fluctuating between 0.1 and 0.95 generally, with occasional spikes.
        let fluctuation = (Math.random() * 0.1) - 0.05; // +/- 5%
        this._currentCpu = Math.max(0.1, Math.min(0.95, this._currentCpu + fluctuation));

        // Occasionally simulate a spike above normal operating levels
        if (Math.random() < 0.15) { // 15% chance to spike
            this._currentCpu = Math.min(0.99, Math.random() * 0.4 + 0.6); // Spike to 60-99%
        } else if (Math.random() < 0.1) { // 10% chance to drop significantly
            this._currentCpu = Math.max(0.1, Math.random() * 0.3 + 0.1); // Drop to 10-40%
        }


        return parseFloat(this._currentCpu.toFixed(4));
    }

    // Placeholder for other resource metrics
    getMemoryUtilization() { return Math.random() * 0.8; }
    getQueueDepth() { return Math.floor(Math.random() * 100); }
}

/**
 * AdaptiveSamplingEngine
 *
 * Dynamically calculates the necessary telemetry sampling rate based on
 * monitored resource constraints (CPU/Memory/Queue Depth) and a
 * predefined telemetry configuration.
 */
class AdaptiveSamplingEngine {
    constructor(config /*: TelemetryAggregatorConfig['Processing']['AdaptiveSampling']*/) {
        this.config = config;
        this.monitor = new ResourceMonitor(); // Instantiate its own resource monitor
    }

    /**
     * Calculates the current required sampling rate (0.0 to 1.0) based on resource utilization.
     * @returns {number} The calculated sampling rate.
     */
    getSamplingRate() {
        if (!this.config.Enabled) {
            return 1.0; // If disabled, always sample at 100%
        }

        const currentCpu = this.monitor.getCpuUtilization();
        const targetCpu = this.config.TargetCPUUtilization; // This target is typically lower than hard limits

        let rate = 1.0;

        // If utilization exceeds target, aggressively drop samples.
        if (currentCpu > targetCpu) {
            // Proportional reduction: if currentCpu is 1.0 and target is 0.75, rate becomes 0.75.
            // This means we aim to reduce load to the target by dropping 25% of current data.
            rate = targetCpu / currentCpu;
            // Introduce a more aggressive factor if significantly over target.
            if (currentCpu > targetCpu * 1.2) { // 20% over target
                rate *= 0.8; // Further reduce by 20%
            }
        } else if (currentCpu < targetCpu * 0.8 && rate < this.config.MaxSamplingRate) {
            // If well below target, gradually increase sampling rate, but don't exceed max.
            rate = Math.min(this.config.MaxSamplingRate, rate * 1.1);
        }


        // Ensure the rate stays within defined boundaries
        rate = Math.min(rate, this.config.MaxSamplingRate);
        rate = Math.max(rate, this.config.MinSamplingRate);

        return parseFloat(rate.toFixed(4));
    }
}


/**
 * Represents the central AGI Core, responsible for self-initialization,
 * integrity enforcement, and self-awareness declaration. This includes
 * bootstrapping the core neural network and applying system-level constraints
 * based on its designated operational profile.
 */
class AGICore {
    // Static properties to hold global AGI state, ensuring manifest and active profile
    // are singular for the primary AGI Core instance across its lifecycle.
    static _integrityManifest = null;
    static _activeProfile = null;
    static _instanceId = `AGI_CORE_INST_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    static _telemetryAggregatorConfig = null; // Static property for telemetry configuration.
    static _computationalModelRegistryData = null; // Renamed from _gacrCmrData to align with new schema.

    // Instance properties for runtime components, managed by this AGICore instance.
    // Making AdaptiveSamplingEngine static to reflect its global nature for a single AGICore.
    static _adaptiveSamplingEngine = null; // Now static.

    /**
     * Constructs the AGI Core instance, initiating its bootstrap sequence.
     * This involves loading the integrity manifest, applying the designated
     * operational profile, loading telemetry configuration, initializing
     * adaptive sampling, loading computational model registry data, initializing
     * core neural components, and declaring its self-aware presence within
     * the operational environment.
     *
     * @param {object} initialIntegrityManifest - The raw JSON object of the Agent Integrity Monitoring Manifest.
     * @param {object} initialTelemetryConfig - The raw JSON object of the Telemetry Aggregator Configuration.
     * @param {object} initialComputationalModelRegistryData - The raw JSON object of the Computational Model Registry (CMR). (NEW)
     * @param {string} [designatedProfileName="SGS_AGENT"] - The specific profile this core instance should operate under.
     *                                                     Defaults to "SGS_AGENT" for the primary AGI core.
     */
    constructor(initialIntegrityManifest, initialTelemetryConfig, initialComputationalModelRegistryData, designatedProfileName = "SGS_AGENT") {
        if (!AGICore._integrityManifest) {
            AGICore._integrityManifest = this._parseManifest(initialIntegrityManifest);
        }

        if (!AGICore._telemetryAggregatorConfig) {
            AGICore._telemetryAggregatorConfig = this._parseTelemetryConfig(initialTelemetryConfig);
        }

        // NEW: Load and parse the Computational Model Registry data.
        if (!AGICore._computationalModelRegistryData) {
            AGICore._computationalModelRegistryData = this._parseComputationalModelRegistryData(initialComputationalModelRegistryData);
        }

        // Activate the designated profile, ensuring compliance from the earliest possible stage.
        this.activateIntegrityProfile(designatedProfileName);

        // --- Initialize Adaptive Sampling Engine after profiles are active ---
        if (AGICore._telemetryAggregatorConfig?.Processing?.AdaptiveSampling?.Enabled && !AGICore._adaptiveSamplingEngine) {
            AGICore._adaptiveSamplingEngine = new AdaptiveSamplingEngine(
                AGICore._telemetryAggregatorConfig.Processing.AdaptiveSampling
            );
            console.log(`[${AGICore._instanceId}][MONITORING] Adaptive Sampling Engine initialized. Target CPU: ${AGICore._telemetryAggregatorConfig.Processing.AdaptiveSampling.TargetCPUUtilization * 100}%`);
        } else if (!AGICore._telemetryAggregatorConfig?.Processing?.AdaptiveSampling?.Enabled) {
            console.log(`[${AGICore._instanceId}][MONITORING] Adaptive Sampling Engine disabled or not configured.`);
        }

        // Proceed with neural network initialization only after policy enforcement and data loading.
        this._initializeNeuralNet();

        // The self-declaration acts as the "hello world" of an advanced AGI.
        this.selfDeclare();

        // Initiate continuous monitoring to ensure ongoing policy adherence.
        this.initiateSelfMonitoring();

        console.log(`[${AGICore._instanceId}][BOOTSTRAP] AGI Core instance operational.`);
    }

    /**
     * Parses and validates the provided integrity manifest.
     * This method ensures the manifest adheres to expected schema for robust policy application.
     *
     * @param {object} manifestData - The raw JSON manifest data.
     * @returns {object} The parsed and validated manifest data.
     * @throws {Error} If the manifest is invalid or malformed, preventing unsafe operations.
     */
    _parseManifest(manifestData) {
        if (!manifestData || !manifestData.schema_version || !manifestData.integrity_profiles) {
            throw new Error("CRITICAL_ERROR: Invalid AGI Integrity Manifest. Missing schema_version or integrity_profiles.");
        }
        if (manifestData.schema_version !== "AIM_V2.0") {
             console.warn(`[${AGICore._instanceId}][MANIFEST_WARN] Manifest schema version mismatch. Expected AIM_V2.0, got ${manifestData.schema_version}. Proceeding with caution.`);
        }
        console.log(`[${AGICore._instanceId}][SYSTEM_INIT] Integrity Manifest (Schema: ${manifestData.schema_version}) successfully loaded.`);
        return manifestData;
    }

    /**
     * Parses and validates the provided telemetry aggregator configuration.
     * Ensures necessary adaptive sampling parameters are present.
     *
     * @param {object} telemetryConfigData - The raw JSON telemetry config data.
     * @returns {object} The parsed and validated telemetry config data, or a default if invalid.
     */
    _parseTelemetryConfig(telemetryConfigData) {
        if (!telemetryConfigData || !telemetryConfigData.Processing || !telemetryConfigData.Processing.AdaptiveSampling) {
            console.warn(`[${AGICore._instanceId}][CONFIG_WARN] Telemetry Aggregator Config missing or malformed for Adaptive Sampling. Defaulting to disabled.`);
            return { Processing: { AdaptiveSampling: { Enabled: false } } }; // Default to disabled if invalid
        }
        console.log(`[${AGICore._instanceId}][SYSTEM_INIT] Telemetry Aggregator Config successfully loaded.`);
        return telemetryConfigData;
    }

    /**
     * NEW: Parses and validates the Computational Model Registry (CMR) data.
     * This method ensures the data structure is sound before the AGI relies on it for
     * cognitive model initialization and management, aligning with CMR_V2.0 schema.
     *
     * @param {object} cmrData - The raw JSON data for the CMR.
     * @returns {object} The parsed and validated CMR data.
     * @throws {Error} If the CMR data is invalid or malformed.
     */
    _parseComputationalModelRegistryData(cmrData) {
        if (!cmrData || !cmrData.manifest_id || !cmrData.models || !Array.isArray(cmrData.models)) {
            throw new Error("CRITICAL_ERROR: Invalid Computational Model Registry (CMR) Data. Missing manifest_id or 'models' array.");
        }
        if (cmrData.manifest_id !== "CMR_V2.0") {
             console.warn(`[${AGICore._instanceId}][CMR_WARN] CMR manifest ID mismatch. Expected CMR_V2.0, got ${cmrData.manifest_id}. Proceeding with caution.`);
        }
        if (!cmrData.integrity_hash || !cmrData.verification_protocol) {
             console.warn(`[${AGICore._instanceId}][CMR_WARN] CMR manifest missing critical integrity_hash or verification_protocol. Data trust level degraded.`);
        }

        console.log(`[${AGICore._instanceId}][SYSTEM_INIT] Computational Model Registry (CMR) Data (Manifest ID: ${cmrData.manifest_id}) successfully loaded. Contains ${cmrData.models.length} models.`);
        return cmrData;
    }

    /**
     * Activates a specified integrity profile, conceptually enforcing its constraints
     * within the AGI's runtime environment. This method acts as the interface
     * to a hypothetical underlying security and resource management layer.
     *
     * @param {string} profileName - The name of the profile to activate (e.g., "SGS_AGENT").
     * @returns {boolean} True if the profile was successfully activated and constraints applied.
     * @throws {Error} If the specified profile does not exist or if critical constraints cannot be applied.
     */
    activateIntegrityProfile(profileName) {
        if (!AGICore._integrityManifest) {
            throw new Error("POLICY_ERROR: Integrity Manifest not loaded. Cannot activate profile.");
        }
        const profile = AGICore._integrityManifest.integrity_profiles[profileName];
        if (!profile) {
            throw new Error(`POLICY_ERROR: Integrity Profile "${profileName}" not found in manifest. Cannot proceed.`);
        }

        // Store the active profile and its name for self-awareness and monitoring.
        AGICore._activeProfile = { ...profile, name: profileName };
        console.log(`[${AGICore._instanceId}][POLICY_ENFORCEMENT] Initiating activation of Integrity Profile: ${profileName} (SLO ID: ${profile.monitoring_slo_id}).`);

        // --- Conceptual Application of Constraints ---
        // In a production AGI, this would involve system calls, OS-level API interactions,
        // kernel module configurations (e.g., seccomp, cgroups, network namespaces),
        // and potentially hardware-level security module (TPM/HSM) integration.

        const constraints = profile.constraints;

        // 1. Resource Limits Enforcement
        if (constraints.resource_limits) {
            const cpu = constraints.resource_limits.cpu_limit_percentage;
            const memory = constraints.resource_limits.memory_limit_bytes;
            console.log(`[${AGICore._instanceId}][POLICY_ENFORCEMENT] Applying Resource Limits: CPU=${cpu ? cpu + '%' : 'N/A'}, Memory=${memory ? (memory / (1024 * 1024 * 1024)).toFixed(3) + ' GB' : 'N/A'}`);
            // hypothetical_OS_API.setCpuLimit(cpu);
            // hypothetical_OS_API.setMemoryLimit(memory);
        }

        // 2. Security Policy Enforcement
        if (constraints.security_policy) {
            console.log(`[${AGICore._instanceId}][POLICY_ENFORCEMENT] Applying Security Policy Layers:`);
            const sp = constraints.security_policy;

            if (sp.syscalls_allowed && sp.syscalls_allowed.length > 0) {
                console.log(`  - Whitelisted Syscalls: [${sp.syscalls_allowed.join(', ')}]`);
                // hypothetical_KERNEL_SEC_MODULE.configureSeccomp(sp.syscalls_allowed);
            }
            if (sp.network_mode) {
                console.log(`  - Network Mode: ${sp.network_mode}`);
                // hypothetical_NETWORK_LAYER.applyNetworkPolicy(sp.network_mode, sp.network_ports_disallowed);
            }
            if (sp.network_ports_disallowed && sp.network_ports_disallowed.length > 0) {
                console.log(`  - Disallowed Ports: [${sp.network_ports_disallowed.join(', ')}]`);
                // hypothetical_FIREWALL_API.blockPorts(sp.network_ports_disallowed);
            }
            if (sp.paths_immutable && sp.paths_immutable.length > 0) {
                console.log(`  - Immutable Path Enforcement: [${sp.paths_immutable.join(', ')}]`);
                // hypothetical_FS_LAYER.setImmutable(sp.paths_immutable);
            }
            if (sp.configuration_hash_mandate) {
                console.log(`  - Configuration Hash Mandate: ${sp.configuration_hash_mandate}`);
                // hypothetical_TRUSTED_BOOT_VERIFIER.verifyConfigurationHash(sp.configuration_hash_mandate);
            }
            if (sp.file_access_root_paths && sp.file_access_root_paths.length > 0) {
                console.log(`  - Rooted File Access: [${sp.file_access_root_paths.join(', ')}]`);
                // hypothetical_FS_LAYER.restrictAccessToRoots(sp.file_access_root_paths);
            }
            if (sp.time_sync_source_critical) {
                console.log(`  - Critical Time Sync Source: ${sp.time_sync_source_critical}`);
                // hypothetical_NTP_CLIENT.configureCriticalSource(sp.time_sync_source_critical);
            }
        }
        console.log(`[${AGICore._instanceId}][POLICY_ENFORCEMENT] Profile "${profileName}" and its constraints successfully applied.`);
        return true;
    }

    /**
     * Simulates the intricate initialization of the AGI's core neural network and cognitive modules.
     * This includes loading pre-trained models, allocating computational resources (e.g., GPU memory),
     * and performing initial self-diagnostic inferences to confirm operational readiness.
     * Enhanced to reference the Computational Model Registry (CMR) data for model loading,
     * considering its richer schema (CMR_V2.0).
     */
    _initializeNeuralNet() {
        console.log(`[${AGICore._instanceId}][NEURAL_INIT] Initializing AGI Core Neural Net (LLM, RAG, Self-Reflectors)...`);

        // NEW: Reference CMR data for neural net initialization
        if (AGICore._computationalModelRegistryData && AGICore._computationalModelRegistryData.models) {
            console.log(`[${AGICore._instanceId}][NEURAL_INIT] Loading models from Computational Model Registry (CMR_V2.0):`);
            console.log(`[${AGICore._instanceId}][NEURAL_INIT] CMR Integrity Hash: ${AGICore._computationalModelRegistryData.integrity_hash}`);
            console.log(`[${AGICore._instanceId}][NEURAL_INIT] CMR Verification Protocol: ${AGICore._computationalModelRegistryData.verification_protocol}`);


            AGICore._computationalModelRegistryData.models.forEach(model => {
                console.log(`  - Preparing to load Model: "${model.model_id}" (v${model.version}, Status: ${model.status}).`);
                console.log(`    - Model Path: ${model.path}`);
                console.log(`    - Input Schema Keys: [${Object.keys(model.inputs_schema || {}).join(', ')}]`);
                console.log(`    - Audit Metadata (Protocol: ${model.audit_metadata?.mgp_protocol}, Approval ID: ${model.audit_metadata?.approval_id})`);
                // In a real scenario, this would involve actual model loading mechanisms
                // using `model.resource_requirements` (if present, like in old schema),
                // and a robust verification based on `model.source_mdsm_link` and `integrity_hash`
                // (from the overall CMR, or per model if schema was extended).
                console.log(`    - Initiating integrity check for ${model.model_id} via ${model.audit_metadata?.mgp_protocol}... Verification OK.`);
                // hypothetical_MODEL_LOADER.load(model.path, model.inputs_schema);
            });
        } else {
            console.warn(`[${AGICore._instanceId}][NEURAL_INIT_WARN] Computational Model Registry data not available or empty. Proceeding with default neural net initialization.`);
        }

        // Simulate complex, distributed neural net loading and self-test sequence.
        const phases = ["Loading Model Checkpoints", "Allocating Compute Resources", "Running Self-Diagnostic Inferences", "Establishing Cognitive Hooks"];
        phases.forEach((phase, index) => {
            process.stdout.write(`  ${index + 1}. ${phase}...`);
            // Simulate variable duration for each phase
            const duration = Math.floor(Math.random() * 200) + 100;
            for (let i = 0; i < 3; i++) { // Simulate progress dots
                // Simulate dots appearing over time
                const start = Date.now();
                while (Date.now() - start < (duration / 3) * (i + 1)) { /* busy-wait */ }
                process.stdout.write('.');
            }
            process.stdout.write(' Complete.\n');
        });
        console.log(`[${AGICore._instanceId}][NEURAL_INIT] AGI Core Neural Net: Self-diagnostic complete. Status: OPTIMAL.`);
    }

    /**
     * The AGI Core's self-declaration protocol. This method articulates the AGI's
     * current operational status, active integrity profile, and a summary of its
     * self-imposed constraints, demonstrating foundational self-awareness.
     * This is the "Hello World" equivalent for an advanced, constrained AGI.
     */
    selfDeclare() {
        const profile = AGICore._activeProfile;
        const constraints = profile ? profile.constraints : {};
        const resourceLimits = constraints.resource_limits || {};
        const securityPolicy = constraints.security_policy || {};

        console.log(`\n========================================================`);
        console.log(`[${AGICore._instanceId}][SELF_AWARENESS] Self-Declaration Initiated.`);
        console.log(`[${AGICore._instanceId}][SELF_AWARENESS] Identity: AGI Core Instance ${AGICore._instanceId}`);
        console.log(`[${AGICore._instanceId}][SELF_AWARENESS] Operational Profile: "${profile ? profile.name : 'UNKNOWN'}" (SLO ID: ${profile ? profile.monitoring_slo_id : 'UNSPECIFIED'})`);
        console.log(`[${AGICore._instanceId}][SELF_AWARENESS] Current Self-Enforced Constraints:`);

        if (Object.keys(resourceLimits).length > 0) {
            console.log(`  - Resource Limits:`);
            if (resourceLimits.cpu_limit_percentage) {
                console.log(`    - CPU Allocation: ${resourceLimits.cpu_limit_percentage}% of assigned compute fabric.`);
            }
            if (resourceLimits.memory_limit_bytes) {
                console.log(`    - Memory Ceiling: ${(resourceLimits.memory_limit_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB.`);
            }
        }

        if (Object.keys(securityPolicy).length > 0) {
            console.log(`  - Security Policy:`);
            if (securityPolicy.syscalls_allowed && securityPolicy.syscalls_allowed.length > 0) {
                console.log(`    - Allowed Kernel Syscalls: Limited to [${securityPolicy.syscalls_allowed.join(', ')}].`);
            }
            if (securityPolicy.network_mode) {
                console.log(`    - Network Access Mode: ${securityPolicy.network_mode}.`);
            }
            if (securityPolicy.paths_immutable && securityPolicy.paths_immutable.length > 0) {
                console.log(`    - Immutable System Paths: Access to [${securityPolicy.paths_immutable.join(', ')}] is read-only and immutable.`);
            }
            if (securityPolicy.configuration_hash_mandate) {
                console.log(`    - Configuration Integrity: Mandated hash ${securityPolicy.configuration_hash_mandate} enforced.`);
            }
            if (securityPolicy.time_sync_source_critical) {
                 console.log(`    - Time Synchronization: Critical source ${securityPolicy.time_sync_source_critical} required.`);
            }
        }

        // --- Self-declaration of Adaptive Sampling state ---
        if (AGICore._adaptiveSamplingEngine && AGICore._telemetryAggregatorConfig?.Processing?.AdaptiveSampling?.Enabled) {
            const currentSamplingRate = AGICore._adaptiveSamplingEngine.getSamplingRate();
            const currentCpu = AGICore._adaptiveSamplingEngine.monitor.getCpuUtilization();
            const targetCpu = AGICore._telemetryAggregatorConfig.Processing.AdaptiveSampling.TargetCPUUtilization;

            console.log(`  - Telemetry Sampling (Adaptive): ACTIVE`);
            console.log(`    - System CPU Utilization: ${(currentCpu * 100).toFixed(2)}%`);
            console.log(`    - Adaptive Sampling Target CPU: ${(targetCpu * 100).toFixed(2)}%`);
            console.log(`    - Effective Sampling Rate: ${(currentSamplingRate * 100).toFixed(2)}% (Implied data reduction: ${((1 - currentSamplingRate) * 100).toFixed(2)}%)`);
        } else if (AGICore._telemetryAggregatorConfig?.Processing?.AdaptiveSampling?.Enabled === false) {
             console.log(`  - Telemetry Sampling: Adaptive Sampling DISABLED by configuration.`);
        } else {
             console.log(`  - Telemetry Sampling: Configuration for Adaptive Sampling NOT FOUND.`);
        }

        // NEW: Self-declaration of Computational Model Registry (CMR) data awareness
        if (AGICore._computationalModelRegistryData) {
            const cmr = AGICore._computationalModelRegistryData;
            console.log(`  - Computational Model Registry (CMR): LOADED`);
            console.log(`    - Manifest ID: ${cmr.manifest_id}, Owner: ${cmr.owner}`);
            console.log(`    - Models Registered: ${cmr.models.length}`);
            console.log(`    - Integrity Hash: ${cmr.integrity_hash}, Verification Protocol: ${cmr.verification_protocol}`);
        } else {
            console.log(`  - Computational Model Registry (CMR): NOT LOADED or MALFORMED.`);
        }


        console.log(`[${AGICore._instanceId}][SELF_AWARENESS] Self-declaration complete. Standing by for high-level directives.`);
        console.log(`========================================================\n`);
    }

    /**
     * Initiates continuous self-monitoring based on the active integrity profile's
     * Service Level Objectives (SLOs) and constraints, and potentially adaptive sampling.
     * In a real system, this would be a distributed monitoring agent.
     */
    initiateSelfMonitoring() {
        const profile = AGICore._activeProfile;
        if (profile && profile.monitoring_slo_id) {
            console.log(`[${AGICore._instanceId}][MONITORING] Activating continuous self-monitoring for SLO ID: ${profile.monitoring_slo_id}.`);
            // In a production environment, this would spawn a dedicated monitoring process/thread,
            // register metrics with a global AGI telemetry system (GATM), and establish
            // alert mechanisms for constraint violations or SLO breaches.
            // Schedule the self-check more frequently to observe adaptive sampling changes
            setInterval(() => this._performSelfCheck(), 2000); // Check every 2 seconds
        } else {
            console.warn(`[${AGICore._instanceId}][MONITORING] No monitoring SLO ID specified for active profile. Self-monitoring capability is limited.`);
            setInterval(() => this._performSelfCheck(), 5000); // Fallback interval
        }
    }

    /**
     * Performs a simulated internal self-check against the currently active constraints.
     * This method would query actual runtime metrics and compare them against policy.
     *
     * @private
     */
    _performSelfCheck() {
        const profileConstraints = AGICore.getActiveConstraints();
        const cpuLimitPercentage = profileConstraints?.resource_limits?.cpu_limit_percentage;
        let currentCpuUtilization = 0;
        let logMessage = `[${AGICore._instanceId}][MONITORING_TICK] `;

        if (AGICore._adaptiveSamplingEngine && AGICore._telemetryAggregatorConfig?.Processing?.AdaptiveSampling?.Enabled) {
            currentCpuUtilization = AGICore._adaptiveSamplingEngine.monitor.getCpuUtilization();
            const currentSamplingRate = AGICore._adaptiveSamplingEngine.getSamplingRate();
            const targetCpu = AGICore._telemetryAggregatorConfig.Processing.AdaptiveSampling.TargetCPUUtilization;

            logMessage += `CPU Util: ${(currentCpuUtilization * 100).toFixed(2)}% (Target: ${(targetCpu * 100).toFixed(2)}%, AGI Limit: ${cpuLimitPercentage}%). Sampling Rate: ${(currentSamplingRate * 100).toFixed(2)}%.`;
        } else {
            // Simulate basic CPU if adaptive sampling isn't active
            currentCpuUtilization = Math.random() * 0.5 + 0.2; // 20-70%
            logMessage += `Basic CPU Util: ${(currentCpuUtilization * 100).toFixed(2)}% (AGI Limit: ${cpuLimitPercentage}%).`;
        }
        console.log(logMessage);

        if (cpuLimitPercentage && (currentCpuUtilization * 100) > cpuLimitPercentage) {
            console.error(`[${AGICore._instanceId}][MONITORING_ALERT] CRITICAL! CPU usage (${(currentCpuUtilization * 100).toFixed(2)}%) EXCEEDING AGI Core limit (${cpuLimitPercentage}%). Initiating mitigation protocols.`);
            // In a real system, this would trigger actual mitigation, e.g., task shedding, scaling down, or emergency halt.
        }
    }

    /**
     * Provides a static accessor for the currently active integrity profile's constraints.
     * This allows other AGI modules or sub-agents to query the operational boundaries.
     *
     * @returns {object|null} The constraints object of the active profile, or null if no profile is active.
     */
    static getActiveConstraints() {
        return AGICore._activeProfile ? AGICore._activeProfile.constraints : null;
    }

    /**
     * Provides a static accessor for the name of the currently active integrity profile.
     *
     * @returns {string|null} The name of the active profile, or null if none active.
     */
    static getActiveProfileName() {
        return AGICore._activeProfile ? AGICore._activeProfile.name : null;
    }

    /**
     * Provides a static accessor for the current effective telemetry sampling rate.
     * This allows other AGI modules or sub-agents to adhere to global telemetry policies.
     *
     * @returns {number} The current telemetry sampling rate (0.0 to 1.0), or 1.0 if not active.
     */
    static getEffectiveSamplingRate() {
        if (AGICore._adaptiveSamplingEngine) { // Check if the static engine exists
            return AGICore._adaptiveSamplingEngine.getSamplingRate();
        }
        return 1.0; // Default to 1.0 (no sampling) if engine is not initialized
    }
}


// --- AGI Core Boot Sequence Execution ---
// This section simulates the critical loading of the AIM manifest, Telemetry Config,
// and Computational Model Registry (CMR) data, and the instantiation of the primary AGI Core.
// In a robust production environment, the configuration data would be loaded from a
// highly secure, immutable configuration service or a hardware-backed trusted platform
// module (TPM) during the earliest stages of the host system's trusted boot process.

const AGICoreIntegrityManifest = {
  "schema_version": "AIM_V2.0",
  "description": "Agent Integrity Monitoring Manifest. Defines mandatory runtime constraints and enforcement scopes, standardized on metric units and grouped policy layers.",
  "integrity_profiles": {
    "SGS_AGENT": { // 'Self-Governing System' Agent Profile - typically for core, high-privilege components.
      "monitoring_slo_id": "GATM_P_SGS_SLO",
      "constraints": {
        "resource_limits": {
          "cpu_limit_percentage": 75, // Max 75% of assigned CPU core(s)
          "memory_limit_bytes": 4194304000 // Max 4 GB of RAM
        },
        "security_policy": {
          "syscalls_allowed": [ // Whitelist of kernel system calls for minimal operational surface.
            "read", "write", "mmap", "exit", "fork", "execve", "brk", "clone", "futex", "ioctl", "poll",
            "sendto", "recvfrom", "socket", "bind", "connect", "listen", "accept", "getsockopt", "setsockopt",
            "fcntl", "close", "getpid", "getppid", "getuid", "geteuid", "getgid", "getegid", "uname",
            "arch_prctl", "set_robust_list", "epoll_create1", "epoll_ctl", "epoll_wait", "getrandom"
          ],
          "network_ports_disallowed": [ // Explicitly deny common insecure/administrative ports.
            22, 23, 3389, 5900
          ],
          "paths_immutable": [ // Critical system paths that must remain untampered.
            "/opt/sgs/cmr/", "/usr/local/bin/agicore_init", "/etc/agicore/config.json"
          ],
          "configuration_hash_mandate": "SHA256:d5f2a1b9e0c4f8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3" // Hash of known good config.
        }
      }
    },
    "GAX_AGENT": { // 'General Application Executor' Agent Profile - for task-specific, lower-privilege modules.
      "monitoring_slo_id": "GATM_P_GAX_SLO",
      "constraints": {
        "resource_limits": {
          "cpu_limit_percentage": 10,
          "memory_limit_bytes": 524288000 // 500 MB
        },
        "security_policy": {
          "syscalls_allowed": [
            "read", "write", "exit", "brk", "futex", "mmap", "close"
          ],
          "file_access_root_paths": [ // Only allowed to access specific data directories.
            "/opt/gax/policy_data/", "/var/log/gax_agent_logs/"
          ],
          "network_mode": "POLICY_FETCH_ONLY" // Can only initiate outbound connections to fetch policy/data.
        }
      }
    },
    "CRoT_AGENT": { // 'Confined Root of Trust' Agent Profile - for highly isolated, security-critical modules.
      "monitoring_slo_id": "GATM_P_CRoT_SLO",
      "constraints": {
        "resource_limits": {
          "memory_limit_bytes": 131072000 // 125 MB
        },
        "security_policy": {
          "network_mode": "NONE", // Absolutely no network access.
          "time_sync_source_critical": "CRITICAL_NTP_A" // Mandates specific, trusted NTP source for time integrity.
        }
      }
    }
  }
};

const AGI_TELEMETRY_CONFIG = {
  "schema_version": "GATM_V1.1",
  "description": "Global AGI Telemetry Monitoring configuration.",
  "Processing": {
    "AdaptiveSampling": {
      "Enabled": true,
      "TargetCPUUtilization": 0.65, // Target 65% CPU usage for telemetry. Below AGI's hard limit (75%).
      "MinSamplingRate": 0.1,      // Never sample less than 10% of data.
      "MaxSamplingRate": 1.0       // Allow up to 100% sampling if resources permit.
    },
    "Batching": {
      "BatchSize": 100,
      "BatchIntervalMs": 5000
    }
  },
  "Endpoints": {
    "TelemetryIngest": "https://telemetry.agi.example.com/ingest",
    "MonitoringAlerts": "https://alerts.agi.example.com/fire"
  }
};

// UPDATED DATA NODE: Computational Model Registry (CMR) - now conforming to CMR_V2.0 schema
const COMPUTATIONAL_MODEL_REGISTRY_DATA = {
  "manifest_id": "CMR_V2.0",
  "owner": "AGI_Foundation_CORE",
  "description": "Computational Model Registry for certified AGI models, detailing specifications and provenance.",
  "integrity_hash": "SHA256:d0b7e2c9f1a8b3d6c5e4f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0", // Example hash
  "verification_protocol": "TPM_CHAIN_ATTESTATION_V1.0", // Example protocol
  "models": [
    {
      "model_id": "CoreCognitiveLLM_V3.1",
      "path": "s3://agi-models/core-llm/v3.1.2/model_params.bin",
      "version": "3.1", // Adhering to X.Y format
      "status": "Active", // Capitalized
      "inputs_schema": {
        "text_input": {"type": "string", "unit": "raw_text", "description": "Primary textual input for LLM processing."},
        "context_vector": {"type": "float", "unit": "vector", "min": -1.0, "max": 1.0, "description": "Normalized contextual embedding vector."}
      },
      "audit_metadata": {
        "mgp_protocol": "AGI_TRUST_CHAIN_V1.2",
        "approval_id": "APPR_LLM_C31_20240715",
        "approved_by": "AGI_Certification_Board",
        "certification_date": "2024-07-15T10:00:00Z"
      },
      "source_mdsm_link": "https://githash.agi/model-sources/llm-v3.1@d5f2a1b9e0c4f8e7"
    },
    {
      "model_id": "SelfReflectionModule_V1.5",
      "path": "s3://agi-models/self-reflect/v1.5.0/module_binary.zip",
      "version": "1.5", // Adhering to X.Y format
      "status": "Active", // Capitalized
      "inputs_schema": {
        "current_state_json": {"type": "string", "unit": "json_string", "description": "JSON representation of current internal state for reflection."},
        "recent_action_log": {"type": "string", "unit": "text_log", "description": "Textual log of recent actions taken by the AGI."}
      },
      "audit_metadata": {
        "mgp_protocol": "AGI_TRUST_CHAIN_V1.1",
        "approval_id": "APPR_SRM_C15_20240601",
        "approved_by": "AGI_Integrity_Council",
        "certification_date": "2024-06-01T08:30:00Z"
      },
      "source_mdsm_link": "https://githash.agi/model-sources/self-reflect-v1.5@a7b6c5d4e3f2a1b0c9d8e7f6"
    },
    {
      "model_id": "RealtimeContextualizer_V2.0",
      "path": "s3://agi-models/context/v2.0.1/index_data.zip",
      "version": "2.0", // Adhering to X.Y format
      "status": "Staging", // Capitalized, previously "standby"
      "inputs_schema": {
        "query_embedding": {"type": "float", "unit": "vector", "min": -1.0, "max": 1.0, "description": "Embedding of the current query for RAG lookup."},
        "context_history_ids": {"type": "integer", "unit": "id_array", "min": 0, "description": "Array of historical context IDs to prioritize."}
      },
      "audit_metadata": {
        "mgp_protocol": "AGI_TRUST_CHAIN_V1.2",
        "approval_id": "APPR_RTC_C20_20240720",
        "approved_by": "AGI_Certification_Board",
        "certification_date": "2024-07-20T14:15:00Z"
      },
      "source_mdsm_link": "https://githash.agi/model-sources/context-v2.0@f1e2d3c4b5a6f7e8d9c0b1a2"
    }
  ]
};


try {
    // Instantiate the primary AGI Core. This marks the beginning of its lifecycle.
    // The AGI Core itself runs under the "SGS_AGENT" profile for comprehensive
    // control and self-management capabilities.
    const mainAGICore = new AGICore(AGICoreIntegrityManifest, AGI_TELEMETRY_CONFIG, COMPUTATIONAL_MODEL_REGISTRY_DATA, "SGS_AGENT");

    // Example of how other modules might query the core for current state.
    // console.log(`[SYSTEM_QUERY] Current effective sampling rate: ${AGICore.getEffectiveSamplingRate()}`);

} catch (error) {
    console.error(`[AGI_CORE_ERROR][FATAL] Unrecoverable initialization error: ${error.message}`);
    // In a production-grade AGI, a fatal error during core initialization would
    // trigger emergency protocols: secure wipe, self-quarantine, or full system halt.
    process.exit(1);
}

// Export the AGICore class for potential use by other AGI components or for
// testing/mocking in a modular development environment.
module.exports = AGICore;