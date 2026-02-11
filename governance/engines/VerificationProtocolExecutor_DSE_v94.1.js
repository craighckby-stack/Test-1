/**
 * Autonomous SCoT/ACVD Verification Protocol Executor (VPE v94.1).
 * Implements logic defined in ASGL_v94.1_config.json's 'check_protocol'.
 */

declare const IntegrityFailurePolicyEnforcerTool: { 
    enforce: (ruleId: string, message: string, policy: any, actions: any) => { halted: boolean } 
}; // Tool declaration
declare const SystemAPI: any; // External dependency
declare const LogService: any; // External dependency
declare const SystemIntegrityActionsProvider: { 
    getActions: () => { 
        logBreach: (rid: string, msg: string, sev: string) => void;
        initiateAudit: (rid: string, sev: string) => void;
        emergencyHalt: (payload: any) => void;
    }
}; // New abstraction dependency

class VerificationProtocolExecutor {
    constructor(config) {
        this.rules = config.verification_rules;
    }

    async executeAllChecks() {
        const results = [];
        for (const rule of this.rules) {
            let status = { passed: false, message: "Protocol execution failed." };
            
            try {
                // Dynamic execution based on rule.check_protocol.method
                status = await SystemAPI.executeProtocol(rule.check_protocol.method, rule.check_protocol.params);
            } catch (error) {
                status.message = `Engine Error during ${rule.id}: ${error.message}`;
            }

            let isHalt = false;
            if (!status.passed) {
                isHalt = this.handleFailure(rule.id, status.message, rule.failure_policy);
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
     * Handles failure based on policy using the IntegrityFailurePolicyEnforcer Tool.
     * Actions are retrieved via the SystemIntegrityActionsProvider abstraction.
     * @returns {boolean} True if the system was instructed to halt.
     */
    handleFailure(ruleId, message, policy) {
        // Retrieve standardized system actions (mapping abstract names to concrete system calls)
        const enforcementActions = SystemIntegrityActionsProvider.getActions();
        
        // Use the extracted policy enforcement tool
        if (typeof IntegrityFailurePolicyEnforcerTool === 'object' && IntegrityFailurePolicyEnforcerTool.enforce) {
             const result = IntegrityFailurePolicyEnforcerTool.enforce(ruleId, message, policy, enforcementActions);
             return result.halted;
        } else {
             // CRITICAL: Fallback logic if tool is missing
             console.error("IntegrityFailurePolicyEnforcerTool missing. Executing manual failure policy.");
             
             // Use standardized actions for fallback consistency
             enforcementActions.logBreach(ruleId, message, policy.severity);
             
             if (policy.trigger_audit) {
                 enforcementActions.initiateAudit(ruleId, policy.severity);
             }
             if (policy.severity === 'CRITICAL' && policy.handler && policy.handler.includes('HALT')) {
                 enforcementActions.emergencyHalt({ reason: 'ASGL_CRITICAL_FAILURE_MANUAL', ruleId });
                 return true;
             }
             return false;
        }
    }
}

module.exports = VerificationProtocolExecutor;