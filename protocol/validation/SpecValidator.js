/**
 * Protocol Specification Validator (Sovereign AGI v94.1)
 * Ensures CHR generation specs comply with architectural standards and constraints.
 */
class SpecValidator {
    constructor(schemaRegistry) {
        this.schemas = schemaRegistry; // Assumes a centralized schema registry (e.g., AJV instance)
    }

    /**
     * Validates a generation specification object.
     * @param {Object} spec The specification object conforming to protocol/chr_generation_spec.json.
     * @returns {boolean} True if valid.
     * @throws {Error} Detailed validation error if invalid.
     */
    validate(spec) {
        const schema = this.schemas.getSchema('chr_generation_spec');
        
        if (!schema || !schema.validate(spec)) {
            throw new Error(`CHR Spec Validation Failed against schema: ${JSON.stringify(schema.errors || "Schema not loaded")}`);
        }

        this.checkConstraintCoherence(spec);
        this.checkDependencyResolution(spec);

        return true;
    }

    /** Ensures logic limits (e.g., hard > soft) are obeyed. */
    checkConstraintCoherence(spec) {
        const mem = spec.generation_parameters.runtime_constraints.memory_footprint_mb;
        if (mem.hard_limit < mem.soft_limit) {
            throw new Error("Constraint Coherence Error: Hard memory limit cannot be less than soft limit.");
        }
    }

    /** Ensures all required component versions are compatible with the protocol runtime. */
    checkDependencyResolution(spec) {
        // Placeholder: integration logic with version resolver module.
        for (const [component, details] of Object.entries(spec.component_dependencies)) {
            if (details.required && !this.schemas.versionResolver.isCompatible(component, details.version_lock)) {
                throw new Error(`Required dependency conflict: ${component} fails version lock ${details.version_lock}`);
            }
        }
    }
}

module.exports = SpecValidator;