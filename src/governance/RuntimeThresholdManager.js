/**
 * Component ID: RTM
 * Name: Runtime Threshold Manager
 * Function: Manages persistent storage, validation, and real-time distribution of the system's
 *           governance parameters (weights, thresholds, severity boosts) used by RCE (C-11) and other control loops.
 * Rationale: Ensures that constraint evaluation is driven by a single, dynamically configurable source of truth,
 *            decoupling constraint values from application code defaults.
 */

const DEFAULT_CONFIG_PATH = '/etc/agi/governance/constraints.json';

// --- Type definition for ConfigurationLoaderAndValidator output (internal use) ---
interface ConstraintValidationResult {
    success: boolean;
    data: Record<string, any> | null;
    error: string | null;
}

interface ConfigurationLoaderAndValidatorInterface {
    execute(args: { rawConfig: string, schema: any }): Promise<ConstraintValidationResult> | ConstraintValidationResult;
}
// ---------------------------------------------------------------------------------


class RuntimeThresholdManager {
    private persistenceService: any;
    private currentConstraints: Record<string, any>;
    private isLoaded: boolean;
    private constraintSchema: any; // Placeholder for the actual governance constraint schema
    private configValidator: ConfigurationLoaderAndValidatorInterface; // Injected utility

    /**
     * @param {Object} persistenceService Service for configuration storage (e.g., File system, Database).
     * @param {ConfigurationLoaderAndValidatorInterface} configValidator Plugin instance for parsing and validation.
     * @param {Object} constraintSchema The schema used to validate governance parameters.
     */
    constructor(
        persistenceService: any, 
        configValidator: ConfigurationLoaderAndValidatorInterface,
        constraintSchema: any 
    ) {
        this.persistenceService = persistenceService;
        this.configValidator = configValidator;
        this.constraintSchema = constraintSchema;
        this.currentConstraints = {};
        this.isLoaded = false;
    }

    /**
     * Loads constraints from the persistent layer, safely parses, and validates them.
     * @async
     */
    async loadConfiguration(): Promise<void> {
        let rawConfig: string;
        try {
            rawConfig = await this.persistenceService.read(DEFAULT_CONFIG_PATH);
        } catch (readError) {
            console.error("[RTM] Failed to read raw constraint configuration from persistence. Falling back.", readError);
            this.currentConstraints = {}; 
            this.isLoaded = false;
            return;
        }
        
        // Use the extracted utility for safe parsing and validation
        const validationResult = await this.configValidator.execute({ 
            rawConfig: rawConfig,
            schema: this.constraintSchema
        });
        
        if (validationResult.success && validationResult.data) {
            this.currentConstraints = validationResult.data;
            this.isLoaded = true;
            console.log("[RTM] Constraints loaded and validated successfully.");
        } else {
            console.error(`[RTM] Constraint configuration failed validation or parsing. Error: ${validationResult.error}. Falling back to internal defaults.`, validationResult.data);
            this.currentConstraints = {}; 
            this.isLoaded = false;
        }
    }

    /**
     * Retrieves the current, validated governance constraints.
     * @returns {Object} The complete configuration object for RCE consumption.
     */
    getConstraints(): Record<string, any> {
        // Returns the loaded configuration; RCE handles merging this with its hardcoded defaults.
        return this.currentConstraints;
    }

    /**
     * Updates a single constraint parameter (requires authorization and validation in production).
     * @async
     * @param {string} metricKey
     * @param {Record<string, any>} newParams { threshold, weight, severity_boost }
     */
    async updateConstraint(metricKey: string, newParams: Record<string, any>): Promise<void> {
        if (!this.currentConstraints[metricKey]) {
            throw new Error(`Metric key ${metricKey} not found for update.`);
        }
        
        this.currentConstraints[metricKey] = { ...this.currentConstraints[metricKey], ...newParams };
        // In production, this would also trigger a save/persistence update.
        console.log(`[RTM] Constraint updated for ${metricKey}. Persistence update required.`);
        // Potential future feature: Emit an event for hot-reloading configurations in active RCE instances.
    }
}

module.exports = RuntimeThresholdManager;