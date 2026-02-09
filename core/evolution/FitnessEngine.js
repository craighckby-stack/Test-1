// Implementation of the ACE Fitness Evaluation Engine for AGI-KERNEL v7.4.3.
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
    // Define a small tolerance for floating point comparisons to enhance robustness (Error Handling)
    this.FLOAT_TOLERANCE = 1e-9;
  }

  /**
   * Internal utility to safely retrieve and validate a metric value.
   * Ensures the value is a finite number, defaulting to 0.0 otherwise (Error Handling).
   * 
   * @param {Object} rawMetrics - Collected M_* metrics.
   * @param {string} metricKey - The key to look up.
   * @returns {number} The safe numeric metric value.
   */
  _safeGetMetricValue(rawMetrics, metricKey) {
      const value = rawMetrics[metricKey];
      // Explicitly check for null/undefined/non-number or non-finite numbers
      if (typeof value !== 'number' || !isFinite(value)) {
          return 0.0;
      }
      return value;
  }

  /**
   * Calculates fitness based on raw metric data and the specified profile.
   * Aligns with the Error Handling core capability.
   *
   * @param {Object} rawMetrics - Collected M_* metrics (e.g., M_ERROR_RATE, M_COMPLEXITY).
   * @param {string} profileName - E.g., 'P_PRODUCTION_STABILITY'.
   * @returns {number} Calculated fitness score (0.0 to MAX_FITNESS).
   */
  calculate(rawMetrics, profileName) {
    const MAX_FITNESS = 10.0;

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
            const metricValue = this._safeGetMetricValue(rawMetrics, oracle.metric);
            
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
      // Robust minimization: Uses inverse transformation.
      // Using EPSILON prevents division by zero and rewards the achievement of zero error/complexity maximally.
      const EPSILON = 1e-9;
      score = 1.0 / (score + EPSILON); 
    }

    // 4. Normalize and clamp the final score for stability (Error Handling)
    
    // Final clamping to ensure non-negativity and finite result (Error Handling)
    if (!isFinite(score)) {
        console.warn(`FitnessEngine: Score resulted in non-finite value (${score}). Clamping to high, safe finite value (0.0).`);
        score = 0.0;
    } else {
        // Apply hard cap to prevent runaway scores from minimization goals
        score = Math.min(score, MAX_FITNESS);
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
    // After substitution, the string should ONLY contain numbers, parentheses, and arithmetic operators.
    // Allow 'e' for scientific notation (e.g., 1e-9).
    let sanitized = formulaString.replace(/[^-+*/().\s\dEe]/g, '');
    
    // Additional defense: basic check for obvious attempts to execute code post-sanitization
    if (/[a-zA-Z]/.test(sanitized.replace(/e/g, ''))) {
        // If any letter remains (excluding 'e' from scientific notation), something is wrong.
        console.error("FitnessEngine Security Alert: Post-substitution formula sanitization failed: suspicious characters remain.");
        return "0.0"; 
    }
    
    return sanitized;
  }
  
  /**
   * Autonomy/Security: Pre-validates the formula to ensure it only references known
   * metrics and safe arithmetic structure, before substitution and evaluation.
   * 
   * @param {string} formula - The original formula string (e.g., "M_ERR * 5").
   * @param {string[]} metricKeys - Array of valid metric keys (e.g., ["M_ERR", "M_COMP"]).
   * @returns {boolean} True if validation passes, false otherwise.
   */
  validateFormula(formula, metricKeys) {
      // 1. Check for forbidden characters (anything not standard metrics/operators)
      // Standard metrics contain upper case letters and underscores.
      const forbiddenCharsPattern = /[^A-Z0-9_+\-*\/().\s]/g; // Escaping regex characters
      // We check if cleaning removes anything unexpected, indicating an unsafe character.
      if (formula.trim().length !== formula.trim().replace(forbiddenCharsPattern, '').length) {
          console.error("FitnessEngine Security Alert: Formula failed forbidden character check.");
          return false;
      }
      
      // 2. Check if all "words" (potential metric IDs) are defined keys.
      // Matches sequences of uppercase letters and underscores (standard metric naming).
      const tokens = formula.match(/[A-Z_]+/g) || [];
      const unknownMetrics = tokens.filter(token => !metricKeys.includes(token));
      
      if (unknownMetrics.length > 0) {
          console.error(`FitnessEngine Security Alert: Formula references unknown metrics: ${unknownMetrics.join(', ')}`);
          return false;
      }
      
      return true;
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
    
    // Get all valid metric keys for security validation
    const metricKeys = Object.keys(rawMetrics);

    // Check if it's a simple lookup (M_XXX) or a complex formula (+, *, /, (, ))
    const isComplexFormula = /[+\-*\/()]/.test(formula);

    if (!isComplexFormula) {
        // Baseline lookup (Cycle 1 maturity)
        return this._safeGetMetricValue(rawMetrics, formula);
    }
    
    // META-REASONING SECURITY VULNERABILITY MITIGATION (Autonomy/Error Handling)
    if (!this.validateFormula(formula, metricKeys)) {
        console.error("FitnessEngine: Formula validation failed. Aborting calculation.");
        return 0.0;
    }

    // Meta-Reasoning: Dynamic Formula Parsing and Execution
    let calculationString = formula;

    for (const metricKey of metricKeys) {
        // Use the new safe getter to ensure numerical safety
        const value = this._safeGetMetricValue(rawMetrics, metricKey);
        
        // FIX: Use double backslash (\\b) for robust word boundary replacement in RegExp constructor.
        // This ensures M_COST doesn't accidentally replace M_TOTAL_COST in part.
        calculationString = calculationString.replace(new RegExp('\\b' + metricKey + '\\b', 'g'), `(${value})`);
    }

    try {
        // Step 1: Sanitize the resulting calculation string before evaluation for enhanced security and stability.
        const safeCalculationString = this.sanitizeFormula(calculationString);

        // NOTE: Use of eval() is a deliberate architectural decision to enable
        // autonomous formula generation (Meta-Reasoning). The security risk is mitigated
        // by pre-validation (validateFormula) and post-substitution sanitization.
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
   * Detailed conditional evaluation logic. Enhanced for safer numerical comparison using tolerance.
   * @param {*} value 
   * @param {string} condition - operators like '>', '<', '>=', '<=', '==', '!='
   * @param {*} threshold 
   * @returns {boolean}
   */
  checkCondition(value, condition, threshold) {
    if (value === undefined || threshold === undefined) return false;
    
    const conditionOp = condition.trim();
    
    // Priority 1: If both can be numbers, use strict numerical comparison 
    const numValue = parseFloat(value);
    const numThreshold = parseFloat(threshold);
    
    const isNumComparison = !isNaN(numValue) && !isNaN(numThreshold);

    if (isNumComparison) {
      const val = numValue;
      const thresh = numThreshold;

      switch (conditionOp) {
        case '>': return val > thresh + this.FLOAT_TOLERANCE; // Check slightly above threshold
        case '<': return val < thresh - this.FLOAT_TOLERANCE; // Check slightly below threshold
        case '>=': return val > thresh - this.FLOAT_TOLERANCE;
        case '<=': return val < thresh + this.FLOAT_TOLERANCE;
        case '==':
        case '===':
          return Math.abs(val - thresh) < this.FLOAT_TOLERANCE; // Use tolerance for floating point numbers
        case '!=':
        case '!==':
          return Math.abs(val - thresh) >= this.FLOAT_TOLERANCE;
        default:
          break; // Fall through to non-numerical comparison if operator is non-standard
      }
    }
    
    // Fallback: Non-numerical comparison using strict equality
    switch (conditionOp) {
      case '==':
      case '===':
        return value === threshold;
      case '!=':
      case '!==':
        return value !== threshold;
      default:
        // Graceful failure for unknown conditions (Error Handling)
        console.warn(`FitnessEngine: Unknown or unsupported condition operator: ${condition} for comparison.`);
        return false;
    }
  }
  
  /**
   * Maps a final fitness score (0-10) to the kernel's core capabilities (0-10).
   * This method supports the required structured output for self-assessment.
   * 
   * @param {number} fitnessScore - The result of calculate().
   * @returns {Object<string, number>} Capability scores.
   */
  static mapScoreToCapability(fitnessScore) {
      const clampedScore = Math.max(0, Math.min(10, fitnessScore));
      
      // Improvement (Meta-Reasoning): Increase the weight of the fitness score 
      // on Logic and Memory, reflecting the complexity of formula processing and configuration usage.
      
      const logicScore = 5 + clampedScore * 0.5; // Heavily tied to formula parsing (Meta-Reasoning)
      const memoryScore = 4 + clampedScore * 0.3; // Tied to configuration management/metrics storage
      const navScore = 3 + clampedScore * 0.1; // Minimal weight, as this module doesn't handle file navigation
      
      // Return capabilities with one decimal place precision
      return {
          navigation: parseFloat(navScore.toFixed(1)),
          logic: parseFloat(logicScore.toFixed(1)),
          memory: parseFloat(memoryScore.toFixed(1))
      };
  }
}

module.exports = FitnessEngine;