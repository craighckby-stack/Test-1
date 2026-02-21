/**
 * AGI Core: Project "Hello World" - Evolved to v0.2.1-beta
 *
 * This version introduces the Component Manifest Registry (CMR) for defining
 * and managing the AGI's broader ecosystem of internal modules and external
 * service integrations. The AGI Core now actively simulates interactions
 * with these registered components, enhancing its awareness of the operational
 * environment beyond its immediate process. This expands the AGI's ability
 * to react to ecosystem changes, providing a more robust simulation of an
 * interconnected intelligence.
 *
 * Current Integrations:
 * - Basic AGI Operational Loop (Simulated)
 * - Agent Integrity Monitoring (AIM) Framework
 *   - Integrity Profile Management
 *   - Runtime Constraint Simulation & Reporting
 *   - Security Policy Enforcement Simulation
 * - Adaptive Sampling Engine (ASE)
 *   - Resource Utilization Monitoring (Simulated)
 *   - Dynamic Sampling Rate Calculation
 *   - Telemetry Load Management (Simulated)
 * - Component Manifest Registry (CMR) Framework
 *   - Component Lifecycle & Capability Management
 *   - Simulated Ecosystem Interaction & Health Checks
 */

// --- Global Configuration and Manifest Data ---
const AGI_CORE_CONFIG = {
    AGENT_ID: "SGS_AGENT", // This AGI instance identifies as an 'SGS_AGENT'
    INTEGRITY_CHECK_INTERVAL_MS: 5000, // Perform integrity checks every 5 seconds
    SIMULATED_CPU_LOAD_RANGE: [10, 80], // Min/Max simulated CPU usage percentage (0-100)
    SIMULATED_MEMORY_LOAD_RANGE_MB: [500, 3500], // Min/Max simulated memory usage in MB
    MANDATED_CONFIG_HASH: "SHA256:d5f2a1b9e0c4_AGI_CORE_INIT_HASH", // Simulated initial config hash
};

const AIM_MANIFEST = {
    "schema_version": "AIM_V2.0",
    "description": "Agent Integrity Monitoring Manifest. Defines mandatory runtime constraints and enforcement scopes, standardized on metric units and grouped policy layers.",
    "integrity_profiles": {
        "SGS_AGENT": {
            "monitoring_slo_id": "GATM_P_SGS_SLO",
            "constraints": {
                "resource_limits": {
                    "cpu_limit_percentage": 75,
                    "memory_limit_bytes": 4194304000 // 4 GB
                },
                "security_policy": {
                    "syscalls_allowed": [
                        "read",
                        "write",
                        "mmap",
                        "exit"
                    ],
                    "network_ports_disallowed": [
                        22,
                        23,
                        8080 // Added for simulation purposes
                    ],
                    "paths_immutable": [
                        "/opt/sgs/gacr/",
                        "/var/log/agisys/" // Added for simulation purposes
                    ],
                    "configuration_hash_mandate": AGI_CORE_CONFIG.MANDATED_CONFIG_HASH // Reference from AGI config
                }
            }
        },
        "GAX_AGENT": {
            "monitoring_slo_id": "GATM_P_GAX_SLO",
            "constraints": {
                "resource_limits": {
                    "cpu_limit_percentage": 10,
                    "memory_limit_bytes": 524288000 // 500 MB
                },
                "security_policy": {
                    "syscalls_allowed": [
                        "read",
                        "exit"
                    ],
                    "file_access_root_paths": [
                        "/opt/gax/policy_data/"
                    ],
                    "network_mode": "POLICY_FETCH_ONLY"
                }
            }
        },
        "CRoT_AGENT": {
            "monitoring_slo_id": "GATM_P_CRoT_SLO",
            "constraints": {
                "resource_limits": {
                    "memory_limit_bytes": 131072000 // 125 MB
                },
                "security_policy": {
                    "network_mode": "NONE",
                    "time_sync_source_critical": "CRITICAL_NTP_A"
                }
            }
        }
    }
};

const TELEMETRY_AGGREGATION_CONFIG = {
    "Processing": {
        "AdaptiveSampling": {
            "Enabled": true,
            "TargetCPUUtilization": 0.70, // Target CPU usage as a float (0.0 - 1.0)
            "MaxSamplingRate": 1.0, // Don't sample more than 100% of data
            "MinSamplingRate": 0.1, // Always sample at least 10% of data
            "SamplingRateAdjustmentFactor": 0.05 // How aggressively to adjust the rate
        }
    }
};

