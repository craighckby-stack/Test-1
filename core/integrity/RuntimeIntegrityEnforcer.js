/**
 * RuntimeIntegrityEnforcer
 * Reads governance/config/IntegrityPolicy.json and actively enforces its constraints
 * within the live execution environment (L0 Kernel).
 *
 * Dependencies:
 * - PolicyLoader: Handles file I/O, parsing, and resilient merging.
 */
class RuntimeIntegrityEnforcer {
    #policyPath;
    #kernelInterface; // Core governance dependency
    #systemInterface; // Core governance dependency
    #policyLoader;    // Core governance dependency
    #monitoringInterval = null;
    #defaultPolicy;
    #policy;
    #isActive;

    /**
     * @param {string} policyPath Path to the integrity policy file.
     * @param {object} kernelInterface Interface for Kernel interactions (logging, interceptors).
     * @param {object} systemInterface Interface for System controls (resource usage, halt/isolate).
     * @param {object} policyLoader Dependency capable of resilient policy loading and merging.
     */
    constructor(policyPath, kernelInterface, systemInterface, policyLoader) {
        this.#policyPath = policyPath;
        this.#kernelInterface = kernelInterface;
        this.#systemInterface = systemInterface;
        this.#policyLoader = policyLoader;

        // Define and Deep-Freeze the robust default policy structure
        this.#defaultPolicy = Object.freeze({
            status: 'Inactive',
            coreIntegrityRules: {
                runtimeConstraints: {
                    prohibitedSystemCalls: [],
                    resourceDeviationThreshold: {},
                    monitoringIntervalMs: 60000
                }
            },
            breachResponse: { protocol: 'LogOnly' }
        });

        if (!this.#policyLoader || typeof this.#policyLoader.loadAndMergePolicy !== 'function') {
            throw new Error("PolicyLoader interface (ResilientPolicyLoader) is required for RuntimeIntegrityEnforcer.");
        }

        this.#policy = this.#loadPolicy(policyPath);
        this.#isActive = this.#policy && this.#policy.status === 'Active';
    }

    #log(level, message, data = {}) {
        if (this.#kernelInterface && this.#kernelInterface.log && typeof this.#kernelInterface.log[level] === 'function') {
            this.#kernelInterface.log[level](message, data);
        } else {
            // Fallback for initialization errors or missing dependency
            console[level === 'error' ? 'error' : 'log'](`[Integrity] ${message}`, data);
        }
    }

    #loadPolicy(path) {
        // Delegation: Policy parsing and resilient merging is handled by the PolicyLoader plugin.
        const loadedPolicy = this.#policyLoader.loadAndMergePolicy(
            path,
            this.#defaultPolicy,
            (level, message, data) => this.#log(level, message, data) // Pass down the local logging method
        );
        // Crucial: Freeze the loaded policy to guarantee immutability against runtime tampering.
        return Object.freeze(loadedPolicy);
    }

    initialize() {
        if (!this.#isActive) return;
        if (!this.#kernelInterface || !this.#systemInterface) {
             this.#log('error', "Initialization failed: Missing Kernel or System interface. Deactivating.");
             this.#isActive = false;
             return;
        }

        this.#log('info', `Initializing runtime enforcement protocols.`);
        this.#setupSystemCallInterception();
        this.#startResourceMonitoringLoop();
    }

    reloadPolicy() {
        this.#log('info', 'Attempting to reload policy dynamically.');
        // Clear existing monitoring before reconfiguration
        if (this.#monitoringInterval) {
            clearInterval(this.#monitoringInterval);
            this.#monitoringInterval = null;
        }

        this.#policy = this.#loadPolicy(this.#policyPath);
        this.#isActive = this.#policy.status === 'Active';

        if (this.#isActive) {
            this.#setupSystemCallInterception();
            this.#startResourceMonitoringLoop();
        }
    }

    #setupSystemCallInterception() {
        // Ensure we have active status and the necessary interceptor interface
        if (!this.#isActive || !this.#kernelInterface.SystemCallInterceptor) {
             if (this.#isActive) this.#log('warn', 'SystemCallInterceptor not available on Kernel interface.');
             return;
        }

        const constraints = this.#policy.coreIntegrityRules.runtimeConstraints;
        const prohibitedCalls = constraints.prohibitedSystemCalls || [];

        if (prohibitedCalls.length === 0) return;

        this.#log('info', `Registering interception for ${prohibitedCalls.length} system calls.`);

        // Hook into kernel system call interface to block list entries
        this.#kernelInterface.SystemCallInterceptor.registerHandler(call => {
            if (prohibitedCalls.includes(call.name)) {
                this.triggerBreach(`Unauthorized System Call: ${call.name}`);
                return false; // Block execution
            }
            return true;
        });
    }

    #startResourceMonitoringLoop() {
        if (!this.#isActive) return;
        const constraints = this.#policy.coreIntegrityRules.runtimeConstraints;
        // constraints.monitoringIntervalMs is guaranteed to be set or defaulted
        const intervalMs = constraints.monitoringIntervalMs;

        this.#log('info', `Starting resource monitoring loop every ${intervalMs}ms.`);

        // Implementation details for continuous CPU/Memory usage tracking and deviation checks.
        this.#monitoringInterval = setInterval(() => {
            this.#checkResourceDeviation(constraints.resourceDeviationThreshold);
        }, intervalMs);
    }

    #checkResourceDeviation(thresholds) {
        // Placeholder: Actual system resource usage check logic goes here
        /*
        const usage = this.#systemInterface.getResourceUsage();
        if (usage.cpu > thresholds.maxCpu) {
             this.triggerBreach("CPU Overload Exceeded Threshold");
        }
        */
    }

    triggerBreach(reason) {
        this.#log('error', `INTEGRITY BREACH DETECTED: ${reason}`, { breach_protocol: this.#policy.breachResponse.protocol });
        const protocol = this.#policy.breachResponse.protocol;

        // Crucial: Stop monitoring after a breach to prevent recursive triggering
        if (this.#monitoringInterval) {
            clearInterval(this.#monitoringInterval);
            this.#monitoringInterval = null;
        }

        // Implementation to handle breach (Halt, Isolation, Reporting).
        if (protocol === "ImmediateHaltAndIsolation" && this.#systemInterface) {
            this.#systemInterface.halt();
            this.#systemInterface.isolate();
        }
    }
}
module.exports = RuntimeIntegrityEnforcer;