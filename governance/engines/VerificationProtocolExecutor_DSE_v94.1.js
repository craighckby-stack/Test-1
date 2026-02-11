/**
 * Autonomous SCoT/ACVD Verification Protocol Executor (VPE v94.1).
 * Implements logic defined in ASGL_v94.1_config.json's 'check_protocol'.
 */

declare const IntegrityFailurePolicyEnforcerTool: { 
    enforce: (ruleId: string, message: string, policy: any, actions: any) => { halted: boolean } 
}; // Tool declaration
declare const SystemAPI: any; // External dependency
declare const LogService: any; // External dependency (unused but kept for context)
declare const SystemIntegrityActionsProvider: { 
    getActions: () => { 
        logBreach: (rid: string, msg: string, sev: string) => void;
        initiateAudit: (rid: string, sev: string) => void;
        emergencyHalt: (payload: any) => void;
    }
}; // New abstraction dependency

class VerificationProtocolExecutor {
    #rules;
    #IntegrityFailurePolicyEnforcerTool;
    #SystemIntegrityActionsProvider;
    #SystemAPI;

    constructor(config) {
        this.#setupDependencies(config);
    }

    /**
     * Goal: Extract synchronous dependency resolution and initialization.
     */
    #setupDependencies(config) {
        // Resolve external dependencies (assuming global availability as declared)
        this.#IntegrityFailurePolicyEnforcerTool = IntegrityFailurePolicyEnforcerTool;
        this.#SystemIntegrityActionsProvider = SystemIntegrityActionsProvider;
        this.#SystemAPI = SystemAPI;
        
        // Initialize internal state
        this.#rules = config.verification_rules;
    }

    // --- I/O Proxies for External Interactions ---

    #delegateToSystemAPIExecution(method, params) {
        // Proxy for SystemAPI.executeProtocol
        return this.#SystemAPI.executeProtocol(method, params);
    }

    #resolveSystemActions() {
        // Proxy for SystemIntegrityActionsProvider.getActions
        return this.#SystemIntegrityActionsProvider.getActions();
    }

    #delegateToPolicyEnforcement(ruleId, message, policy, enforcementActions) {
        // Proxy for IntegrityFailurePolicyEnforcerTool.enforce
        const tool = this.#IntegrityFailurePolicyEnforcerTool;
        
        if (typeof tool === 'object' && tool && tool.enforce) {
             return tool.enforce(ruleId, message, policy, enforcementActions);
        }
        return null; // Indicates tool missing or unavailable
    }
    
    #logError(message) {
        // Proxy for console.error
        console.error(message);
    }

    #logBreach(ruleId, message, severity, actions) {
        // Proxy for actions.logBreach
        actions.logBreach(ruleId, message, severity);
    }

    #initiateAudit(ruleId, severity, actions) {
        // Proxy for actions.initiateAudit
        actions.initiateAudit(ruleId, severity);
    }

    #emergencyHalt(payload, actions) {
        // Proxy for actions.emergencyHalt
        actions.emergencyHalt(payload);
    }

    // --- Core Logic ---

    async executeAllChecks() {
        const results = [];
        for (const rule of this.#rules) {
            let status = { passed: false, message: "Protocol execution failed." };
            
            try {
                // Use I/O Proxy
                status = await this.#delegateToSystemAPIExecution(rule.check_protocol.method, rule.check_protocol.params);
            } catch (error) {
                status.message = `Engine Error during ${rule.id}: ${error.message}`;
            }

            let isHalt = false;
            if (!status.passed) {
                // Use private failure handler
                isHalt = this.#handleFailure(rule.id, status.message, rule.failure_policy);
            }

            if (isHalt) {
                // Stop further checks if a critical halt occurred due to policy enforcement
                results.push({ ruleId: rule.id, status: status.passed, policy: rule.failure_policy, halted: true });
                break; 
            }
            results.push({ ruleId: rule.id, status: status.passed, policy: rule.failure_policy, halted: false });
        }
        return results;
    }

    /**
     * Handles failure based on policy using the IntegrityFailurePolicyEnforcer Tool via proxies.
     * @returns {boolean} True if the system was instructed to halt.
     */
    #handleFailure(ruleId, message, policy) {
        // Resolve standardized system actions via proxy
        const enforcementActions = this.#resolveSystemActions();
        
        // Delegate to policy enforcement tool via proxy
        const result = this.#delegateToPolicyEnforcement(ruleId, message, policy, enforcementActions);
        
        if (result) {
             return result.halted;
        } else {
             // CRITICAL: Fallback logic if tool is missing. Use I/O proxies for all runtime actions.
             this.#logError("IntegrityFailurePolicyEnforcerTool missing. Executing manual failure policy.");
             
             // Use standardized actions for fallback consistency via proxies
             this.#logBreach(ruleId, message, policy.severity, enforcementActions);
             
             if (policy.trigger_audit) {
                 this.#initiateAudit(ruleId, policy.severity, enforcementActions);
             }
             if (policy.severity === 'CRITICAL' && policy.handler && policy.handler.includes('HALT')) {
                 this.#emergencyHalt({ reason: 'ASGL_CRITICAL_FAILURE_MANUAL', ruleId }, enforcementActions);
                 return true;
             }
             return false;
        }
    }
}

module.exports = VerificationProtocolExecutor;