/**
 * RuntimeIntegrityEnforcer
 * Reads governance/config/IntegrityPolicy.json and actively enforces its constraints
 * within the live execution environment (L0 Kernel).
 * 
 * Dependencies:
 * - PolicyLoader: Handles file I/O, parsing, and resilient merging.
 */
class RuntimeIntegrityEnforcer {
    constructor(policyPath, kernelInterface, systemInterface, policyLoader) {
        this.policyPath = policyPath;
        this.Kernel = kernelInterface; // Dependency Injection for Kernel interaction
        this.System = systemInterface; // Dependency Injection for System control
        this.PolicyLoader = policyLoader; // Dependency Injection for Policy loading
        this.monitoringInterval = null;
        
        // Define a robust, safe default structure for policy loading
        this.defaultPolicy = {
            status: 'Inactive',
            coreIntegrityRules: {
                runtimeConstraints: {
                    prohibitedSystemCalls: [],
                    resourceDeviationThreshold: {},
                    monitoringIntervalMs: 60000
                }
            },
            breachResponse: { protocol: 'LogOnly' }
        };

        if (!this.PolicyLoader || typeof this.PolicyLoader.loadAndMergePolicy !== 'function') {
            throw new Error("PolicyLoader interface (ResilientPolicyLoader) is required for RuntimeIntegrityEnforcer.");
        }

        this.policy = this._loadPolicy(policyPath);
        this.isActive = this.policy && this.policy.status === 'Active';
    }

    _log(level, message, data = {}) {
        if (this.Kernel && this.Kernel.log && typeof this.Kernel.log[level] === 'function') {
            this.Kernel.log[level](message, data);
        } else {
            // Fallback for initialization errors or missing dependency
            console[level === 'error' ? 'error' : 'log'](`[Integrity] ${message}`, data);
        }
    }

    _loadPolicy(path) {
        // Delegation: Policy parsing and resilient merging is now handled by the PolicyLoader plugin.
        return this.PolicyLoader.loadAndMergePolicy(
            path, 
            this.defaultPolicy, 
            (level, message, data) => this._log(level, message, data) // Pass down the local logging method
        );
    }

    initialize() {
        if (!this.isActive) return;
        if (!this.Kernel || !this.System) {
             this._log('error', "Initialization failed: Missing Kernel or System interface. Deactivating.");
             this.isActive = false;
             return;
        }

        this._log('info', `Initializing runtime enforcement protocols.`);
        this._setupSystemCallInterception();
        this._startResourceMonitoringLoop();
    }
    
    reloadPolicy() {
        this._log('info', 'Attempting to reload policy dynamically.');
        // Clear existing monitoring before reconfiguration
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.policy = this._loadPolicy(this.policyPath);
        this.isActive = this.policy.status === 'Active';
        
        if (this.isActive) {
            this._setupSystemCallInterception();
            this._startResourceMonitoringLoop();
        }
    }

    _setupSystemCallInterception() {
        // Ensure we have active status and the necessary interceptor interface
        if (!this.isActive || !this.Kernel.SystemCallInterceptor) {
             if (this.isActive) this._log('warn', 'SystemCallInterceptor not available on Kernel interface.');
             return; 
        }
        
        // Constraints are guaranteed to exist due to robust policy loading in _loadPolicy
        const constraints = this.policy.coreIntegrityRules.runtimeConstraints;
        const prohibitedCalls = constraints.prohibitedSystemCalls || [];
        
        if (prohibitedCalls.length === 0) return;

        this._log('info', `Registering interception for ${prohibitedCalls.length} system calls.`);

        // Hook into kernel system call interface to block list entries
        this.Kernel.SystemCallInterceptor.registerHandler(call => {
            if (prohibitedCalls.includes(call.name)) {
                this.triggerBreach(`Unauthorized System Call: ${call.name}`);
                return false; // Block execution
            }
            return true;
        });
    }

    _startResourceMonitoringLoop() {
        if (!this.isActive) return;
        const constraints = this.policy.coreIntegrityRules.runtimeConstraints;
        // constraints.monitoringIntervalMs is guaranteed to be set or defaulted
        const intervalMs = constraints.monitoringIntervalMs; 

        this._log('info', `Starting resource monitoring loop every ${intervalMs}ms.`);
        
        // Implementation details for continuous CPU/Memory usage tracking and deviation checks.
        this.monitoringInterval = setInterval(() => {
            this._checkResourceDeviation(constraints.resourceDeviationThreshold);
        }, intervalMs);
    }
    
    _checkResourceDeviation(thresholds) {
        // Placeholder: Actual system resource usage check logic goes here
        /*
        const usage = this.System.getResourceUsage();
        if (usage.cpu > thresholds.maxCpu) {
             this.triggerBreach("CPU Overload Exceeded Threshold");
        }
        */
    }

    triggerBreach(reason) {
        this._log('error', `INTEGRITY BREACH DETECTED: ${reason}`, { breach_protocol: this.policy.breachResponse.protocol });
        const protocol = this.policy.breachResponse.protocol;
        
        // Crucial: Stop monitoring after a breach to prevent recursive triggering
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        // Implementation to handle breach (Halt, Isolation, Reporting).
        if (protocol === "ImmediateHaltAndIsolation" && this.System) {
            this.System.halt();
            this.System.isolate();
        }
    }
}
module.exports = RuntimeIntegrityEnforcer;