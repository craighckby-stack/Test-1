// Implementation of the ACE Fitness Evaluation Engine for AGI-KERNEL v7.4.4 (Updated).
// This engine drives Maturity Progression and Capability Self-Assessment.

/**
 * Placeholder for the dynamically loaded SafeFormulaEvaluator plugin instance.
 * In the actual kernel environment, this would be injected or retrieved from the registry.
 */
declare const SafeFormulaEvaluatorInstance: {
    evaluate: (formula: string, context: Record<string, number>) => number;
    sanitize: (formula: string) => string;
};

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
  // NOTE: MAX_FORMULA_LENGTH logic is now enforced within the SafeFormulaEvaluator plugin.
  static MAX_FORMULA_LENGTH = 512; 

  private formulaEvaluator: typeof SafeFormulaEvaluatorInstance;

  constructor(metricsConfig: any) {
    if (!metricsConfig || !metricsConfig.profiles || typeof metricsConfig.profiles !== 'object') {
        // Robust data extraction/JSON Parsing check
        console.error("FitnessEngine: Invalid or missing metrics configuration provided. Profiles object missing.");
        this.config = { profiles: {} };
        this.isOperational = false;
    } else {
        this.config = metricsConfig;
        this.isOperational = true;
    }

    // Assume SafeFormulaEvaluatorInstance is globally available after plugin load
    this.formulaEvaluator = SafeFormulaEvaluatorInstance;
    
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
  _safeGetMetricValue(rawMetrics: Record<string, any>, metricKey: string): number {
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
   * Autonomy/Security: Evaluates a dynamic metric formula using the SafeFormulaEvaluator plugin.
   * Replaces the internal, potentially error-prone evaluation logic.
   * 
   * @param {Record<string, number>} rawMetrics - Collected M_* metrics.
   * @param {string} formulaString - The metric ID or dynamic calculation string.
   * @returns {number} The calculated metric value, or 0.0 on error.
   */
  calculateDerivedMetric(rawMetrics: Record<string, any>, formulaString: string): number {
    if (!formulaString) return 0.0;

    // 1. Check if the formula is just a direct key lookup (optimization)
    if (!formulaString.match(/[+\-\*/()]/)) {
        return this._safeGetMetricValue(rawMetrics, formulaString);
    }

    // 2. Use the extracted plugin for complex evaluation (Autonomy/Logic)
    return this.formulaEvaluator.evaluate(formulaString, rawMetrics as Record<string, number>);
  }
  
  /**
   * Logic/Error Handling: Checks if a numeric value meets a specified condition (e.g., >= 5).
   * 
   * @param {number} metricValue 
   * @param {string} condition - Operator string (e.g., '>', '<=', '==').
   * @param {number} targetValue - Value to compare against.
   * @returns {boolean} True if the condition is met.
   */
  checkCondition(metricValue: number, condition: string, targetValue: number): boolean {
    // Ensure inputs are numbers (Robustness check)
    if (typeof metricValue !== 'number' || typeof targetValue !== 'number' || !isFinite(metricValue) || !isFinite(targetValue)) {
        console.warn(`Condition check received non-numeric input: ${metricValue} ${condition} ${targetValue}`);
        return false;
    }

    switch (condition.trim()) {
        case '>': return metricValue > targetValue;
        case '>=': return metricValue >= targetValue;
        case '<': return metricValue < targetValue;
        case '<=': return metricValue <= targetValue;
        case '==': 
        case '===': return Math.abs(metricValue - targetValue) < FitnessEngine.FLOAT_TOLERANCE; // Use tolerance for floats
        case '!=':
        case '!==': return Math.abs(metricValue - targetValue) >= FitnessEngine.FLOAT_TOLERANCE;
        default:
            console.error(`Unknown condition operator: ${condition}`);
            return false;
    }
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
  calculate(rawMetrics: Record<string, any>, profileName: string, historicalMetrics: Record<string, any> = {}): number {
    
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
        profile.oracles.forEach((oracle: any) => {
            
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
  _applyHistoricalAdjustment(currentScore: number, rawMetrics: Record<string, any>, historicalMetrics: Record<string, any>, profile: any): number {
      
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
  _calculateHistoricalChangeFactor(rawMetrics: Record<string, any>, historicalMetrics: Record<string, any>, profile: any): { changeType: 'reward' | 'penalty' | 'neutral', rawFactor: number } {
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
      let performanceChange: 'reward' | 'penalty' | 'neutral' = 'neutral';
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
}