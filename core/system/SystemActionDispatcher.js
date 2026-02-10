/*
 * System Action Dispatcher (SAD)
 * Objective: Execute mandated actions resulting from Policy Compliance violations or high-level system directives.
 * Role: Interface between the Governance Plane (PCE) and the Execution Plane. Handles logging, auditing, and sequencing of complex actions.
 */

// Mock implementation of external services for registration readability
const executionPlane = { enforceIsolation: (id: string) => console.log(`[EXEC] Enforcing isolation on ${id}`) };
const systemManager = { executeSecureTermination: (score: number) => console.log(`[EXEC] Initiating secure termination (Score: ${score})`) };
const resourceAllocator = { adjustCapacity: (delta: number) => console.log(`[EXEC] Adjusting capacity by ${delta}`) };
const AuditService = { recordPolicyViolation: (code: string, details: any) => console.log(`[AUDIT] Violation recorded: ${code}`) };

// Assume global accessor for the plugin, defined in the plugin block below.
declare var MandatedActionExecutionTool: {
    register: (code: string, executor: (details: any) => any) => boolean;
    execute: (args: { actionCode: string, details: any }) => { success: boolean, result?: any, error?: string };
};

/**
 * Initializes the Action Dispatcher by registering all mandated actions 
 * with the underlying execution tool.
 */
function initializeActionRegistry() {
    if (typeof MandatedActionExecutionTool === 'undefined' || !MandatedActionExecutionTool.register) {
        console.error("MandatedActionExecutionTool is unavailable. Dispatcher is inert.");
        return;
    }

    // 1. ISOLATE_SUBSYSTEM
    MandatedActionExecutionTool.register('ISOLATE_SUBSYSTEM', (details) => {
        AuditService.recordPolicyViolation('ISOLATE_SUBSYSTEM', details);
        // High-security operation: Notify Security Module, trigger firewall changes, limit data egress.
        const subsystemId = details?.context?.subsystemId || 'UNKNOWN_SUB';
        return executionPlane.enforceIsolation(subsystemId);
    });

    // 2. SELF_TERMINATE_MISSION
    MandatedActionExecutionTool.register('SELF_TERMINATE_MISSION', (details) => {
        AuditService.recordPolicyViolation('SELF_TERMINATE_MISSION', details);
        // Critical failure protocol: Initiate secure shutdown, erase volatile state, trigger external alert.
        const score = details?.score || 0;
        return systemManager.executeSecureTermination(score);
    });

    // 3. ADAPTIVE_SCALE_DOWN
    MandatedActionExecutionTool.register('ADAPTIVE_SCALE_DOWN', (details) => {
        AuditService.recordPolicyViolation('ADAPTIVE_SCALE_DOWN', details);
        // Standard adjustment: Resource optimization (e.g., scale down by 10%)
        return resourceAllocator.adjustCapacity(-0.1);
    });

    console.log("[SAD] Action registry initialization complete.");
}


class SystemActionDispatcher {
    
    // Ensure initialization runs once when the class is loaded.
    static {
        initializeActionRegistry();
    }

    /**
     * Executes the specific mandated system action based on policy evaluation.
     * The execution logic is delegated to the MandatedActionExecutionTool.
     * @param {string} actionCode - The policy mandated action (e.g., 'ISOLATE_SUBSYSTEM').
     * @param {Object} details - Contextual details leading to the action (metrics, score, context, etc.).
     */
    static dispatchAction(actionCode: string, details: any) {
        console.log(`[SAD] Initiating mandated action: ${actionCode}`);
        
        if (typeof MandatedActionExecutionTool === 'undefined') {
             console.error(`[SAD] Failed to dispatch ${actionCode}: Execution tool not loaded.`);
             return;
        }

        // Use the tool to execute the pre-registered action
        const result = MandatedActionExecutionTool.execute({ 
            actionCode: actionCode, 
            details: details 
        });

        if (!result.success) {
            console.error(`[SAD] Action dispatch failed for ${actionCode}. Reason: ${result.error || 'Action failed unexpectedly.'}`);
        } else {
            console.log(`[SAD] Action ${actionCode} completed.`);
        }
    }
}

export { SystemActionDispatcher };