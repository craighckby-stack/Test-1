/**
 * @fileoverview Defines the abstract interface and standard types for Configuration Validation
 * within the Governance Subsystem (GOV).
 */

// --- Standard Interface Types ---

/**
 * Standard Interface Type: GOV_ValidationError
 * Represents a specific failure point discovered during configuration validation.
 */
export interface GOV_ValidationError {
    /** Identifier of the rule that failed (e.g., 'GRS-001', 'SchemaCheck'). */
    ruleId: string;
    /** Human-readable, actionable description of the failure. */
    message: string;
    /** Optional JSON path to the failed configuration element (e.g., 'rules[3].threshold'). */
    path?: string;
    /** Optional failing value for detailed debugging. */
    value?: unknown;
}

/**
 * Standard Interface Type: GOV_ValidationResult
 * The aggregated result of a configuration validation operation.
 */
export interface GOV_ValidationResult {
    /** True if the configuration passed all checks. */
    isValid: boolean;
    /** Array of detailed errors if validation failed (empty array if isValid is true). */
    errors: GOV_ValidationError[];
}

// --- Abstract Base Interface ---

/**
 * Abstract Base Class: ConfigValidator
 * ID: GOV_IFACE_VLDTR_v2
 * Scope: Standardized, Asynchronous Interface for Configuration Integrity Checks.
 *
 * Purpose: Defines the required contract for all concrete governance configuration validation modules (GRCMs).
 * Enforces async validation capability.
 */
export abstract class ConfigValidator {
    /**
     * Static unique identifier for introspection and registry management. Version bumped to v2
     * to indicate adherence to modern standardized types (GOV_ prefix).
     */
    public static readonly INTERFACE_ID = 'GOV_IFACE_VLDTR_v2';

    constructor() {
        // Enforce abstract nature for runtime robustness, even though TS enforces it statically.
        if (new.target === ConfigValidator) {
            throw new TypeError("Cannot instantiate abstract class ConfigValidator. Use concrete implementations (GRCMs).");
        }
    }

    /**
     * Asynchronously validates the proposed configuration payload against applicable Governance Rule Sets.
     *
     * Rationale: Operation must be asynchronous to accommodate complex checks requiring I/O,
     * state lookups, dependency analysis, or cryptographic state verification.
     *
     * @param config - The configuration object (e.g., policy update payload) to validate.
     * @returns A promise resolving to a detailed validation result object.
     */
    public abstract validate(config: unknown): Promise<GOV_ValidationResult>;
}

/**
 * Exports the ConfigValidator abstract class and associated standard types.
 */
export {
    GOV_ValidationError as ValidationError,
    GOV_ValidationResult as ValidationResult
};
