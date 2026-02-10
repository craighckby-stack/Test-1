import { SecureExpressionEvaluator } from '../utils/SecureExpressionEvaluator';

// Define constants for robust type checking and future refactoring
const CONTROL_TYPES = {
    CONSTRAINT_POLICY: 'CONSTRAINT_POLICY',
    PRIORITY_WEIGHT: 'PRIORITY_WEIGHT'
};
const DEFAULT_WEIGHT_AGGREGATION = 'MAX';

/**
 * @class ConflictResolutionEngine
 * Manages the evaluation of competing operational requests against the CRCM (Conflict Resolution Constraint Model).
 * Utilizes a SecureExpressionEvaluator to safely execute complex weighting formulas.
 * Improvement: Logic simplified by delegating constraint checking and weight aggregation to ConflictModelEvaluator plugin.
 */
class ConflictResolutionEngine {
  /**
   * @param {Object} crcm - The Conflict Resolution Constraint Model structure.
   * @param {SecureExpressionEvaluator} evaluator - Secure utility for running dynamic CRCM formulas.
   */
  constructor(crcm, evaluator) {
    if (!evaluator || typeof evaluator.evaluate !== 'function') {
        throw new Error("ConflictResolutionEngine requires a SecureExpressionEvaluator instance.");
    }
    this.crcm = crcm;
    this.evaluator = evaluator;
    // Pre-process CRCM for O(1) domain lookup, storing the full domain object.
    this.domainMap = this._buildDomainMap(crcm.domains);
    // Bind the evaluator function for easy passing to the plugin
    this._evaluatorFn = this.evaluator.evaluate.bind(this.evaluator);
  }

  /**
   * Pre-processes the CRCM structure for fast lookup by domain_id, storing the full domain context.
   * @param {Array<Object>} domains
   * @returns {Map<string, Object>} Map of domain_id to the full domain object.
   */
  _buildDomainMap(domains) {
    const map = new Map();
    if (domains && Array.isArray(domains)) {
        for (const domain of domains) {
            if (domain.domain_id) {
                // Store the entire domain object for context access (e.g., aggregation type)
                map.set(domain.domain_id, domain);
            }
        }
    }
    return map;
  }

  /**
   * Evaluates competing requests against CRCM constraints and calculates resolution weight.
   * Finds the single request with the highest calculated priority weight that meets all constraints.
   * 
   * @param {Array<Object>} competingRequests - List of operational requests, each having `appliesTo` (domain ID).
   * @param {Object} currentContext - Runtime context variables (TCS, Urgency, EthicalSeverity).
   * @returns {{winningRequest: Object|null, resolutionWeight: number, resolutionMetadata: Object}}
   */
  resolveConflict(competingRequests, currentContext) {
    // NOTE: ConflictModelEvaluator is an active plugin utilized here.

    if (!Array.isArray(competingRequests) || competingRequests.length === 0) {
        return { winningRequest: null, resolutionWeight: -Infinity, resolutionMetadata: { reason: "No competing requests provided." } };
    }
    if (!currentContext || typeof currentContext !== 'object') {
        console.warn("Context missing or invalid in ConflictResolutionEngine.");
    }
    
    let winningRequest = null;
    let highestWeight = -Infinity;
    let resolutionMetadata = {};

    for (const request of competingRequests) {
      const domainId = request.appliesTo;
      const domain = this.domainMap.get(domainId);

      if (!domain || !Array.isArray(domain.controls)) continue;

      const applicableControls = domain.controls;
      const aggregationMethod = domain.aggregation_method || DEFAULT_WEIGHT_AGGREGATION;

      // Delegate scoring and constraint checking to the ConflictModelEvaluator plugin
      const evaluationResult = ConflictModelEvaluator.execute({
          controls: applicableControls,
          context: currentContext,
          aggregationMethod: aggregationMethod,
          evaluatorFn: this._evaluatorFn // Pass the secure evaluator function bound in the constructor
      });
      
      const { score, isViable, violationDetails, appliedControls } = evaluationResult;

      // If the request survived constraints and has a higher weight, it wins
      if (isViable && score > highestWeight) {
        highestWeight = score;
        winningRequest = request;
        resolutionMetadata = { 
            appliedControls: appliedControls,
            domainAggregation: aggregationMethod,
            violationDetails: null // Clear previous violations
        };
      } else if (!isViable) {
        // Capture rejection metadata for debugging/learning, even if it didn't win
        if (!resolutionMetadata.rejectedRequests) resolutionMetadata.rejectedRequests = [];
        resolutionMetadata.rejectedRequests.push({ 
            requestId: request.id || 'unknown',
            domainId: domainId,
            violation: violationDetails
        });
      }
    }
    
    // Cleanup metadata if a winner was found
    if (winningRequest && resolutionMetadata.rejectedRequests) {
        delete resolutionMetadata.rejectedRequests;
    }

    return {
      winningRequest: winningRequest,
      resolutionWeight: highestWeight,
      resolutionMetadata: resolutionMetadata
    };
  }
}
module.exports = ConflictResolutionEngine;