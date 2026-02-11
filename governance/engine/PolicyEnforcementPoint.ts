import * as fs from 'fs';

/**
 * Interface definition for the policy evaluation tool/plugin.
 * This tool is responsible for implementing the complex policy matching logic.
 */
export interface PolicyEvaluationEngineTool {
    execute(args: { policy: any, scope: string, data: string }): { allowed: boolean, action: string, message?: string };
}

export class PolicyEnforcementPoint {
    private policy: any;
    private evaluator: PolicyEvaluationEngineTool; 

    /**
     * Initializes the PolicyEnforcementPoint by loading the policy file
     * and injecting the necessary evaluation engine dependency.
     * 
     * This refactoring replaces global lookup with explicit constructor injection
     * for improved testability and dependency management.
     * 
     * @param policyPath The file path to the JSON policy configuration.
     * @param evaluator The PolicyEvaluationEngineTool instance.
     */
    constructor(policyPath: string, evaluator: PolicyEvaluationEngineTool) {
        if (!evaluator) {
             throw new Error("Critical dependency PolicyEvaluationEngineTool is missing.");
        }

        try {
            this.policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
            // Basic validation check after loading
            if (!this.policy.policyId || !this.policy.policyVersion) {
                throw new Error("Policy structure invalid (missing policyId or policyVersion).");
            }
            console.log(`[PEP] Loaded Policy: ${this.policy.policyId} v${this.policy.policyVersion}`);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Failed to load or parse governance policy from ${policyPath}: ${errorMessage}`);
        }

        this.evaluator = evaluator;
    }

    /** Synchronously checks input data against defined filters based on target scope. */
    public enforce(scope: string, data: string): { allowed: boolean, action: string, message?: string } {
        // Delegate complex evaluation logic to the specialized plugin
        return this.evaluator.execute({
            policy: this.policy,
            scope: scope,
            data: data
        });
    }
}