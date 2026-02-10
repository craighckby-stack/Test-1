/**
 * AXEL_ConstraintGovernor.js
 * 
 * Utility for implementing Adaptive QoS based on real-time performance metrics.
 * Dynamically overrides AXEL_RuntimeConfig constraints to optimize resource utilization.
 * 
 * CRITICAL: Logic delegated to AdaptiveQoSConstraintGovernor tool.
 */

// Assuming the AGI environment makes extracted tools accessible globally or via an assumed dependency injection mechanism.

/**
 * Calculates optimal runtime constraints based on performance feedback.
 * This function delegates the adaptive constraint derivation to the specialized Governance Tool.
 *
 * @param {object} currentConstraints - The current constraints configuration.
 * @param {object} performanceMetrics - Real-time performance metrics (e.g., successful_evaluations, failed_timeouts, average_latency_ms).
 * @returns {object} The updated constraints configuration.
 */
export function calculateOptimalConstraints(currentConstraints, performanceMetrics) {
    // Access the specialized governance tool (injected by AGI_KERNEL)
    const GovernorTool = AdaptiveQoSConstraintGovernor;

    if (!GovernorTool || typeof GovernorTool.execute !== 'function') {
        // Fallback: If the tool is unavailable, return existing constraints.
        console.error("AdaptiveQoSConstraintGovernor tool is not available. Cannot apply adaptive QoS.");
        return currentConstraints;
    }

    // Delegate the complex calculation to the plugin for centralized and reusable logic.
    return GovernorTool.execute({
        currentConstraints,
        performanceMetrics
    });
}