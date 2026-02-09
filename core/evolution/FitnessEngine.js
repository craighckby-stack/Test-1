// Implementation of the ACE Fitness Evaluation Engine for AGI-KERNEL v7.4.2.
// This engine drives Maturity Progression and Capability Self-Assessment.

/**
 * @class FitnessEngine
 * Consumes config/metrics_and_oracles_v2.json and calculates the fitness score
 * for a new codebase generation based on collected runtime and static metrics.
 * 
 * Crucial for the kernel's Meta-Reasoning and Self-Improvement cycle.
 */
class FitnessEngine {
  constructor(metricsConfig) {
    if (!metricsConfig || !metricsConfig.profiles) {
        // Initial robust check for configuration integrity (JSON Parsing robustness)
        console.error("FitnessEngine: Invalid or missing metrics configuration provided.");
        this.config = { profiles: {} };
        this.isOperational = false;
    } else {
        this.config = metricsConfig;
        this.isOperational = true;
    }
  }

  /**
   * Calculates fitness based on raw metric data and the specified profile.
   * Aligns with the Error Handling core capability.
   * 
   * @param {Object} rawMetrics - Collected M_* metrics (e.g., M_ERROR_RATE, M_COMPLEXITY).
   * @param {string} profileName - E.g., 'P_PRODUCTION_STABILITY'.
   * @returns {number} Calculated fitness score (0.0 to 1.0, potentially higher with rewards).
   */
  calculate(rawMetrics, profileName) {
    if (!this.isOperational) {
        console.warn(`FitnessEngine: Configuration non-operational. Returning baseline score 0.`);
        return 0.0;
    }

    const profile = this.config.profiles[profileName];
    if (!profile) {
        // Graceful failure recovery: log and return a neutral score, instead of crashing.
        console.warn(`FitnessEngine: Profile ${profileName} not found. Returning neutral score (0.5).`);
        return 0.5;
    }
    
    // 1. Calculate the initial derived metric score.
    let score = this.calculateDerivedMetric(rawMetrics, profile.target_metric);
    
    // Ensure score is a number before manipulation
    if (typeof score !== 'number' || isNaN(score)) {
        console.error(`FitnessEngine: Derived metric calculation failed for ${profile.target_metric}. Score reset to 0.`);
        score = 0;
    }

    // 2. Apply Oracle modifications (penalties/rewards)
    if (Array.isArray(profile.oracles)) {
        profile.oracles.forEach(oracle => {
            const metricValue = rawMetrics[oracle.metric];
            // Ensure necessary fields exist before checking conditions
            if (!oracle.metric || !oracle.condition || oracle.value === undefined) {
                console.warn(`FitnessEngine: Skipping malformed oracle definition.`);
                return;
            }

            const passes = this.checkCondition(metricValue, oracle.condition, oracle.value);

            // Applying penalties/rewards, ensuring factors are numeric and bounds checked
            const factor = parseFloat(oracle.penalty_factor || oracle.reward_factor);

            if (!isNaN(factor) && factor >= 0 && factor <= 1) { // Validate factor range
                if (!passes && oracle.violation_type === 'penalty') {
                    score *= (1 - factor); // Penalty
                } else if (passes && oracle.violation_type === 'reward') {
                    score *= (1 + factor); // Reward
                }
            } else if (oracle.violation_type) {
                console.warn(`FitnessEngine: Invalid factor (${oracle.penalty_factor || oracle.reward_factor}) encountered for oracle.`);
            }
        });
    }

    // 3. Handle optimization goals (e.g., minimizing complexity)
    if (profile.optimization_goal === 'minimize') {
      // Robust division: prevents division by zero or near-zero resulting in Infinity/NaN
      const MIN_SAFE_SCORE = 1e-6;
      if (score < MIN_SAFE_SCORE) {
          score = 0; // If the minimization target score is effectively zero, fitness is zero.
      } else {
          score = 1 / score; 
      }
    }

    // Final clamping to ensure non-negativity
    return Math.max(0, score);
  }

  /**
   * Placeholder implementation for complex derived metric calculation.
   * In a future cycle (Meta-Reasoning), this will be dynamically generated.
   */
  calculateDerivedMetric(rawMetrics, derivedId) {
    // Current Cycle 1 goal: Baseline establishment.
    // Future cycles will implement dynamic formula parsing (e.g., 'M_A * 0.5 + M_B * 0.5').
    
    if (!derivedId || !rawMetrics) return 0.0;

    // Default return high score if metrics indicate successful operation (Maturity progression)
    // Simulating a baseline success metric for initialization.
    const successMetric = rawMetrics['M_SUCCESS_RATE'] || 1.0; 
    return successMetric; 
  }

  /**
   * Detailed conditional evaluation logic.
   * @param {*} value 
   * @param {string} condition - operators like '>', '<', '>=', '<=', '==', '!='
   * @param {*} threshold 
   */
  checkCondition(value, condition, threshold) {
    if (value === undefined || threshold === undefined) return false;
    
    // Coerce values to numbers if possible for mathematical comparison
    const numValue = parseFloat(value);
    const numThreshold = parseFloat(threshold);
    
    // If coercion fails, use strict comparison, but prioritize numerical checks
    const val = isNaN(numValue) ? value : numValue;
    const thresh = isNaN(numThreshold) ? threshold : numThreshold;

    switch (condition) {
      case '>':
        return val > thresh;
      case '<':
        return val < thresh;
      case '>=':
        return val >= thresh;
      case '<=':
        return val <= thresh;
      case '==':
        return val == thresh; // Loose equality for flexibility
      case '!=':
        return val != thresh;
      default:
        // Graceful failure for unknown conditions
        console.warn(`FitnessEngine: Unknown condition operator: ${condition}`);
        return false;
    }
  }
}

module.exports = FitnessEngine;