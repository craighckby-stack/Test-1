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
  
  // Define internal weights structure for transparency and modularity (Logic Improvement)
  static CAPABILITY_WEIGHTS = {
      // Maps Internal Core Scores to AGI Core Capabilities (Navigation, Logic, Memory)
      navigation: { Autonomy: 0.45, Creativity: 0.35, "Meta-Reasoning": 0.20 },
      logic: { "Meta-Reasoning": 0.60, "Error Handling": 0.40 },
      memory: { "Error Handling": 0.50, "JSON Parsing": 0.50 }
  };

  // NEW: Defines how overall fitness improvement (above baseline 5.0) is distributed across internal capabilities.
  static IMPROVEMENT_DISTRIBUTION_WEIGHTS = {
      // Total sums to 1.0. Prioritizes Meta-Reasoning and Autonomy/Error Handling.
      "Error Handling": 0.20,
      "JSON Parsing": 0.10,
      "Meta-Reasoning": 0.30,
      "Autonomy": 0.25,
      "Creativity": 0.15
  };
    
  // Formalized constants for system tuning and clarity (Logic/Error Handling)
  static MAX_FITNESS = 10.0;
  static FLOAT_TOLERANCE = 1e-9;
  static EPSILON = 1e-9; 
  static HISTORICAL_IMPROVEMENT_THRESHOLD = 0.05; // 5% relative change needed for adjustment
  static HISTORICAL_MAX_ADJUSTMENT = 0.30; // Max 30% boost/penalty
  static HISTORICAL_PENALTY_RATIO = 0.5; // Regression penalty is 50% of the reward magnitude
  // NEW: Constants for robust historical comparison when metrics are near zero (Logic/Memory)
  static MIN_ABSOLUTE_HISTORY = 1e-4; // Minimum non-zero denominator for relative change stability
  static ABSOLUTE_CHANGE_THRESHOLD = 0.5; // Absolute change required if baseline is near zero
  static MAX_FORMULA_LENGTH = 512; // Maximum allowed length for dynamic metric formulas (Autonomy/Security)

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
      const exists = rawMetrics && rawMetrics.hasOwnProperty(metricKey);
      
      if (!exists) {
          // NEW IMPROVEMENT (Error Handling): Log when a referenced metric is entirely missing, indicating a data collection failure.
          console.warn(`FitnessEngine: Metric '${metricKey}' is entirely missing from rawMetrics. Using 0.0.`);
          return 0.0;
      }
      
      const value = rawMetrics[metricKey];

      // Explicitly check for null/undefined/non-number or non-finite numbers
      if (typeof value !== 'number' || !isFinite(value)) {
          // Enhanced logging for specific failure (Error Handling/Meta-Reasoning)
          console.warn(`FitnessEngine: Metric '${metricKey}' found but is unsafe/non-finite (${value}). Using 0.0.`);
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

            if (factor > FitnessEngine.FLOAT_TOLERANCE) { 
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
      score = FitnessEngine.MAX_FITNESS / (score + FitnessEngine.EPSILON); // Multiplied by MAX_FITNESS to normalize inverse scaling
    } else if (profile.optimization_goal === 'maximize') {
        // Scale up towards MAX_FITNESS
        score = Math.min(FitnessEngine.MAX_FITNESS, score);
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
        score = Math.min(score, FitnessEngine.MAX_FITNESS);
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Meta-Reasoning: Adjusts the score based on comparison to historical performance (Nexus data).
   * Rewards improvement, penalizes regression relative to the history.
   * The adjustment factor is now dynamic, proportional to the magnitude of change, utilizing formalized constants.
   */
  _applyHistoricalAdjustment(currentScore, rawMetrics, historicalMetrics, profile) {
      
      const { changeType, rawFactor } = this._calculateHistoricalChangeFactor(rawMetrics, historicalMetrics, profile);

      if (changeType === 'neutral') {
          return currentScore;
      }
      
      const PENALTY_RATIO = FitnessEngine.HISTORICAL_PENALTY_RATIO;

      if (changeType === 'reward') {
          // Reward for learning and progression (Meta-Reasoning success)
          console.log(`FitnessEngine: Historical improvement detected in ${profile.target_metric}. Applying adaptive reward (${rawFactor.toFixed(3)}).`);
          return currentScore * (1 + rawFactor);
      } else if (changeType === 'penalty') {
          // Penalty for regression (penalized less severely, using configurable PENALTY_RATIO)
          const penaltyFactor = rawFactor * PENALTY_RATIO;
          console.warn(`FitnessEngine: Historical regression detected in ${profile.target_metric}. Applying reduced adaptive penalty (${penaltyFactor.toFixed(3)}).`);
          return currentScore * (1 - penaltyFactor);
      }
      
      return currentScore; 
  }

  /**
   * Meta-Reasoning: Calculates the relative change factor based on historical data and optimization goal.
   * Centralizes progression logic for consistency across score adjustment and capability assessment.
   * IMPROVEMENT: Added robustness for near-zero historical values (Memory/Logic Stability).
   * @returns {{changeType: ('reward'|'penalty'|'neutral'), rawFactor: number}}
   */
  _calculateHistoricalChangeFactor(rawMetrics, historicalMetrics, profile) {
      const improvementThreshold = FitnessEngine.HISTORICAL_IMPROVEMENT_THRESHOLD; 
      const MAX_ADJUSTMENT = FitnessEngine.HISTORICAL_MAX_ADJUSTMENT; 
      const ABSOLUTE_THRESHOLD = FitnessEngine.ABSOLUTE_CHANGE_THRESHOLD;
      
      if (Object.keys(historicalMetrics).length === 0 || !profile || !rawMetrics) {
          return { changeType: 'neutral', rawFactor: 0 };
      }
      
      const targetMetric = profile.target_metric;
      const currentTargetValue = this.calculateDerivedMetric(rawMetrics, targetMetric);
      
      let historicalTargetValue;
      try {
           // Use a copy of the target metric ID/formula against historical data
           historicalTargetValue = this.calculateDerivedMetric(historicalMetrics, targetMetric);
      } catch (e) {
           console.warn("FitnessEngine: Could not derive historical metric value for comparison.");
           return { changeType: 'neutral', rawFactor: 0 };
      }
      
      const absoluteDifference = currentTargetValue - historicalTargetValue;
      let performanceChange = 'neutral';
      let rawMagnitude = 0.0;

      // Determine if historical comparison should use relative or absolute threshold
      const useAbsoluteThreshold = Math.abs(historicalTargetValue) < FitnessEngine.MIN_ABSOLUTE_HISTORY;
      
      let changeMet = false;

      if (useAbsoluteThreshold) {
          // If baseline is tiny, rely on absolute difference (Logic Stability)
          if (Math.abs(absoluteDifference) > ABSOLUTE_THRESHOLD) {
              changeMet = true;
              rawMagnitude = Math.abs(absoluteDifference / ABSOLUTE_THRESHOLD); // Scale based on how far it exceeded the absolute threshold
          }
      } else {
          // If baseline is stable, rely on relative difference
          let relativeDifference = absoluteDifference / historicalTargetValue;
          if (Math.abs(relativeDifference) > improvementThreshold) {
              changeMet = true;
              rawMagnitude = Math.abs(relativeDifference);
          }
      }

      if (changeMet) {
          // Determine reward/penalty based on optimization goal
          if (profile.optimization_goal === 'minimize') {
              if (absoluteDifference < 0) performanceChange = 'reward'; 
              else if (absoluteDifference > 0) performanceChange = 'penalty'; 
          } else if (profile.optimization_goal === 'maximize') {
              if (absoluteDifference > 0) performanceChange = 'reward';
              else if (absoluteDifference < 0) performanceChange = 'penalty';
          }
      }
      
      if (performanceChange === 'neutral') {
          return { changeType: 'neutral', rawFactor: 0 };
      }
      
      // Scale the adjustment proportionally up to MAX_ADJUSTMENT.
      let dynamicAdjustment = Math.min(MAX_ADJUSTMENT, rawMagnitude);
      
      // Ensure a minimum reward/penalty for successfully crossing the threshold (Autonomy stability)
      const finalFactor = Math.max(0.01, dynamicAdjustment);

      return { changeType: performanceChange, rawFactor: finalFactor };
  }

  /**
   * Autonomy/Error Handling: Sanitizes the dynamic calculation string before evaluation.
   * Only allows basic arithmetic operators, parentheses, decimals, and numbers.
   *
   * @param {string} formulaString - The string after metric substitution.
   * @returns {string} Sanitized formula string.
   */
  sanitizeFormula(formulaString) {
    // Aggressive whitelisting/removal based on acceptable JS arithmetic tokens, including E for scientific notation
    let sanitized = formulaString.replace(/[^-+*/().\s\dEe]/g, '');
    
    // Additional defense: basic check for obvious attempts to execute code post-sanitization
    // We allow 'e' and 'E' for scientific notation but nothing else.
    if (/[a-df-zA-DF-Z]/.test(sanitized)) { 
        // If any letter other than 'e' or 'E' remains, suspicious characters are present.
        console.error("FitnessEngine Security Alert: Post-substitution formula sanitization failed: suspicious characters remain.");
        return "0.0"; 
    }
    
    return sanitized;
  }

  /**
   * Internal utility to check if parentheses in a formula string are correctly balanced.
   * Crucial for robust formula validation (Error Handling/Autonomy).
   *
   * @param {string} formula - The raw metric calculation formula string.
   * @returns {boolean} True if parentheses are balanced.
   */
  _checkParenthesisBalance(formula) {
      let balance = 0;
      for (let i = 0; i < formula.length; i++) {
          const char = formula[i];
          if (char === '(') {
              balance++;
          } else if (char === ')') {
              balance--;
          }
          // Immediate check for negative balance (closing before opening)
          if (balance < 0) {
              return false;
          }
      }
      return balance === 0;
  }
  
  /**
   * Autonomy/Security: Pre-validates the formula to ensure it only references known
   * metrics and safe arithmetic structure, before substitution and evaluation.
   */
  validateFormula(formula, metricKeys) {
      // 1. Check for forbidden characters (anything not standard metrics/operators/numbers)
      // Allows A-Z, 0-9, _, +, -, *, /, ., (, ), and whitespace.
      const allowedPattern = /^[A-Z0-9_+\-*\/().\s]+$/; 
      if (!allowedPattern.test(formula)) {
          console.error("FitnessEngine Security Alert: Formula failed forbidden character check (contains unexpected characters).");
          return false;
      }
      
      // 2. Check if all "words" (potential metric IDs) are defined keys.
      const tokens = formula.match(/[A-Z_]+/g) || [];
      const unknownMetrics = tokens.filter(token => !metricKeys.includes(token));
      
      if (unknownMetrics.length > 0) {
          console.error(`FitnessEngine Security Alert: Formula references unknown metrics: ${unknownMetrics.join(', ')}`);
          return false;
      }
      
      // Normalize formula by removing spaces for structural checks
      const trimmedFormula = formula.replace(/\s/g, '');
      const metricIdPattern = /[A-Z_]+/; // Pattern for a metric ID

      // NEW SECURITY IMPROVEMENT (Error Handling/Autonomy):
      // 3a. Check for metric followed immediately by open parenthesis without operator (e.g., M_A(M_B+2))
      if (trimmedFormula.match(new RegExp(metricIdPattern.source + '\('))) {
          console.error("FitnessEngine Security Alert: Metric followed immediately by open parenthesis (missing operator).");
          return false;
      }

      // 3b. Check for close parenthesis followed immediately by metric without operator (e.g., (M_B+2)M_A)
      if (trimmedFormula.match(new RegExp('\)' + metricIdPattern.source))) {
          console.error("FitnessEngine Security Alert: Close parenthesis followed immediately by metric (missing operator).");
          return false;
      }
      
      // 4. Check parenthesis balance (Error Handling/Autonomy)
      if (!this._checkParenthesisBalance(formula)) {
          console.error("FitnessEngine Security Alert: Formula failed parenthesis balance check (structural integrity error).");
          return false;
      }
      
      // 5. Check for invalid operator sequences
      // Look for multiple non-unary operators in sequence.
      const formulaOperatorsOnly = formula.replace(/[A-Z0-9_().\s]/g, '');
      const invalidOperatorSequence = /[+\/\*]{2,}|[+\-*\/][*\/]|[*\/][+\-*\/]/; 
      
      if (invalidOperatorSequence.test(formulaOperatorsOnly.replace(/\s/g, ''))) {
          console.error("FitnessEngine Security Alert: Formula failed invalid operator sequence check (structural integrity error).");
          return false;
      }

      // 6. Check for formulas starting or ending with disallowed operators
      const trimFormula = formula.trim();
      // We allow start with + or - for unary operations.
      const disallowedStartEnd = /^[*\/]|[+\-*\/]$/; // Disallow starting with * or / OR ending with any operator

      if (disallowedStartEnd.test(trimFormula)) {
          console.error("FitnessEngine Security Alert: Formula starts or ends with invalid operator.");
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
    
    // NEW IMPROVEMENT (Autonomy/Security): Check formula length to prevent resource exhaustion from malformed input
    if (formula.length > FitnessEngine.MAX_FORMULA_LENGTH) {
        console.error(`FitnessEngine Security Alert: Formula length (${formula.length}) exceeds maximum allowed length (${FitnessEngine.MAX_FORMULA_LENGTH}). Aborting calculation.`);
        return 0.0;
    }

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
        console.error(`FitnessEngine: Formula validation failed for '${formula}'. Aborting calculation.`);
        return 0.0;
    }

    // Meta-Reasoning: Dynamic Formula Parsing and Execution
    let calculationString = formula;

    for (const metricKey of metricKeys) {
        // Use the new safe getter to ensure numerical safety
        const value = this._safeGetMetricValue(rawMetrics, metricKey);
        
        // IMPROVEMENT: Use double-escaped \b for word boundary in RegExp constructor (Security/Logic Fix).
        // Wraps value in parentheses to ensure order of operations integrity.
        calculationString = calculationString.replace(new RegExp('\\b' + metricKey + '\\b', 'g'), `(${value})`);
    }

    let result;
    try {
        // Step 1: Sanitize the resulting calculation string before execution for enhanced security and stability.
        const safeCalculationString = this.sanitizeFormula(calculationString);
        
        // NEW IMPROVEMENT (Error Handling): Pre-check for Division by Zero in the substituted numeric string
        // Searches for / followed immediately by a literal 0 (optionally surrounded by parentheses/decimals/whitespace)
        const divisionByZeroCheck = /\/(\s*\(?\s*0(\.0*)?\s*\)?)/g;
        if (divisionByZeroCheck.test(safeCalculationString)) {
             console.error(`FitnessEngine Critical Error: Detected potential division by zero after substitution: ${safeCalculationString}. Aborting calculation.`);
             return 0.0;
        }

        // Check if sanitization resulted in an empty, meaningless, or operator-only string (Error Handling)
        if (safeCalculationString.trim().length === 0 || safeCalculationString.trim() === '()' || /^[+\-*\/]*$/.test(safeCalculationString.trim())) {
             console.warn(`FitnessEngine: Sanitization resulted in an empty or operator-only calculation string for formula: ${formula}. String: ${safeCalculationString}. Returning 0.0.`);
             return 0.0;
        }

        // SECURITY IMPROVEMENT: Use Function constructor for isolated execution.
        result = (new Function('return ' + safeCalculationString))();
        
        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
            // Robust Error Handling: Check for Infinity specifically (Error Handling/Logic)
            if (result === Infinity || result === -Infinity) {
                 console.error(`FitnessEngine Critical Error: Formula execution resulted in Infinity (likely undetected division by zero or overflow) for formula: ${formula}.`);
            } else {
                 console.error(`FitnessEngine: Formula execution resulted in non-safe number for formula: ${formula}. Resulting string: ${safeCalculationString}.`);
            }
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
    const FLOAT_TOLERANCE = FitnessEngine.FLOAT_TOLERANCE;
    
    // Priority 1: If both can be numbers, use strict numerical comparison 
    const numValue = parseFloat(value);
    const numThreshold = parseFloat(threshold);
    
    const isNumComparison = !isNaN(numValue) && !isNaN(numThreshold);

    if (isNumComparison) {
      const val = numValue;
      const thresh = numThreshold;

      switch (conditionOp) {
        case '>': return val > thresh + FLOAT_TOLERANCE; // Check slightly above threshold
        case '<': return val < thresh - FLOAT_TOLERANCE; // Check slightly below threshold
        case '>=': return val > thresh - FLOAT_TOLERANCE;
        case '<=': return val < thresh + FLOAT_TOLERANCE;
        case '==':
        case '===':
          return Math.abs(val - thresh) < FLOAT_TOLERANCE; // Use tolerance for floating point numbers
        case '!=':
        case '!==' :
          return Math.abs(val - thresh) >= FLOAT_TOLERANCE;
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
      case '!==' :
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

    // 1. Initialize Base Scores
    // All internal capabilities start at 5.0 (Maturity 0 baseline)
    let coreScores = {};
    const BASELINE_SCORE = 5.0;
    const improvementWeights = FitnessEngine.IMPROVEMENT_DISTRIBUTION_WEIGHTS;

    for (const cap in improvementWeights) {
        coreScores[cap] = BASELINE_SCORE;
    }
    
    // 2. Distribute Improvement (Max 5.0 points total improvement)
    const totalImprovement = normalizedScore * 5.0; 

    for (const cap in improvementWeights) {
        const weight = improvementWeights[cap];
        // Distribute the score proportionally
        coreScores[cap] += totalImprovement * weight;
    }
    
    // 3. Strategic Alignment Boost Assessment
    const isComplexFormula = /[+\-*\/()]/.test(profile.target_metric);

    if (isComplexFormula) {
        // Reward for successful dynamic calculation (Meta-Reasoning capability)
        coreScores["Meta-Reasoning"] += normalizedScore * 0.5; 
        coreScores["Autonomy"] += normalizedScore * 0.2; // Autonomy required to handle complex definitions
    }
    
    if (profile.optimization_goal === 'minimize') {
        // High reward for identifying and solving challenging optimization problems (Creativity/Novelty)
        coreScores["Creativity"] += normalizedScore * 0.4; 
    }
    
    // 4. Historical Success Boost (Meta-Reasoning / Memory)
    const { changeType } = this._calculateHistoricalChangeFactor(rawMetrics, historicalMetrics, profile);
    
    if (changeType === 'reward') {
        // Significant bonus for demonstrating learning and progression against history
        coreScores["Meta-Reasoning"] += 0.8; 
        coreScores["Autonomy"] += 0.4;
    } else if (Object.keys(historicalMetrics).length > 0) {
        // Minor acknowledgement for engaging with historical memory
        coreScores["Meta-Reasoning"] += 0.1;
    }
    
    // 5. Final normalization and clamping (5.0 to 10.0)
    for (const key in coreScores) {
        coreScores[key] = Math.min(10.0, coreScores[key]);
        // Ensure minimum baseline reflects system stability
        coreScores[key] = Math.max(BASELINE_SCORE, coreScores[key]);
    }
    
    // 6. Map AGI Core Capabilities back to expected output keys using defined weights
    let agiScores = {};
    const weights = FitnessEngine.CAPABILITY_WEIGHTS;

    for (const agiCap in weights) {
        let weightedSum = 0;
        for (const internalCap in weights[agiCap]) {
            weightedSum += coreScores[internalCap] * weights[agiCap][internalCap];
        }
        // Clamp the final score to 10.0 and format precisely (Logic refinement)
        agiScores[agiCap] = parseFloat(Math.min(10, weightedSum).toFixed(2));
    }
    
    return agiScores;
  }
}

module.exports = FitnessEngine;