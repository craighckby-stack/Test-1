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
    if (!metricsConfig || !metricsConfig.profiles || typeof metricsConfig.profiles !== 'object') {
        // Robust data extraction/JSON Parsing check
        console.error("FitnessEngine: Invalid or missing metrics configuration provided. Profiles object missing.");
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
    // Robust Error Handling: Ensure rawMetrics is usable
    if (typeof rawMetrics !== 'object' || rawMetrics === null) {
        console.warn(`FitnessEngine: Invalid rawMetrics provided. Returning baseline score 0.`);
        return 0.0;
    }
    
    if (!this.isOperational) {
        console.warn(`FitnessEngine: Configuration non-operational. Returning baseline score 0.`);
        return 0.0;
    }

    const profile = this.config.profiles[profileName];
    if (!profile) {
        // Graceful failure recovery
        console.warn(`FitnessEngine: Profile ${profileName} not found. Returning neutral score (0.5).`);
        return 0.5;
    }
    
    // 1. Calculate the initial derived metric score. (Meta-Reasoning capability exercised here)
    let score = this.calculateDerivedMetric(rawMetrics, profile.target_metric);
    
    // Validate initial score calculation (Error Handling)
    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
        console.error(`FitnessEngine: Derived metric calculation resulted in non-safe number (${score}). Resetting score.`);
        score = 0.0;
    }
    
    // 2. Apply Oracle modifications (penalties/rewards)
    if (Array.isArray(profile.oracles)) {
        profile.oracles.forEach(oracle => {
            
            // JSON Parsing Robustness: Safely read metric value
            const metricValue = rawMetrics[oracle.metric];
            
            if (!oracle.metric || !oracle.condition || oracle.value === undefined) {
                console.warn(`FitnessEngine: Skipping malformed oracle definition (Missing metric, condition, or threshold).`);
                return;
            }

            const passes = this.checkCondition(metricValue, oracle.condition, oracle.value);
            
            // Parse factors safely (Error Handling)
            let factor = 0;
            if (oracle.violation_type === 'penalty' && oracle.penalty_factor !== undefined) {
                factor = parseFloat(oracle.penalty_factor);
            } else if (oracle.violation_type === 'reward' && oracle.reward_factor !== undefined) {
                factor = parseFloat(oracle.reward_factor);
            }

            // Clamping factor to [0, 1] internally for stability
            factor = Math.max(0, Math.min(1, factor));

            if (!isNaN(factor)) { 
                if (!passes && oracle.violation_type === 'penalty') {
                    score *= Math.max(0, (1 - factor)); // Penalty, ensuring result remains non-negative
                } else if (passes && oracle.violation_type === 'reward') {
                    score *= (1 + factor); // Reward
                }
            }
        });
    }

    // 3. Handle optimization goals (e.g., minimizing complexity)
    if (profile.optimization_goal === 'minimize') {
      // Robust minimization: Correctly handles 0 score (perfect minimization) by maximizing the fitness result.
      // Using EPSILON prevents division by zero and rewards the achievement of zero error/complexity maximally.
      const EPSILON = 1e-9;
      score = 1.0 / (score + EPSILON); 
    }

    // Final clamping to ensure non-negativity and finite result (Error Handling)
    if (!isFinite(score)) {
        console.warn(`FitnessEngine: Score resulted in non-finite value (${score}). Clamping to high, safe finite value (1000.0).`);
        score = 1000.0;
    }
    
    return Math.max(0, score);
  }

  /**
   * Autonomy/Error Handling: Sanitizes the dynamic calculation string before evaluation.
   * Only allows basic arithmetic operators, parentheses, decimals, and numbers.
   * This is crucial because it uses eval() for Meta-Reasoning functionality.
   * 
   * @param {string} formulaString - The string after metric substitution.
   * @returns {string} Sanitized formula string.
   */
  sanitizeFormula(formulaString) {
    // Only allow numbers (and metrics already replaced by numbers), basic arithmetic, spaces, and parentheses.
    // Using a broad negative match to strip anything unsafe.
    let sanitized = formulaString.replace(/[^-+*/().\s\d]/g, '');
    return sanitized;
  }

  /**
   * Implements dynamic formula execution for Meta-Reasoning capability development.
   * Recognizes complex formulas vs. simple metric lookups.
   * 
   * @param {Object} rawMetrics - Collected M_* metrics.
   * @param {string} targetMetricIdOrFormula - The target ID or dynamic calculation string.
   * @returns {number} The calculated metric value.
   */
  calculateDerivedMetric(rawMetrics, targetMetricIdOrFormula) {
    if (!targetMetricIdOrFormula || !rawMetrics) return 0.0;

    const formula = targetMetricIdOrFormula.trim();
    
    // Check if it's a simple lookup (M_XXX) or a complex formula (+, *, /, (, ))
    const isComplexFormula = /[+\-*/()]/.test(formula);

    if (!isComplexFormula) {
        // Baseline lookup (Cycle 1 maturity)
        const value = rawMetrics[formula];
        // Ensure the looked-up value is a safe number
        return (typeof value === 'number' && isFinite(value)) ? value : 0.0;
    }

    // Meta-Reasoning: Dynamic Formula Parsing and Execution
    let calculationString = formula;

    for (const metricKey in rawMetrics) {
        // Use a safe numeric default (0.0) if metric is missing or non-finite
        const value = (typeof rawMetrics[metricKey] === 'number' && isFinite(rawMetrics[metricKey])) 
                      ? rawMetrics[metricKey] 
                      : 0.0;
        
        // Improvement: Use escaped word boundaries (\b) for robust replacement
        // This ensures M_ERROR_RATE is not partially substituted in M_TOTAL_ERROR_RATE.
        calculationString = calculationString.replace(new RegExp('\b' + metricKey + '\b', 'g'), `(${value})`);
    }

    try {
        // Step 1: Sanitize the resulting calculation string before evaluation for enhanced security and stability.
        const safeCalculationString = this.sanitizeFormula(calculationString);

        // NOTE: Use of eval() is a deliberate architectural decision to enable
        // autonomous formula generation (Meta-Reasoning).
        const result = eval(safeCalculationString);
        
        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
            // Enhanced error logging: show the resulting string that produced the non-safe result.
            console.error(`FitnessEngine: Formula execution resulted in non-safe number for formula: ${formula}. Resulting string: ${safeCalculationString}`);
            return 0.0;
        }
        return result;

    } catch (e) {
        // Robust Error Handling during formula execution: log the problematic calculation string.
        console.error(`FitnessEngine: Failed to evaluate derived metric formula: ${e.message}. Formula attempted: ${calculationString}`);
        return 0.0;
    }
  }

  /**
   * Detailed conditional evaluation logic. Enhanced for safer numerical comparison.
   * @param {*} value 
   * @param {string} condition - operators like '>', '<', '>=', '<=', '==', '!='
   * @param {*} threshold 
   */
  checkCondition(value, condition, threshold) {
    if (value === undefined || threshold === undefined) return false;
    
    const conditionOp = condition.trim();
    
    // Priority 1: If both can be numbers, use strict numerical comparison 
    const numValue = parseFloat(value);
    const numThreshold = parseFloat(threshold);
    
    const isNumComparison = !isNaN(numValue) && !isNaN(numThreshold);

    const val = isNumComparison ? numValue : value;
    const thresh = isNumComparison ? numThreshold : threshold;

    switch (conditionOp) {
      case '>':
        return isNumComparison && (val > thresh);
      case '<':
        return isNumComparison && (val < thresh);
      case '>=':
        return isNumComparison && (val >= thresh);
      case '<=':
        return isNumComparison && (val <= thresh);
      case '==':
        return val == thresh; // Allow loose equality for non-numerical comparison
      case '!=':
        return val != thresh;
      default:
        // Graceful failure for unknown conditions (Error Handling)
        console.warn(`FitnessEngine: Unknown condition operator: ${condition}`);
        return false;
    }
  }
}

module.exports = FitnessEngine;