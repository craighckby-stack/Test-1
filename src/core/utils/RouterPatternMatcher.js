/**
 * Utility for robust URI pattern matching, supporting path parameters and complex globbing.
 * This moves complex route comparison logic out of the core ValidationContextResolver,
 * leveraging the dedicated PathPolicyRuleMatcher plugin for compilation and matching.
 */
export class RouterPatternMatcher {

    /**
     * Checks if a target path matches a given pattern using the dedicated
     * PathPolicyRuleMatcher tool.
     * 
     * @param {string} targetPath - The incoming URI path (e.g., '/users/123/details').
     * @param {string} pattern - The configured pattern (e.g., '/users/:id/*').
     * @returns {boolean} True if matched.
     */
    static matches(targetPath, pattern) {
        // Delegate the complex pattern matching and regex compilation to the external utility.
        // Assuming the PathPolicyRuleMatcher tool is accessible via a standardized interface.
        if (typeof PathPolicyRuleMatcher !== 'undefined' && PathPolicyRuleMatcher.matches) {
            return PathPolicyRuleMatcher.matches(targetPath, pattern);
        } else {
            // Fallback (or placeholder for kernel access)
            console.error("PathPolicyRuleMatcher tool not available.");
            return targetPath === pattern;
        }
    }
}