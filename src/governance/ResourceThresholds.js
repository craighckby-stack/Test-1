// src/governance/ResourceThresholds.ts

/**
 * RESOURCE THRESHOLDS CONFIGURATION (RTC)
 * ID: RTC-G02
 * GSEP Role: Provides a centralized, typed interface for accessing
 * versioned resource governance thresholds and baselines.
 *
 * Decouples static numerical thresholds from the dynamic check logic
 * within the ResourceCheckRegistry (RCR).
 */

// Assuming ThresholdLookupValidator is available via injection or declaration.
decore const ThresholdLookupValidator: { execute: (args: { config: Readonly<Record<string, number>>, key: string, version: string }) => number };

const V1_THRESHOLDS = Object.freeze({
    // Core Operational Baselines
    CPU_CORE_BASELINE: 0.85, // Max utilization before triggering FAIL
    MEMORY_RESERVE_MIN_MB: 256, // Minimum required MB reserve
    LATENCY_MAX_MS: 50, // Maximum allowed execution latency for critical operations

    // Mutation Specific Overheads
    MUTATION_HEAP_MAX_MB: 1024,
    MUTATION_TIMEOUT_S: 120,
});

class ResourceThresholds {
    private version: string;
    private config: Readonly<Record<string, number>>;

    /**
     * @param {string} [version='V1'] - The governance threshold version to enforce.
     */
    constructor(version = 'V1') {
        this.version = version;
        this.config = this._loadVersion(version);
    }

    /**
     * Loads the specific threshold configuration version.
     * @private
     * @param {string} version 
     * @returns {Readonly<Record<string, number>>}
     */
    private _loadVersion(version: string): Readonly<Record<string, number>> {
        switch (version.toUpperCase()) {
            case 'V1':
                return V1_THRESHOLDS as Readonly<Record<string, number>>; // Safe cast
            default:
                console.warn(`RTC Warning: Unknown threshold version '${version}'. Falling back to V1.`);
                return V1_THRESHOLDS as Readonly<Record<string, number>>; // Safe cast
        }
    }

    /**
     * Retrieves a specific threshold value using the ThresholdLookupValidator plugin.
     * Enforces strict key validation via the plugin.
     * @param {string} key - The threshold identifier (e.g., 'CPU_CORE_BASELINE').
     * @returns {number} The numerical threshold value.
     * @throws {Error} If the key is missing in the current version.
     */
    public get(key: string): number {
        // Delegate the strict access and validation logic (mandatory presence check) to the specialized plugin.
        return ThresholdLookupValidator.execute({
            config: this.config,
            key: key,
            version: this.version
        });
    }

    /**
     * Reloads thresholds, potentially allowing for dynamic runtime reconfiguration.
     * @param {string} version 
     */
    public reload(version: string): void {
        this.version = version;
        this.config = this._loadVersion(version);
    }
}

export = ResourceThresholds;
