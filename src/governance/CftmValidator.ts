import * as CFTM_CONFIG from '../../config/security/cftm_v3.json';

// --- Declarative Rules for CFTM Constants ---
// These rules define the expected path, type, and range constraints for critical governance constants.
const CFTM_VALIDATION_RULES = [
    {
        // Corresponds to TAU (COF_Stability_Model)
        path: "axioms.COF_Stability_Model.value",
        key: "DENOMINATOR_STABILITY_TAU",
        type: "number",
        // Must be positive (Original logic: TAU > 0)
        min: 1e-18, 
        max: Infinity,
        required: true
    },
    {
        // Corresponds to EPSILON (P01_Finality_Model)
        path: "axioms.P01_Finality_Model.value",
        key: "MINIMUM_EFFICACY_SAFETY_MARGIN_EPSILON",
        type: "number",
        // Must be > 0 and < 1 (Original logic: EPSILON > 0 && EPSILON < 1)
        min: 1e-18, 
        // Use a value slightly less than 1 to enforce strict inequality via the plugin's <= max check
        max: 0.999999999999999,
        required: true
    }
];

/**
 * Validates and provides typed access to Governance Axiom (GAX) constants
 * using the NumericalConfigValidator plugin.
 * This is critical for ensuring numerical integrity within the COF calculations.
 */
export class CftmValidator {
    private constants: ReadonlyMap<string, number>;
    
    // Assume plugin is exposed on globalThis.AGI_PLUGINS
    private readonly numericalConfigValidator: any = (globalThis as any).AGI_PLUGINS.NumericalConfigValidator;

    constructor() {
        if (!this.numericalConfigValidator || typeof this.numericalConfigValidator.execute !== 'function') {
            throw new Error("Required plugin NumericalConfigValidator is not available.");
        }
        this.constants = this.loadAndValidate();
    }

    private loadAndValidate(): Map<string, number> {
        const result = this.numericalConfigValidator.execute({
            configObject: CFTM_CONFIG,
            rules: CFTM_VALIDATION_RULES
        });

        if (!result.isValid) {
            // Log the validation errors and throw a consolidated error
            const errorDetails = result.errors.join('; ');
            throw new Error(`[CFTM] Configuration validation failed: ${errorDetails}`);
        }

        return result.constants;
    }

    /** Retrieves a constant value by its defined key (e.g., 'DENOMINATOR_STABILITY_TAU') */
    public getConstant(key: string): number {
        const value = this.constants.get(key);
        if (value === undefined) {
            throw new Error(`[CFTM] Requested unknown or uninitialized constant: ${key}`);
        }
        return value;
    }
}