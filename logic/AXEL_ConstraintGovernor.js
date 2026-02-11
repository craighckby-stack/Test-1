/**
 * AXEL_ConstraintGovernor.js
 * 
 * Utility for implementing Adaptive QoS based on real-time performance metrics.
 * Dynamically overrides AXEL_RuntimeConfig constraints to optimize resource utilization.
 * 
 * CRITICAL: Logic delegated to AdaptiveQoSConstraintGovernor tool.
 */

// Placeholder mechanism for accessing Kernel-managed tools/plugins.
// This ensures flexibility whether the dependency is global, injected, or provided via a standard registry.
const ToolRegistry = globalThis.ToolRegistry || {}; 

/**
 * Calculates optimal runtime constraints based on performance feedback.
 * This function delegates the adaptive constraint derivation to the specialized Governance Tool.
 *
 * @param {object} currentConstraints - The current constraints configuration.
 * @param {object} performanceMetrics - Real-time performance metrics (e.g., successful_evaluations, failed_timeouts, average_latency_ms).
 * @param {object} [GovernorTool] - Optional tool instance injection for testing/flexibility.
 * @returns {object} The updated constraints configuration.
 */
export function calculateOptimalConstraints(currentConstraints, performanceMetrics, GovernorTool) {
    
    // Resolve the dependency. Prioritize injection, then registry/global lookup.
    const Governor = GovernorTool 
        || ToolRegistry.AdaptiveQoSConstraintGovernor 
        || globalThis.AdaptiveQoSConstraintGovernor;

    if (!Governor || typeof Governor.execute !== 'function') {
        // Fallback: If the tool is unavailable, return existing constraints.
        console.warn("AdaptiveQoSConstraintGovernor tool is missing or improperly defined. Cannot apply adaptive QoS.");
        return currentConstraints;
    }

    // Delegate the complex calculation to the plugin for centralized and reusable logic.
    return Governor.execute({
        currentConstraints,
        performanceMetrics
    });
}