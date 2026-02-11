/**
 * MetricOperator.js
 * Defines standardized mathematical comparison operators for governance policies
 * and includes a utility function for threshold validation.
 */
const MetricOperator = {
  // -- Standard Operator Definitions --
  EQ: '==',  // Equal to
  NEQ: '!=', // Not Equal to
  GT: '>',   // Greater Than
  LT: '<',   // Less Than
  GTE: '>=', // Greater Than or Equal to
  LTE: '<=', // Less Than or Equal to

  /**
   * Validates a metric value against a policy threshold using a specified operator.
   * This function delegates the core comparison logic to the abstracted ThresholdEvaluator.
   * 
   * NOTE: In a complete application, this function would typically call an instance
   * of the ThresholdEvaluator plugin, but is implemented here for self-containment
   * and backward compatibility with the original file's interface.
   *
   * @param {number} metricValue The observed value to check.
   * @param {string} operator The comparison operator (e.g., '>', '<=').
   * @param {number} threshold The policy threshold value.
   * @returns {boolean} True if the metric satisfies the comparison condition, false otherwise.
   */
  validate: (metricValue, operator, threshold) => {
    // Ensure both inputs are valid numbers for comparison
    if (typeof metricValue !== 'number' || typeof threshold !== 'number') {
      console.warn(`Metric validation error: Non-numeric input provided (Value: ${metricValue}, Threshold: ${threshold}).`);
      return false;
    }

    const op = String(operator).toUpperCase();

    switch (op) {
      case MetricOperator.EQ:
      case '=':
      case '==':
        return metricValue === threshold;

      case MetricOperator.NEQ:
      case '!=':
        return metricValue !== threshold;

      case MetricOperator.GT:
      case '>':
        return metricValue > threshold;

      case MetricOperator.LT:
      case '<':
        return metricValue < threshold;

      case MetricOperator.GTE:
      case '>=':
        return metricValue >= threshold;

      case MetricOperator.LTE:
      case '<=':
        return metricValue <= threshold;

      default:
        console.warn(`Unknown metric operator used: ${operator}. Defaulting validation to false.`);
        return false;
    }
  }
};

module.exports = MetricOperator;