// RTR: Rollback Threshold Registry (Config Store for PolicyEngine)

interface IConfigLoader {
    load(scopeKey: string, version: string): Promise<any>;
}

interface IVersionedConfigAccessUtility {
    setActiveVersion(versionId: string): void;
    getCurrentConfig(): Promise<any>;
    getConfigValue(key: string): Promise<any>;
}

// Assumed declaration for the newly extracted utility
declare const VersionedConfigAccessUtility: {
    create(dependencies: { loaderFn: (scopeKey: string, version: string) => Promise<any>, scopeKey: string }): IVersionedConfigAccessUtility;
};

/**
 * The RTR maintains the current active set of governance thresholds (C-15 parameters)
 * by delegating state and retrieval logic to the VersionedConfigAccessUtility.
 *
 * This allows the PolicyEngine to operate purely as an evaluator, abstracting policy
 * configuration away from execution logic, supporting dynamic, versioned policies.
 */
class RollbackThresholdRegistry {
    private thresholdAccessor: IVersionedConfigAccessUtility;

    constructor(configService: IConfigLoader) {
        // Bind the configService load function for dependency injection into the utility
        const loaderFn = (scopeKey: string, version: string) => configService.load(scopeKey, version);
        
        // Initialize the plugin instance to handle the specific governance scope
        this.thresholdAccessor = VersionedConfigAccessUtility.create({
            loaderFn: loaderFn,
            scopeKey: 'governance.rollback.thresholds'
        });
    }

    /** Retrieves all current active thresholds used by the PolicyEngine. */
    async getCurrentThresholds(): Promise<any> {
        return await this.thresholdAccessor.getCurrentConfig();
    }

    /**
     * Checks a specific threshold value against the active policy.
     * @param {string} key - The specific threshold identifier (e.g., 'maxEntropyDelta').
     */
    async getThreshold(key: string): Promise<any> {
        return await this.thresholdAccessor.getConfigValue(key);
    }
    
    /** Allows hot-swapping or versioning the policy definitions based on consensus. */
    setActiveVersion(versionId: string): void {
        this.thresholdAccessor.setActiveVersion(versionId);
        console.log(`RTR policy version set to ${versionId}`);
    }
}

module.exports = RollbackThresholdRegistry;
