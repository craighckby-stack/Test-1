/**
 * Autonomous Code Evolution Proposal: GPR Fallback Cache Service.
 * Rationale: Critical parameters (load_stage: STARTUP) must be available
 * even if the GPR endpoint is temporarily unreachable. This service
 * handles local persistence and retrieval of configuration snapshots.
 */

import { CriticalParameterSetDefinition } from './gpr.types';

// Assume the external plugin interface (CanonicalConfigurationCacheTool) is available globally or injected.
declare const CanonicalConfigurationCacheTool: {
    loadFromCache(setId: string): Promise<ParameterData | null>;
    updateCache(setId: string, data: ParameterData): Promise<void>;
};

export interface ParameterData {
    [key: string]: any;
}

/**
 * Manages local persistence and retrieval of critical GPR parameters
 * to ensure high availability and robust startup operation.
 * Leverages CanonicalConfigurationCacheTool for persistence abstraction and staleness checking.
 */
export class GPRFallbackService {
    // CACHE_DIR is now managed by the underlying persistence tool and is no longer needed here.
    
    // Inject the plugin utility, or rely on global scope if environment dictates
    private readonly cacheUtility = CanonicalConfigurationCacheTool;

    constructor(private readonly criticalSets: CriticalParameterSetDefinition[]) {
        // Initialization logic related to criticalSets (e.g., ensuring all required IDs are known)
    }

    /**
     * Attempts to read a critical parameter set from the local cache storage.
     * Includes implicit staleness check handled by the underlying utility.
     * @param setId The identifier of the critical set.
     */
    public async loadFromCache(setId: string): Promise<ParameterData | null> {
        console.debug(`Attempting fallback load via cache utility for critical set: ${setId}`);
        
        // Delegating persistence and staleness check to the plugin
        const data = await this.cacheUtility.loadFromCache(setId);

        if (data === null) {
            console.warn(`Fallback cache miss or entry was stale for ${setId}.`);
        }
        
        return data;
    }

    /**
     * Updates the local cache for a specific parameter set after a successful remote fetch.
     * @param setId The identifier of the set.
     * @param data The successfully retrieved parameter data.
     */
    public async updateCache(setId: string, data: ParameterData): Promise<void> {
        // Delegating serialization and persistence update to the plugin
        await this.cacheUtility.updateCache(setId, data);
        console.log(`Delegated cache update successful for ${setId}.`);
    }
}