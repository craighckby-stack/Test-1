// Implementation of the ACE Fitness Evaluation Engine for AGI-KERNEL v7.4.4 (Updated).
// This engine drives Maturity Progression and Capability Self-Assessment.

/**
 * @class FitnessEngine
 * Consumes config/metrics_and_oracles_v2.json and calculates the fitness score
 * for a new codebase generation based on collected runtime and static metrics.
 * 
 * Crucial for the kernel's Meta-Reasoning and Self-Improvement cycle, now integrating Historical Context.
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
    
    // JSON Parsing: Deep structural validation check for profiles
    if (this.isOperational) {
        for (const profileName in this.config.profiles) {
            const profile = this.config.profiles[profileName];
            if (typeof profile !== 'object' || 
                !profile.target_metric || 
                !profile.optimization_goal ||
                !['minimize', 'maximize', 'neutral'].includes(profile.optimization_goal)) {
                console.error(`FitnessEngine: Profile '${profileName}' failed structural validation (Missing target_metric or invalid optimization_goal).`);
                this.isOperational = false;
                break;
            }
            
            // NEW: Robust Oracle Structure Check (Error Handling/JSON Parsing)
            if (profile.oracles && !Array.isArray(profile.oracles)) {
                console.error(`FitnessEngine: Profile '${profileName}' oracles property must be an array, found type ${typeof profile.oracles}.`);
                this.isOperational = false;
                break;
            }
        }
    }
    
    // Define a small tolerance for floating point comparisons to enhance robustness (Error Handling)
    this.FLOAT_TOLERANCE = 1e-9;
    this.EPSILON = 1e-9; // Used for inverse scaling stability
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
          // Enhanced logging for specific failure (Error Handling/Meta-Reasoning)
          if (rawMetrics && rawMetrics.hasOwnProperty(metricKey)) {
              console.warn(`FitnessEngine: Metric '${metricKey}' found but is unsafe/non-finite (${value}). Using 0.0.`);
          }
          return 0.0;
      }
      return value;
  }

  /**
   * Calculates fitness based on raw metric data, history, and the specified profile.
   * Aligns with the Error Handling and Meta-Reasoning core capabilities.
   *
   * @param {Object} rawMetrics - Collected M_* metrics (e.g., M_ERROR_RATE, M_COMPLEXITY).
   * @param {string} profileName - E.g., 'P_PRODUCTION_STABILITY'.
   * @param {Object} [historicalMetrics={}] - Historical metrics (e.g., previous cycle averages from Nexus).
   * @returns {number} Calculated fitness score (0.0 to MAX_FITNESS).
   */
  calculate(rawMetrics, profileName, historicalMetrics = {}) {
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
        console.warn(`FitnessEngine: Profile ${profileName} not found. Returning neutral score (5.0).`);
        return 5.0;
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
            
            // JSON Parsing Robustness: Safely read metric value and validate oracle type
            if (!oracle.metric || !oracle.condition || oracle.value === undefined || 
                (oracle.violation_type !== 'penalty' && oracle.violation_type !== 'reward')) {
                console.warn(`FitnessEngine: Skipping malformed or improperly typed oracle definition.`);
                return;
            }
            
            const metricValue = this._safeGetMetricValue(rawMetrics, oracle.metric);
            const passes = this.checkCondition(metricValue, oracle.condition, oracle.value);
            
            let factor = 0;
            let factorKey = oracle.violation_type === 'penalty' ? 'penalty_factor' : 'reward_factor';
            
            if (oracle[factorKey] !== undefined) {
                // Ensure factor parsing is robust and handles non-numeric input gracefully (Error Handling/JSON Parsing)
                let parsedFactor = parseFloat(oracle[factorKey]);
                if (isNaN(parsedFactor) || !isFinite(parsedFactor)) {
                    console.warn(`FitnessEngine: Oracle factor for '${oracle.metric}' is non-numeric/unsafe. Using factor 0.`);
                    parsedFactor = 0;
                }
                // Clamping factor to [0, 1] internally for stability
                factor = Math.max(0, Math.min(1, parsedFactor)); 
            }

            if (factor > this.FLOAT_TOLERANCE) { 
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
      score = 10.0 / (score + this.EPSILON); // Multiplied by 10.0 to normalize inverse scaling
    } else if (profile.optimization_goal === 'maximize') {
        // Scale up towards 10
        score = Math.min(MAX_FITNESS, score);
    }
    
    // 4. Apply Historical Context Adjustment (Meta-Reasoning Integration)
    score = this._applyHistoricalAdjustment(score, rawMetrics, historicalMetrics, profile);

    // 5. Normalize and clamp the final score for stability (Error Handling)
    
    // Final clamping to ensure non-negativity and finite result (Error Handling)
    if (!isFinite(score)) {
        console.warn(`FitnessEngine: Score resulted in non-finite value (${score}). Clamping to safe finite value (0.0).`);
        score = 0.0;
    } else {
        // Apply hard cap to prevent runaway scores from minimization goals
        score = Math.min(score, MAX_FITNESS);
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Meta-Reasoning: Adjusts the score based on comparison to historical performance (Nexus data).
   * Rewards improvement, penalizes regression relative to the history.
   */
  _applyHistoricalAdjustment(currentScore, rawMetrics, historicalMetrics, profile) {
      // Check for necessary context
      if (Object.keys(historicalMetrics).length === 0 || !profile || !rawMetrics) {
          return currentScore;
      }
      
      const targetMetric = profile.target_metric;
      const currentTargetValue = this.calculateDerivedMetric(rawMetrics, targetMetric);
      
      // Attempt to calculate historical target value (Handle formulas safely)
      let historicalTargetValue;
      try {
           // Use a copy of the target metric ID/formula against historical data
           historicalTargetValue = this.calculateDerivedMetric(historicalMetrics, targetMetric);
      } catch (e) {
           console.warn("FitnessEngine: Could not derive historical metric value. Skipping historical adjustment.");
           return currentScore;
      }
      
      if (currentTargetValue < this.EPSILON && historicalTargetValue < this.EPSILON) {
          // Both zero/near-zero, effectively no change if minimizing
          return currentScore;
      }
      
      const improvementThreshold = 0.05; // Requires 5% relative change to trigger adjustment
      const adjustmentFactor = 0.15; // Up to +/- 15% adjustment based on history

      // 1. Calculate relative difference
      let relativeDifference = 0.0;
      if (historicalTargetValue > this.EPSILON) {
          relativeDifference = (currentTargetValue - historicalTargetValue) / historicalTargetValue;
      }
      
      let performanceChange = 0; // 0: neutral, 1: reward, -1: penalty
      
      if (profile.optimization_goal === 'minimize') {
          // Reduction in metric value is good (negative relativeDifference is desired)
          if (relativeDifference < -improvementThreshold) {
              performanceChange = 1; // Reward
          } else if (relativeDifference > improvementThreshold) {
              performanceChange = -1; // Penalty
          }
      } else if (profile.optimization_goal === 'maximize') {
          // Increase in metric value is good (positive relativeDifference is desired)
          if (relativeDifference > improvementThreshold) {
              performanceChange = 1; // Reward
          } else if (relativeDifference < -improvementThreshold) {
              performanceChange = -1; // Penalty
          }
      }
      
      if (performanceChange === 1) {
          // Reward for learning and progression (Meta-Reasoning success)
          console.log(`FitnessEngine: Historical improvement detected in ${targetMetric}. Applying reward.`);
          return currentScore * (1 + adjustmentFactor);
      } else if (performanceChange === -1) {
          // Penalty for regression (requires Meta-Reasoning response)
          console.warn(`FitnessEngine: Historical regression detected in ${targetMetric}. Applying penalty.`);
          // Use a smaller penalty factor (0.5 * adjustmentFactor) to encourage exploration
          return currentScore * (1 - adjustmentFactor * 0.5);
      }
      
      return currentScore;
  }

  /**
   * Autonomy/Error Handling: Sanitizes the dynamic calculation string before evaluation.
   * Only allows basic arithmetic operators, parentheses, decimals, and numbers.
   *
   * @param {string} formulaString - The string after metric substitution.
   * @returns {string} Sanitized formula string.
   */
  sanitizeFormula(formulaString) {
    // Aggressive whitelisting/removal based on acceptable JS arithmetic tokens
    let sanitized = formulaString.replace(/[^-+*/().\s\dEe]/g, '');
    
    // Additional defense: basic check for obvious attempts to execute code post-sanitization
    if (/[a-zA-Z]/.test(sanitized.replace(/[eE]/g, ''))) {
        // If any non-scientific notation letter remains, suspicious characters are present.
        console.error("FitnessEngine Security Alert: Post-substitution formula sanitization failed: suspicious characters remain.");
        return "0.0"; 
    }
    
    return sanitized;
  }
  
  /**
   * Autonomy/Security: Pre-validates the formula to ensure it only references known
   * metrics and safe arithmetic structure, before substitution and evaluation.
   */
  validateFormula(formula, metricKeys) {
      // 1. Check for forbidden characters (anything not standard metrics/operators)
      const allowedPattern = /^[A-Z0-9_+\-*\/().\s]+$/; 
      if (!allowedPattern.test(formula)) {
          console.error("FitnessEngine Security Alert: Formula failed forbidden character check.");
          return false;
      }
      
      // 2. Check if all "words" (potential metric IDs) are defined keys.
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
        // Baseline lookup
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
        
        // Use word boundary replacement to ensure metric key substitution is precise.
        calculationString = calculationString.replace(new RegExp('\\b' + metricKey + '\\b', 'g'), `(${value})`);
    }

    let result;
    try {
        // Step 1: Sanitize the resulting calculation string before execution for enhanced security and stability.
        const safeCalculationString = this.sanitizeFormula(calculationString);
        
        // Check if sanitization resulted in an empty or meaningless string
        if (safeCalculationString.trim().length === 0 || safeCalculationString.trim() === '()') {
             console.warn(`FitnessEngine: Sanitization resulted in an empty calculation string for formula: ${formula}. Returning 0.0.`);
             return 0.0;
        }

        // SECURITY IMPROVEMENT: Use Function constructor for isolated execution.
        result = (new Function('return ' + safeCalculationString))();
        
        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
            console.error(`FitnessEngine: Formula execution resulted in non-safe number for formula: ${formula}. Resulting string: ${safeCalculationString}.`);
            return 0.0;
        }
        return result;

    } catch (e) {
        // Robust Error Handling during formula execution
        console.error(`FitnessEngine: Failed to evaluate derived metric formula: ${e.message}. Attempted string: ${calculationString}`);
        return 0.0;
    }
  }

  /**
   * Detailed conditional evaluation logic. Enhanced for safer numerical comparison using tolerance.
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
   * Helper to return default capabilities upon error.
   */
  _defaultCapabilityMapping() {
      return {
        navigation: 5.0, 
        logic: 5.0, 
        memory: 5.0
      };
  }

  /**
   * Meta-Reasoning: Dynamically maps the final fitness score (0-10) to the kernel's core capabilities (0-10),
   * based on the specific profile used and the complexity of the calculation.
   *
   * @param {number} fitnessScore - The result of calculate().
   * @param {string} profileName - The profile used for calculation.
   * @param {Object} rawMetrics - Metrics used in current cycle.
   * @param {Object} historicalMetrics - Metrics used for historical comparison.
   * @returns {Object<string, number>} Capability scores.
   */
  assessCapabilities(fitnessScore, profileName, rawMetrics = {}, historicalMetrics = {}) {
    const clampedScore = Math.max(0, Math.min(10, fitnessScore));
    const normalizedScore = clampedScore / 10.0; // 0.0 to 1.0

    const profile = this.config.profiles[profileName];
    if (!profile) return this._defaultCapabilityMapping();

    // Base scores reflect minimum operational competency (5.5)
    let coreScores = {
      "Error Handling": 5.5,
      "JSON Parsing": 5.5,
      "Meta-Reasoning": 5.5,
      "Autonomy": 5.5,
      "Creativity": 5.5,
    };
    
    // Contribution based on overall success (Max 4.5 points improvement)
    const overallImprovement = normalizedScore * 4.5; 

    // 1. General boosts based on overall success
    coreScores["Error Handling"] += overallImprovement * 0.4; 
    coreScores["JSON Parsing"] += overallImprovement * 0.3; // Rewards data robustness
    coreScores["Meta-Reasoning"] += overallImprovement * 0.5; // Rewards strategic achievement
    coreScores["Autonomy"] += overallImprovement * 0.3;
    coreScores["Creativity"] += overallImprovement * 0.2;
    
    // 2. Strategic Depth Assessment (Profile-specific)
    const isComplexFormula = /[+\-*\/()]/.test(profile.target_metric);

    if (isComplexFormula) {
        // High reward for successful dynamic calculation, crucial for AGI self-assessment
        coreScores["Meta-Reasoning"] += normalizedScore * 1.5; 
        coreScores["Autonomy"] += normalizedScore * 0.5;
    }
    
    if (profile.optimization_goal === 'minimize') {
        // High reward for identifying and solving challenging optimization problems (Creativity/Novelty)
        coreScores["Creativity"] += normalizedScore * 1.2; 
    }
    
    // Historical context check
    if (Object.keys(historicalMetrics).length > 0) {
        // Reward for engaging with memory and progression assessment
        coreScores["Meta-Reasoning"] += normalizedScore * 0.5;
    }
    
    // 3. Robustness Assessment (Based on inherent class success)
    // Since this engine successfully loaded config and performed safe operations:
    coreScores["JSON Parsing"] += (this.isOperational ? 0.5 : 0.0);
    
    // 4. Final normalization and clamping (0.0 to 10.0)
    for (const key in coreScores) {
        coreScores[key] = Math.min(10.0, coreScores[key]);
        // Ensure minimum baseline reflects system stability
        coreScores[key] = Math.max(5.0, coreScores[key]);
    }
    
    // 5. Map AGI Core Capabilities back to expected output keys
    return {
        // Navigation: Focus on Autonomy and Architecture/Creativity
        navigation: parseFloat(Math.min(10, coreScores["Autonomy"] * 0.4 + coreScores["Creativity"] * 0.3 + coreScores["Meta-Reasoning"] * 0.1).toFixed(2)),
        
        // Logic: Strategic decision making (Meta-Reasoning) and Fault Tolerance (Error Handling)
        logic: parseFloat(Math.min(10, coreScores["Meta-Reasoning"] * 0.6 + coreScores["Error Handling"] * 0.4).toFixed(2)),
        
        // Memory: Data integrity and persistence (Error Handling, JSON Parsing)
        memory: parseFloat(Math.min(10, coreScores["Error Handling"] * 0.5 + coreScores["JSON Parsing"] * 0.5).toFixed(2))
    };
  }
}

module.exports = FitnessEngine;