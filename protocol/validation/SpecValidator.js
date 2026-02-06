/**
 * Protocol Specification Validator (Sovereign AGI v94.1)
 * Ensures CHR generation specs comply with architectural standards and constraints.
 */
class SpecValidator {
    /**
     * @param {Object} schemaRegistry - Service providing schema access (e.g., AJV instance wrapper).
     * @param {Object} versionResolver - Utility for checking component version compatibility.
     */
    constructor(schemaRegistry, versionResolver) {
        if (!schemaRegistry || !versionResolver) {
            throw new Error("SpecValidator requires both a schemaRegistry and a versionResolver.");
        }
        this.schemas = schemaRegistry;
        this.versionResolver = versionResolver;
    }

    /**
     * Validates a generation specification object, collecting all errors.
     * @param {Object} spec The specification object conforming to protocol/chr_generation_spec.json.
     * @returns {boolean} True if valid.
     * @throws {Error} Consolidated validation error detailing all failures.
     */
    validate(spec) {
        const validationErrors = [];

        // 1. Structural Schema Validation
        const schema = this.schemas.getSchema('chr_generation_spec');
        
        if (!schema || !schema.validate(spec)) {
            const schemaErrors = schema ? schema.errors : "Schema not loaded or found.";
            validationErrors.push({ 
                type: 'SCHEMA_VIOLATION', 
                details: schemaErrors 
            });
        }

        // Only run custom checks if the basic structure is present enough to prevent runtime errors
        if (validationErrors.length === 0) {
            this._checkConstraintCoherence(spec, validationErrors);
            this._checkDependencyResolution(spec, validationErrors);
        }

        if (validationErrors.length > 0) {
            const errorSummary = validationErrors.map(err => 
                `${err.type}: ${typeof err.details === 'string' ? err.details : JSON.stringify(err.details)}`
            ).join('\n');
            
            throw new Error(`CHR Spec Validation Failed:\n${errorSummary}`);
        }

        return true;
    }

    /** 
     * Ensures logic limits (e.g., hard > soft) are obeyed. 
     * Collects errors instead of throwing immediately.
     * @private
     */
    _checkConstraintCoherence(spec, errors) {
        try {
            const mem = spec.generation_parameters.runtime_constraints.memory_footprint_mb;
            if (mem.hard_limit < mem.soft_limit) {
                errors.push({
                    type: 'CONSTRAINT_COHERENCE',
                    details: "Hard memory limit cannot be less than soft limit."
                });
            }
        } catch (e) {
             errors.push({
                type: 'CONSTRAINT_COHERENCE_STRUCTURE',
                details: "Missing or malformed runtime constraint structure."
            });
        }
    }

    /** 
     * Ensures all required component versions are compatible with the protocol runtime. 
     * Collects errors instead of throwing immediately.
     * @private
     */
    _checkDependencyResolution(spec, errors) {
        const dependencies = spec.component_dependencies || {};

        for (const [component, details] of Object.entries(dependencies)) {
            if (details.required) {
                if (!this.versionResolver.isCompatible(component, details.version_lock)) {
                    errors.push({
                        type: 'DEPENDENCY_CONFLICT',
                        details: `Required dependency conflict: ${component} fails version lock ${details.version_lock}`
                    });
                }
            }
        }
    }
}

module.exports = SpecValidator;