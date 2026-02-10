/**
 * ParameterCustodian: Service responsible for read, validation, and atomic mutation 
 * of the core governance parameters defined in governanceParams.json.
 * It enforces SecurityThresholds and checks ComplexityGrowthLimitPerCycle before commitment.
 */

// Assuming the GovernanceParameterConstraintValidator plugin is available via AGI-KERNEL environment
declare const GovernanceParameterConstraintValidator: {
    execute(args: { currentParams: any, proposedParams: any }): { valid: boolean, message?: string }[];
};

class ParameterCustodian {
    private configPath: string;
    private currentParams: any;

    constructor(governanceConfigPath: string) {
        this.configPath = governanceConfigPath;
        // NOTE: require is used for synchronous file loading in Node environment
        this.currentParams = require(governanceConfigPath); 
    }

    /**
     * Utility to fetch deeply nested parameters.
     */
    read(keyPath: string): any {
        return keyPath.split('.').reduce((o, i) => (o ? o[i] : o), this.currentParams);
    }

    async validateMutation(proposedParams: any): Promise<boolean> {
        if (typeof GovernanceParameterConstraintValidator === 'undefined') {
            throw new Error("GovernanceParameterConstraintValidator plugin is unavailable.");
        }

        const results = GovernanceParameterConstraintValidator.execute({
            currentParams: this.currentParams,
            proposedParams: proposedParams
        });

        const invalidResults = results.filter(r => !r.valid);
        
        if (invalidResults.length > 0) {
            // Concatenate all failure messages
            const failureMessage = invalidResults.map(r => r.message).join(' | ');
            throw new Error(`Mutation failed governance constraints: ${failureMessage}`);
        }

        return true; 
    }

    async commit(proposedParams: any): Promise<void> {
        await this.validateMutation(proposedParams);
        
        // Atomic write to disk and system reload/policy update 
        // ... logic for writing proposedParams to configPath ...

        this.currentParams = proposedParams;
        console.log("Governance parameters updated successfully.");
    }
}

module.exports = ParameterCustodian;