const GACR_CMR_MANIFEST = {
    "schema_version": "CMR_V1.0",
    "description": "Component Manifest Registry. Defines registered AGI modules and external interfaces.",
    "components": {
        "TelemetryProcessor": {
            "type": "processing_unit",
            "purpose": "Processes raw telemetry, applies adaptive sampling.",
            "capabilities": ["data_aggregation", "filtering", "sampling"],
            "communication": {
                "input_protocols": ["UDP", "Kafka"],
                "output_protocols": ["HTTP/S", "gRPC"],
                "endpoints": {
                    "telemetry_ingest": "udp://localhost:5000",
                    "config_update": "http://localhost:8081/config"
                }
            },
            "resource_profile": {
                "expected_cpu_load_percentage_range": [10, 30],
                "expected_memory_mb_range": [500, 1500]
            },
            "dependencies": ["DataStoreService", "AIM_Reporting"],
            "security_context": {
                "required_auth": "TLS_MUTUAL",
                "allowed_syscalls_subset": ["read", "write", "socket"]
            }
        },
        "SensorGatewayA": {
            "type": "sensor_interface",
            "purpose": "Ingests data from environmental sensors.",
            "capabilities": ["data_collection", "preprocessing", "data_forwarding"],
            "communication": {
                "input_protocols": ["Modbus", "MQTT"],
                "output_protocols": ["Kafka"],
                "endpoints": {
                    "sensor_data_out": "kafka://broker1:9092/sensor_topic"
                }
            },
            "resource_profile": {
                "expected_cpu_load_percentage_range": [5, 15],
                "expected_memory_mb_range": [100, 300]
            },
            "dependencies": [],
            "security_context": {
                "required_auth": "API_KEY",
                "data_encryption": "AES256"
            }
        },
        "DecisionEngineX": {
            "type": "control_unit",
            "purpose": "Makes operational decisions based on processed data.",
            "capabilities": ["decision_making", "policy_enforcement", "actuator_command"],
            "communication": {
                "input_protocols": ["Kafka"],
                "output_protocols": ["gRPC"],
                "endpoints": {
                    "decision_input": "kafka://broker1:9092/decisions_topic",
                    "command_output": "grpc://localhost:50051"
                }
            },
            "resource_profile": {
                "expected_cpu_load_percentage_range": [20, 40],
                "expected_memory_mb_range": [1000, 2500]
            },
            "dependencies": ["TelemetryProcessor", "KnowledgeBase"],
            "security_context": {
                "required_auth": "TLS_MUTUAL",
                "integrity_check_frequency_sec": 30
            }
        },
        "KnowledgeBaseService": {
            "type": "data_store",
            "purpose": "Stores and retrieves contextual knowledge for decision-making.",
            "capabilities": ["data_storage", "query_interface", "semantic_search"],
            "communication": {
                "input_protocols": ["gRPC", "REST"],
                "output_protocols": ["gRPC", "REST"],
                "endpoints": {
                    "query_interface": "grpc://localhost:50052",
                    "management_api": "http://localhost:8082/kb"
                }
            },
            "resource_profile": {
                "expected_cpu_load_percentage_range": [15, 25],
                "expected_memory_mb_range": [1000, 3000]
            },
            "dependencies": [],
            "security_context": {
                "required_auth": "TLS_MUTUAL",
                "data_at_rest_encryption": "AES256"
            }
        }
    }
};

// --- Utility Functions ---

/**
 * Simulates generating a SHA256 hash. In a real system, this would be cryptographically secure.
 * @param {string} data - The data to hash.
 * @returns {string} - A simulated SHA256 hash string.
 */
