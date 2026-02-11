import { RobustConfigInitializer } from '@AGI-KERNEL/RobustConfigInitializer';

/**
 * Defines the strict schema for governance configuration.
 * This ensures type safety, default values, and environment variable mapping.
 */
const GOVERNANCE_SCHEMA = Object.freeze({
    MAX_POLICY_SIZE: { 
        type: 'number', 
        default: 1024, 
        envKey: 'GOV_MAX_POLICY_SIZE',
        description: 'Maximum allowable size for a policy definition (in bytes).'
    },
    CONCURRENCY_LIMIT: { 
        type: 'number', 
        default: 50, 
        envKey: 'GOV_CONCURRENCY_LIMIT',
        description: 'Global concurrency limit for asynchronous policy evaluations.'
    },
    AUDIT_LOG_LEVEL: { 
        type: 'string', 
        default: 'info', 
        envKey: 'GOV_AUDIT_LOG_LEVEL',
        allowedValues: ['debug', 'info', 'warn', 'error']
    },
    CACHE_TTL_MS: { 
        type: 'number', 
        default: 300000, // 5 minutes
        envKey: 'GOV_CACHE_TTL_MS'
    }
});

/**
 * Key used for caching the canonical configuration.
 */
const CONFIG_CACHE_KEY = 'GOVERNANCE_SETTINGS_CANONICAL_V1';

let governanceSettingsAccessors: Readonly<Record<string, () => any>> | null = null;

/**
 * Loads and caches the governance settings using the abstracted configuration pipeline.
 */
function loadGovernanceSettings() {
    if (governanceSettingsAccessors) {
        return governanceSettingsAccessors;
    }

    try {
        // Uses RobustConfigInitializer to handle Loading, Coercion, Caching, and Accessor Generation.
        governanceSettingsAccessors = RobustConfigInitializer.execute({
            schema: GOVERNANCE_SCHEMA,
            cacheKey: CONFIG_CACHE_KEY,
            source: process.env // Pass environment variables as source
        });

        return governanceSettingsAccessors;

    } catch (error) {
        console.error("CRITICAL: Failed to initialize governance settings.", error);
        throw new Error("InitializationFailure: Governance settings could not be loaded or validated.");
    }
}

// Export a frozen accessor utility that encapsulates the settings.
// Usage: GovernanceSettings.MAX_POLICY_SIZE()
export const GovernanceSettings = loadGovernanceSettings();