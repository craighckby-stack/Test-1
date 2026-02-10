/**
 * Utility class to adapt verbose external validation errors (e.g., Joi, Zod) 
 * into a structured, lightweight format expected by system errors like PayloadSchemaError.
 * This decouples the governance error structure from specific validation libraries by delegating 
 * normalization to the dedicated plugin.
 */

// Assume __ErrorDetailNormalizationUtility__ is globally available or imported 
// via the runtime environment after extraction.
const NormalizationUtility = typeof __ErrorDetailNormalizationUtility__ !== 'undefined' 
    ? __ErrorDetailNormalizationUtility__ 
    : { 
        // Minimal fallback for environment safety, though the kernel ensures tool availability
        normalize: (err) => err ? [{ field: 'internal', reason: 'Normalization utility not found', rule: 'MISSING_TOOL' }] : []
    };
    
class ErrorDetailAdapter {
    
    /**
     * Maps raw validation error objects (which are often verbose) into a 
     * normalized array of failure structures for the PayloadSchemaError.
     * 
     * @param {Object} externalError - The raw validation error object (e.g., Joi validation error).
     * @returns {Array<{field: string, reason: string, rule: string}>} A structured array of failure details.
     */
    static normalize(externalError) {
        // Delegate the entire normalization task to the dedicated utility
        return NormalizationUtility.normalize(externalError);
    }
}

module.exports = { ErrorDetailAdapter };