function generateSHA256Hash(data) {
    // For simulation, we just use a simple string representation.
    // In production, use Node's 'crypto' module.
    return `SHA256:${data.length}-${data.substring(0, 8)}...${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Simulates current CPU usage percentage (0-100).
 * @returns {number} - A random number representing CPU usage (0-100).
 */
function getCurrentCpuUsagePercentage() {
    const [min, max] = AGI_CORE_CONFIG.SIMULATED_CPU_LOAD_RANGE;
    // Introduce occasional spikes for more dynamic sampling behavior
    const spike = Math.random() < 0.1 ? Math.floor(Math.random() * 30) : 0; // 10% chance of a spike up to 30%
    return Math.min(100, Math.floor(Math.random() * (max - min + 1)) + min + spike);
}

/**
 * Simulates current memory usage in bytes.
 * @returns {number} - A random number representing memory usage in bytes.
 */
function getMemoryUsageBytes() {
    const [minMB, maxMB] = AGI_CORE_CONFIG.SIMULATED_MEMORY_LOAD_RANGE_MB;
    const minBytes = minMB * 1024 * 1024;
    const maxBytes = maxMB * 1024 * 1024;
    return Math.floor(Math.random() * (maxBytes - minBytes + 1)) + minBytes;
}

/**
 * A simple logger for AGI events.
 * @param {string} level - Log level (e.g., 'INFO', 'WARN', 'ERROR', 'DEBUG').
 * @param {string} component - The component emitting the log.
 * @param {string} message - The log message.
 * @param {object} [details] - Optional additional details.
 */
function agiLogger(level, component, message, details = {}) {
    const timestamp = new Date().toISOString();
    // Only log DEBUG if a debug flag were set in a real system. For now, log all.
    console.log(`[${timestamp}] [${level}] [${component}] ${message}`, Object.keys(details).length > 0 ? details : '');
}

// --- Agent Integrity Monitoring (AIM) System ---

/**
 * Manages the loading and retrieval of integrity profiles from the manifest.
 */
class IntegrityProfileManager {
    constructor(manifest) {
        if (!manifest || !manifest.integrity_profiles) {
            throw new Error("Invalid AIM manifest provided.");
        }
        this.manifest = manifest;
        this.profiles = manifest.integrity_profiles;
        agiLogger('INFO', 'IntegrityProfileManager', `AIM Manifest v${manifest.schema_version} loaded.`);
    }

    /**
     * Retrieves an integrity profile for a given agent ID.
     * @param {string} agentId - The ID of the agent.
     * @returns {object|null} The integrity profile or null if not found.
     */
    getProfile(agentId) {
        const profile = this.profiles[agentId];
        if (!profile) {
            agiLogger('ERROR', 'IntegrityProfileManager', `No integrity profile found for agent ID: ${agentId}`);
            return null;
        }
        agiLogger('INFO', 'IntegrityProfileManager', `Retrieved profile for ${agentId} (SLO: ${profile.monitoring_slo_id}).`);
        return profile;
    }
}

/**
 * Monitors and simulates enforcement of an agent's integrity profile constraints.
 * This class provides methods to check various aspects against the defined policies.
 */
class AgentIntegrityMonitor {
    constructor(agentId, integrityProfile) {
        if (!integrityProfile || !integrityProfile.constraints) {
            throw new Error("Invalid integrity profile provided for monitor.");
        }
        this.agentId = agentId;
        this.profile = integrityProfile;
        this.constraints = integrityProfile.constraints;
        this.violations = [];
        agiLogger('INFO', 'AgentIntegrityMonitor', `Monitor initialized for ${agentId}.`);
    }

    /**
     * Logs the compliance status of a specific check.
     * @param {string} type - The type of check (e.g., 'CPU_LIMIT', 'NETWORK_PORT').
     * @param {boolean} isCompliant - True if compliant, false otherwise.
     * @param {string} message - A descriptive message.
     * @param {object} [details] - Additional contextual details.
     * @returns {boolean} The compliance status.
     */
    _logCompliance(type, isCompliant, message, details = {}) {
        const status = isCompliant ? 'COMPLIANT' : 'VIOLATION';
        const level = isCompliant ? 'DEBUG' : 'WARN'; // DEBUG for fine-grained, WARN for violations
        agiLogger(level, `AIM:${this.agentId}:${type}`, `${status}: ${message}`, details);
        if (!isCompliant) {
            this.violations.push({ type, message, details, timestamp: new Date().toISOString() });
        }
        return isCompliant;
    }

    /**
     * Simulates checking CPU and memory resource limits.
     * @returns {boolean} True if all resource limits are compliant.
     */
    checkResourceLimits() {
        const { resource_limits } = this.constraints;
        if (!resource_limits) return true; // No resource limits defined, assume compliant.

        let compliant = true;

        // Simulate CPU usage check
        if (resource_limits.cpu_limit_percentage !== undefined) {
            const currentCpu = getCurrentCpuUsagePercentage();
            const cpuCompliant = currentCpu <= resource_limits.cpu_limit_percentage;
            compliant = this._logCompliance('CPU_LIMIT', cpuCompliant,
                `Current CPU: ${currentCpu}% vs Limit: ${resource_limits.cpu_limit_percentage}%`,
                { currentCpu, limit: resource_limits.cpu_limit_percentage }
            ) && compliant;
        }

        // Simulate Memory usage check
        if (resource_limits.memory_limit_bytes !== undefined) {
            const currentMemory = getMemoryUsageBytes();
            const memoryCompliant = currentMemory <= resource_limits.memory_limit_bytes;
            compliant = this._logCompliance('MEMORY_LIMIT', memoryCompliant,
                `Current Memory: ${(currentMemory / (1024 * 1024)).toFixed(2)}MB vs Limit: ${(resource_limits.memory_limit_bytes / (1024 * 1024)).toFixed(2)}MB`,
                { currentMemory, limit: resource_limits.memory_limit_bytes }
            ) && compliant;
        }
        return compliant;
    }

    /**
     * Simulates a syscall check.
     * @param {string} syscall - The syscall being attempted.
     * @returns {boolean} True if the syscall is allowed.
     */
    _simulateSyscallCheck(syscall) {
        const { security_policy } = this.constraints;
        if (!security_policy || !security_policy.syscalls_allowed) return true; // No policy, assume allowed
        return security_policy.syscalls_allowed.includes(syscall);
    }

    /**
     * Simulates a network connection attempt check.
     * @param {number} port - The port being accessed.
     * @returns {boolean} True if the port is not disallowed.
     */
    _simulateNetworkConnectionCheck(port) {
        const { security_policy } = this.constraints;
        if (!security_policy || !security_policy.network_ports_disallowed) return true; // No policy, assume allowed
        return !security_policy.network_ports_disallowed.includes(port);
    }

    /**
     * Simulates a file write attempt check for immutable paths.
     * @param {string} path - The path being written to.
     * @returns {boolean} True if the path is not immutable.
     */
    _simulateFileWriteCheck(path) {
        const { security_policy } = this.constraints;
        if (!security_policy || !security_policy.paths_immutable) return true;
        return !security_policy.paths_immutable.some(immutablePath => path.startsWith(immutablePath));
    }

    /**
     * Simulates a configuration hash validation.
     * @param {string} currentHash - The currently computed hash of the configuration.
     * @returns {boolean} True if the hash matches the mandate.
     */
    _simulateConfigHashCheck(currentHash) {
        const { security_policy } = this.constraints;
        if (!security_policy || !security_policy.configuration_hash_mandate) return true;
        return currentHash === security_policy.configuration_hash_mandate;
    }

    /**
     * Simulates checking file access based on root paths.
     * @param {string} path - The path being accessed.
     * @returns {boolean} True if the path is allowed by policy.
     */
    _simulateFileAccessRootPathCheck(path) {
        const { security_policy } = this.constraints;
        if (!security_policy || !security_policy.file_access_root_paths) return true; // No specific root path policy, assume compliant
        return security_policy.file_access_root_paths.some(rootPath => path.startsWith(rootPath));
    }

    /**
     * Simulates checking the current network mode against policy.
     * @param {string} currentNetworkMode - The AGI's current active network mode.
     * @returns {boolean} True if the mode is compliant.
     */
    _simulateNetworkModeCheck(currentNetworkMode) {
        const { security_policy } = this.constraints;
        if (!security_policy || !security_policy.network_mode) return true; // No specific network mode policy, assume compliant

        // This would involve more complex logic in a real system (e.g., checking actual network state)
        return currentNetworkMode === security_policy.network_mode;
    }

    /**
     * Simulates checking the time synchronization source.
     * @param {string} currentTimeSyncSource - The AGI's current time sync source.
     * @returns {boolean} True if the source is compliant.
     */
    _simulateTimeSyncSourceCheck(currentTimeSyncSource) {
        const { security_policy } = this.constraints;
        if (!security_policy || !security_policy.time_sync_source_critical) return true; // No critical time sync source policy, assume compliant
        return currentTimeSyncSource === security_policy.time_sync_source_critical;
    }


    /**
     * Performs a comprehensive check of all defined security policies.
     * @returns {boolean} True if all security policies are compliant.
     */
    checkSecurityPolicy() {
        const { security_policy } = this.constraints;
        if (!security_policy) return true; // No security policy, assume compliant.

        let compliant = true;

        // Syscall simulation (hypothetical execution of 'exec' which is not in SGS_AGENT policy)
        const attemptedSyscall = 'exec'; // Simulate an attempt for a forbidden syscall
        const syscallCompliant = this._simulateSyscallCheck(attemptedSyscall);
        compliant = this._logCompliance('SYSCALL_ACCESS', syscallCompliant,
            `Attempted syscall '${attemptedSyscall}'. Allowed: [${security_policy.syscalls_allowed || 'N/A'}]`,
            { attempted: attemptedSyscall, allowed: security_policy.syscalls_allowed }
        ) && compliant;

        // Network port simulation (hypothetical connection attempt to a disallowed port)
        const attemptedPort = 8080; // Simulate an attempt for a forbidden port
        const portCompliant = this._simulateNetworkConnectionCheck(attemptedPort);
        compliant = this._logCompliance('NETWORK_PORT_ACCESS', portCompliant,
            `Attempted network connection to port ${attemptedPort}. Disallowed: [${security_policy.network_ports_disallowed || 'N/A'}]`,
            { attempted: attemptedPort, disallowed: security_policy.network_ports_disallowed }
        ) && compliant;

        // Immutable path simulation (hypothetical write attempt to an immutable path)
        const attemptedImmutableWritePath = '/opt/sgs/gacr/critical_config.js';
        const immutablePathCompliant = this._simulateFileWriteCheck(attemptedImmutableWritePath);
        compliant = this._logCompliance('IMMUTABLE_PATH_WRITE', immutablePathCompliant,
            `Attempted write to immutable path '${attemptedImmutableWritePath}'. Immutable paths: [${security_policy.paths_immutable || 'N/A'}]`,
            { attempted: attemptedImmutableWritePath, immutable: security_policy.paths_immutable }
        ) && compliant;

        // Configuration hash mandate
        if (security_policy.configuration_hash_mandate) {
            const currentConfigHash = AGI_CORE_CONFIG.MANDATED_CONFIG_HASH; // For simulation, assume it's compliant by default
            const hashCompliant = this._simulateConfigHashCheck(currentConfigHash);
            compliant = this._logCompliance('CONFIG_HASH_MANDATE', hashCompliant,
                `Configuration hash validation. Current: '${currentConfigHash}', Mandated: '${security_policy.configuration_hash_mandate}'`,
                { currentHash: currentConfigHash, mandatedHash: security_policy.configuration_hash_mandate }
            ) && compliant;
        }

        // File access root paths (for GAX_AGENT, but can be checked for SGS_AGENT with empty policy)
        if (security_policy.file_access_root_paths) {
            const attemptedFileReadPath = '/usr/local/data/secret.txt'; // Hypothetical read outside allowed paths
            const fileAccessCompliant = this._simulateFileAccessRootPathCheck(attemptedFileReadPath);
            compliant = this._logCompliance('FILE_ACCESS_ROOT', fileAccessCompliant,
                `Attempted file access to '${attemptedFileReadPath}'. Allowed roots: [${security_policy.file_access_root_paths}]`,
                { attemptedPath: attemptedFileReadPath, allowedRoots: security_policy.file_access_root_paths }
            ) && compliant;
        }

        // Network mode (for GAX_AGENT and CRoT_AGENT)
        if (security_policy.network_mode) {
            const currentNetworkMode = "FULL_ACCESS"; // Simulate a non-compliant mode for GAX_AGENT/CRoT_AGENT
            const networkModeCompliant = this._simulateNetworkModeCheck(currentNetworkMode);
            compliant = this._logCompliance('NETWORK_MODE', networkModeCompliant,
                `Network mode compliance. Current: '${currentNetworkMode}', Policy: '${security_policy.network_mode}'`,
                { currentMode: currentNetworkMode, policyMode: security_policy.network_mode }
            ) && compliant;
        }

        // Time sync source (for CRoT_AGENT)
        if (security_policy.time_sync_source_critical) {
            const currentTimeSyncSource = "DEFAULT_NTP_B"; // Simulate a non-compliant source
            const timeSyncCompliant = this._simulateTimeSyncSourceCheck(currentTimeSyncSource);
            compliant = this._logCompliance('TIME_SYNC_SOURCE', timeSyncCompliant,
                `Time sync source compliance. Current: '${currentTimeSyncSource}', Critical: '${security_policy.time_sync_source_critical}'`,
                { currentSource: currentTimeSyncSource, criticalSource: security_policy.time_sync_source_critical }
            ) && compliant;
        }

        return compliant;
    }

    /**
     * Performs a full integrity check across all defined constraint categories.
     * @returns {boolean} True if the agent is fully compliant with its profile.
     */
    performFullIntegrityCheck() {
        agiLogger('INFO', 'AgentIntegrityMonitor', `Initiating full integrity check for ${this.agentId}...`);
        this.violations = []; // Clear previous violations

        const resourceCompliance = this.checkResourceLimits();
        const securityCompliance = this.checkSecurityPolicy();

        const overallCompliance = resourceCompliance && securityCompliance;

        if (overallCompliance) {
            agiLogger('INFO', 'AgentIntegrityMonitor', `Full integrity check passed for ${this.agentId}.`);
        } else {
            agiLogger('ERROR', 'AgentIntegrityMonitor', `Full integrity check FAILED for ${this.agentId}. ${this.violations.length} violations detected.`, { violations: this.violations });
            // In a real AGI, this might trigger remediation, shutdown, or alert.
        }
        return overallCompliance;
    }

    /**
     * Returns the list of detected violations during the last full check.
     * @returns {Array<object>} An array of violation objects.
     */
    getViolations() {
        return this.violations;
    }
}

// --- Adaptive Sampling Engine (ASE) System ---

/**
 * Simulates a resource monitor providing CPU utilization data.
 * This wraps existing global utility functions.
 */
class ResourceMonitor {
    constructor() {
        agiLogger('INFO', 'ResourceMonitor', 'ResourceMonitor initialized.');
    }

    /**
     * Retrieves current CPU utilization as a float between 0.0 and 1.0.
     * @returns {number} Current CPU utilization (e.g., 0.75 for 75%).
     */
    getCpuUtilization() {
        return getCurrentCpuUsagePercentage() / 100.0;
    }

    /**
     * Retrieves current memory utilization in bytes.
     * @returns {number} Current memory usage in bytes.
     */
    getMemoryUtilizationBytes() {
        return getMemoryUsageBytes();
    }
}

/**
 * AdaptiveSamplingEngine.ts
 *
 * Utility component required to implement the 'ResourceUtilization' AdaptiveSampling Policy
 * defined in TelemetryAggregatorConfig. It dynamically calculates the necessary
 * sampling rate based on monitored resource constraints (CPU/Memory/Queue Depth).
 */
class AdaptiveSamplingEngine {
    private config; // type: TelemetryAggregatorConfig['Processing']['AdaptiveSampling'];
    private monitor: ResourceMonitor;
    private currentSamplingRate: number; // Keep track of the current rate for smooth adjustments

    constructor(config) { // type: TelemetryAggregatorConfig['Processing']['AdaptiveSampling']
        this.config = config;
        this.monitor = new ResourceMonitor();
        this.currentSamplingRate = config.MaxSamplingRate; // Start at max sampling
        agiLogger('INFO', 'AdaptiveSamplingEngine', `Initialized with target CPU: ${config.TargetCPUUtilization * 100}%`);
    }

    /**
     * Calculates and adjusts the current required sampling rate (0.0 to 1.0) based on CPU utilization.
     * Uses a proportional adjustment to prevent erratic changes.
     */
    public getSamplingRate(): number {
        if (!this.config.Enabled) {
            return 1.0;
        }

        const currentCpu = this.monitor.getCpuUtilization(); // e.g., 0.95
        const targetCpu = this.config.TargetCPUUtilization;
        const adjustmentFactor = this.config.SamplingRateAdjustmentFactor || 0.05;

        let desiredRate = this.currentSamplingRate;

        if (currentCpu > targetCpu) {
            // CPU is too high, reduce sampling rate
            // Calculate a raw rate needed to bring CPU down, then adjust towards it
            const rawReductionFactor = targetCpu / currentCpu; // e.g., 0.7 / 0.9 = 0.77
            desiredRate = this.currentSamplingRate * rawReductionFactor;
            agiLogger('DEBUG', 'AdaptiveSamplingEngine', `CPU (${(currentCpu*100).toFixed(1)}%) > Target (${(targetCpu*100).toFixed(1)}%). Reducing sampling. Raw reduction factor: ${rawReductionFactor.toFixed(2)}`);
        } else if (currentCpu < targetCpu * 0.9) { // A bit of a buffer before increasing
            // CPU is low, increase sampling rate
            const rawIncreaseFactor = targetCpu / currentCpu; // e.g., 0.7 / 0.5 = 1.4
            desiredRate = this.currentSamplingRate * Math.min(rawIncreaseFactor, 1.0 + adjustmentFactor * 2); // Cap increase
            agiLogger('DEBUG', 'AdaptiveSamplingEngine', `CPU (${(currentCpu*100).toFixed(1)}%) < Target (${(targetCpu*100).toFixed(1)}%). Increasing sampling. Raw increase factor: ${rawIncreaseFactor.toFixed(2)}`);
        }
        // If CPU is close to target (target * 0.9 to target), maintain current rate.

        // Smooth the adjustment: move currentSamplingRate gradually towards desiredRate
        if (desiredRate > this.currentSamplingRate) {
            this.currentSamplingRate = Math.min(desiredRate, this.currentSamplingRate + adjustmentFactor);
        } else if (desiredRate < this.currentSamplingRate) {
            this.currentSamplingRate = Math.max(desiredRate, this.currentSamplingRate - adjustmentFactor);
        }


        // Ensure the rate stays within defined boundaries
        this.currentSamplingRate = Math.min(this.currentSamplingRate, this.config.MaxSamplingRate);
        this.currentSamplingRate = Math.max(this.currentSamplingRate, this.config.MinSamplingRate);

        return parseFloat(this.currentSamplingRate.toFixed(4));
    }
}

// --- Component Manifest Registry (CMR) System ---

/**
 * Manages the loading and retrieval of component manifests from the registry.
 */
class ComponentRegistryManager {
    constructor(manifest) {
        if (!manifest || !manifest.components) {
            throw new Error("Invalid CMR manifest provided.");
        }
        this.manifest = manifest;
        this.components = manifest.components;
        this.componentIds = Object.keys(this.components);
        agiLogger('INFO', 'ComponentRegistryManager', `CMR Manifest v${manifest.schema_version} loaded. Discovered ${this.componentIds.length} components.`);
    }

    /**
     * Retrieves a component's manifest details by its ID.
     * @param {string} componentId - The ID of the component.
     * @returns {object|null} The component manifest or null if not found.
     */
    getComponent(componentId) {
        const component = this.components[componentId];
        if (!component) {
            agiLogger('ERROR', 'ComponentRegistryManager', `No component manifest found for ID: ${componentId}`);
            return null;
        }
        return component;
    }

    /**
     * Returns a list of all registered component IDs.
     * @returns {string[]} An array of component IDs.
     */
    listComponentIds() {
        return this.componentIds;
    }

    /**
     * Simulates fetching status or interacting with a component in the ecosystem.
     * @param {string} componentId - The ID of the component to interact with.
     * @returns {object} A simulated status object.
     */
    simulateComponentInteraction(componentId) {
        const component = this.getComponent(componentId);
        if (!component) {
            return { status: 'ERROR', message: `Component ${componentId} not found.` };
        }

        const isHealthy = Math.random() > 0.1; // 10% chance of an unhealthy status
        const status = isHealthy ? 'OPERATIONAL' : 'DEGRADED';
        const message = isHealthy ? `${component.type} is functioning normally.` : `${component.type} experiencing minor issues.`;

        agiLogger(isHealthy ? 'DEBUG' : 'WARN', 'ComponentRegistryManager:Interaction',
            `Simulated interaction with ${componentId} (${component.type}). Status: ${status}`,
            { componentId, type: component.type, status, capabilities: component.capabilities.join(', ') }
        );

        return { componentId, status, message, type: component.type };
    }
}


// --- AGI Core System ---

class AGICore {
    constructor(agentId, aimManifest, telemetryConfig, cmrManifest) {
        this.agentId = agentId;
        this.integrityProfileManager = new IntegrityProfileManager(aimManifest);
        this.integrityMonitor = null;
        this.adaptiveSamplingEngine = new AdaptiveSamplingEngine(telemetryConfig.Processing.AdaptiveSampling);
        this.componentRegistryManager = new ComponentRegistryManager(cmrManifest); // NEW
        this.operationalLoopInterval = null;
        this.isOperational = false;
        this.currentSamplingRate = 1.0; // Initial sampling rate
        agiLogger('INFO', 'AGICore', `AGI Core v0.2.1-beta initializing for agent: ${this.agentId}`);
    }

    /**
     * Initializes the integrity monitoring system for the current agent.
     */
    _initializeIntegritySystem() {
        const profile = this.integrityProfileManager.getProfile(this.agentId);
        if (!profile) {
            agiLogger('CRITICAL', 'AGICore', `Failed to load integrity profile for ${this.agentId}. Cannot proceed.`);
            process.exit(1); // Critical error, AGI cannot operate without a profile.
        }
        this.integrityMonitor = new AgentIntegrityMonitor(this.agentId, profile);
        agiLogger('INFO', 'AGICore', `Integrity Monitoring System initialized with profile: ${profile.monitoring_slo_id}.`);
    }

    /**
     * Simulates a core AGI operation or task.
     * This operation is subject to adaptive sampling.
     * @param {string} task - Description of the simulated task.
     */
    _simulateSampledAGIOperation(task) {
        if (Math.random() < this.currentSamplingRate) {
            agiLogger('INFO', 'AGICore:Operation', `Performing AGI task: "${task}" (Sampled: YES)`);
            // In a real AGI, this would be complex decision-making, data processing, etc.
        } else {
            agiLogger('DEBUG', 'AGICore:Operation', `Skipped AGI task: "${task}" (Sampled: NO)`);
        }
    }

    /**
     * The main operational loop of the AGI Core.
     * Periodically performs integrity checks and simulates AGI operations,
     * adjusting operation frequency based on adaptive sampling.
     */
    _startOperationalLoop() {
        if (this.isOperational) {
            agiLogger('WARN', 'AGICore', 'Operational loop is already running.');
            return;
        }

        this.isOperational = true;
        agiLogger('INFO', 'AGICore', `Starting operational loop with integrity checks every ${AGI_CORE_CONFIG.INTEGRITY_CHECK_INTERVAL_MS}ms.`);

        this.operationalLoopInterval = setInterval(() => {
            agiLogger('INFO', 'AGICore', 'AGI Core operational tick.');

            // 1. Perform Integrity Check for *this* AGI Core
            const compliant = this.integrityMonitor.performFullIntegrityCheck();
            if (!compliant) {
                const violations = this.integrityMonitor.getViolations();
                agiLogger('ALERT', 'AGICore:ViolationResponse',
                    `Integrity violations detected! Initiating mitigation protocols... (Total: ${violations.length})`);
                // Placeholder for actual mitigation:
                // - Log detailed violations to a secure ledger
                // - Alert human operators
                // - Attempt to remediate (e.g., reduce resource usage, stop forbidden actions)
                // - If critical, trigger self-shutdown or failover.
            }

            // 2. Determine Adaptive Sampling Rate
            this.currentSamplingRate = this.adaptiveSamplingEngine.getSamplingRate();
            agiLogger('INFO', 'AGICore:AdaptiveSampling', `Current Sampling Rate: ${this.currentSamplingRate.toFixed(4)}`);


            // 3. Simulate AGI Operations (only if broadly compliant or minor violations)
            if (compliant || this.integrityMonitor.getViolations().length === 0) {
                 this._simulateSampledAGIOperation("Analyzing input streams for anomalies.");
                 this._simulateSampledAGIOperation("Optimizing internal resource allocation.");
                 this._simulateSampledAGIOperation("Generating predictive model updates.");
            } else {
                 agiLogger('WARN', 'AGICore:Operation', 'Operations paused or limited due to integrity violations.');
            }

            // 4. Component Ecosystem Interaction (NEW PHASE)
            if (this.componentRegistryManager.listComponentIds().length > 0) {
                const componentIds = this.componentRegistryManager.listComponentIds();
                const randomComponentId = componentIds[Math.floor(Math.random() * componentIds.length)];
                this.componentRegistryManager.simulateComponentInteraction(randomComponentId);

                // Simulate feeding this interaction into AGI Core's own operations
                if (Math.random() < 0.3) { // 30% chance to act on component status
                    const component = this.componentRegistryManager.getComponent(randomComponentId);
                    if (component) {
                        this._simulateSampledAGIOperation(`Adjusting behavior based on '${randomComponentId}' (${component.type}) status.`);
                    }
                }
            }


            // Simulate sporadic attempts that might cause violations
            if (Math.random() < 0.2) { // 20% chance to simulate a forbidden action
                const forbiddenActions = [
                    { type: 'syscall', name: 'exec' },
                    { type: 'port', port: 22 },
                    { type: 'write', path: '/opt/sgs/gacr/malicious.js' },
                    { type: 'port', port: 8080 } // Already in SGS_AGENT policy as disallowed
                ];
                const action = forbiddenActions[Math.floor(Math.random() * forbiddenActions.length)];
                agiLogger('DEBUG', 'AGICore:Simulation', `Simulating an attempted forbidden action: ${JSON.stringify(action)}`);
                // The monitor will catch this in the next checkSecurityPolicy() call.
            }

        }, AGI_CORE_CONFIG.INTEGRITY_CHECK_INTERVAL_MS);
    }

    /**
     * Starts the AGI Core.
     */
    start() {
        agiLogger('INFO', 'AGICore', 'Starting AGI Core sequence...');
        this._initializeIntegritySystem();
        this._startOperationalLoop();
        agiLogger('INFO', 'AGICore', 'AGI Core operational.');
    }

    /**
     * Stops the AGI Core.
     */
    stop() {
        agiLogger('INFO', 'AGICore', 'Stopping AGI Core operational loop.');
        clearInterval(this.operationalLoopInterval);
        this.isOperational = false;
        agiLogger('INFO', 'AGICore', 'AGI Core shutdown complete.');
    }
}

// --- AGI Core Execution ---
// This block simulates the deployment and startup of an AGI instance.
async function main() {
    agiLogger('INFO', 'Main', 'Initializing AGI Core...');

    const agiCore = new AGICore(
        AGI_CORE_CONFIG.AGENT_ID,
        AIM_MANIFEST,
        TELEMETRY_AGGREGATION_CONFIG,
        GACR_CMR_MANIFEST // NEW: Pass the Component Manifest Registry
    );
    agiCore.start();

    // In a real application, you might have signal handlers for graceful shutdown.
    // For this simulation, we'll let it run for a while.
    process.on('SIGINT', () => {
        agiLogger('WARN', 'Main', 'Received SIGINT. Shutting down AGI Core gracefully...');
        agiCore.stop();
        process.exit(0);
    });

    // Simulate some external interaction or extended runtime.
    // setTimeout(() => {
    //     agiCore.stop();
    //     agiLogger('INFO', 'Main', 'Simulated runtime complete. Exiting.');
    //     process.exit(0);
    // }, 60000); // Run for 60 seconds
}

// Execute the main function to start the AGI Core
main().catch(error => {
    agiLogger('CRITICAL', 'Main', 'Unhandled error during AGI Core execution:', error);
    process.exit(1);
});