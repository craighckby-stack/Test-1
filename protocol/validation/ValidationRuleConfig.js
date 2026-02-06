/**
 * Sovereign AGI Validation Rule Configuration Registry.
 * Defines standard rule structures used for initialization by Validators (like SpecValidator).
 * Externalizing rules definition promotes cleaner separation of concerns and easier runtime modification/injection.
 */

module.exports = {
    /**
     * Rules applied to the CHR Generation Specification.
     * Handlers must accept (spec, errors_array, utilityResolver) signature if they require stateful dependencies.
     */
    chrSpecRules: [
        // Defines the structure for hard/soft limit checks
        {
            id: 'memoryLimitCoherence',
            type: 'COHERENCE',
            description: 'Ensure hard memory limit is not below soft limit.'
            // NOTE: Handler function definition is left to the calling component (SpecValidator) 
            // until a dynamic dependency injection system is implemented.
        },
        // Defines the structure for dependency compatibility checks
        {
            id: 'requiredDependencyCompatibility',
            type: 'VERSIONING',
            description: 'Verify all required component versions are compatible with the current runtime protocol.'
        }
    ],
    
    // Future rule categories (e.g., policy violation rules, security checks)
    policyRules: []
};