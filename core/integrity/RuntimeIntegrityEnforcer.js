const fs = require('fs');

/**
 * RuntimeIntegrityEnforcer
 * Reads governance/config/IntegrityPolicy.json and actively enforces its constraints
 * within the live execution environment (L0 Kernel).
 */
class RuntimeIntegrityEnforcer {
    constructor(policyPath, kernelInterface, systemInterface) {
        this.policyPath = policyPath;
        this.Kernel = kernelInterface; // Dependency Injection for Kernel interaction
        this.System = systemInterface; // Dependency Injection for System control
        this.monitoringInterval = null;
        
        this.policy = this._loadPolicy(policyPath);
        this.isActive = this.policy && this.policy.status === 'Active';
    }

    _loadPolicy(path) {
        try {
            const data = fs.readFileSync(path, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`[Integrity] ERROR: Failed to load policy from ${path}. Using inactive defaults.`, error.message);
            // Return a safe, inactive default policy
            return {
                status: 'Inactive',
                coreIntegrityRules: { runtimeConstraints: { prohibitedSystemCalls: [], resourceDeviationThreshold: {}, monitoringIntervalMs: 60000 } },
                breachResponse: { protocol: 'LogOnly' }
            };
        }
    }

    initialize() {
        if (!this.isActive) return;
        if (!this.Kernel || !this.System) {
             console.error("[Integrity] Initialization failed: Missing Kernel or System interface. Deactivating.");
             this.isActive = false;
             return;
        }

        console.log(`[Integrity] Initializing runtime enforcement protocols.`);
        this._setupSystemCallInterception();
        this._startResourceMonitoringLoop();
    }
    
    reloadPolicy() {
        console.log('[Integrity] Attempting to reload policy dynamically.');
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
        if (!this.isActive || !this.Kernel.SystemCallInterceptor) return; 
        
        const constraints = this.policy.coreIntegrityRules.runtimeConstraints;
        const prohibitedCalls = constraints.prohibitedSystemCalls || [];
        
        if (prohibitedCalls.length === 0) return;

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
        const intervalMs = constraints.monitoringIntervalMs || 5000; 

        console.log(`[Integrity] Starting resource monitoring loop every ${intervalMs}ms.`);
        
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
        console.error(`INTEGRITY BREACH DETECTED: ${reason}`);
        const protocol = this.policy.breachResponse ? this.policy.breachResponse.protocol : "LogOnly";
        
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