import { EnvironmentConfigLoader } from '@AGI-KERNEL/EnvironmentConfigLoader';
import { CanonicalConfigurationCacheTool } from '@AGI-KERNEL/CanonicalConfigurationCacheTool';
import { SafeConfigurationCoercer } from '@AGI-KERNEL/SafeConfigurationCoercer';
import { ImmutableConfigAccessorGenerator } from '@AGI-KERNEL/ImmutableConfigAccessorGenerator'; // Newly utilized Plugin

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
 * Loads and caches the governance settings using a robust, multi-stage process:
 * 1. Environment Loading/Validation (Robust Env Handling).
 * 2. Data Coercion to Map (Efficient Data Structure).
 * 3. Configuration Caching (Caching Mechanism).
 * 4. Accessor Generation (Recursive Abstraction).
 */
function loadGovernanceSettings() {
    if (governanceSettingsAccessors) {
        // Optimization 2: Return cached accessors immediately
        return governanceSettingsAccessors;
    }

    try {
        // Step 1: Load configuration using schema defaults and environment variables
        const rawConfig = EnvironmentConfigLoader.execute({ 
            schema: GOVERNANCE_SCHEMA, 
            source: process.env 
        });

        // Step 2: Validate, coerce types, and ensure result is an efficient Map
        const canonicalConfigMap = SafeConfigurationCoercer.execute({
            config: rawConfig,
            schema: GOVERNANCE_SCHEMA,
            returnMap: true // Optimization 4: Store as Map
        });

        // Step 3: Cache the canonical configuration
        const ttl = canonicalConfigMap.get('CACHE_TTL_MS') as number;
        CanonicalConfigurationCacheTool.set({ 
            key: CONFIG_CACHE_KEY, 
            config: canonicalConfigMap,
            ttl: ttl
        });
        
        // Step 4: Optimization 3 & 4: Generate immutable, high-speed accessor functions
        governanceSettingsAccessors = ImmutableConfigAccessorGenerator.execute({ 
            configSource: canonicalConfigMap 
        }) as Readonly<Record<string, () => any>>;

        return governanceSettingsAccessors;

    } catch (error) {
        console.error("CRITICAL: Failed to initialize governance settings.", error);
        throw new Error("InitializationFailure: Governance settings could not be loaded or validated.");
    }
}

// Export a frozen accessor utility that encapsulates the settings.
// Usage: GovernanceSettings.MAX_POLICY_SIZE()
export const GovernanceSettings = loadGovernanceSettings();