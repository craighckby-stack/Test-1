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
 * Improvement: Now supports configurable weight aggregation (SUM or MAX) per domain and provides enhanced violation reporting.
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
   * Applies priority weight based on the defined aggregation method for the domain.
   * @param {number} currentWeight
   * @param {number} calculatedValue
   * @param {string} aggregationMethod
   * @returns {number} The updated weight.
   */
  _applyPriorityWeight(currentWeight, calculatedValue, aggregationMethod) {
      if (aggregationMethod === 'SUM') {
          return currentWeight + calculatedValue;
      }
      // Defaults to MAX aggregation
      return Math.max(currentWeight, calculatedValue);
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

      let currentRequestWeight = 0;
      let violationDetails = null;
      let appliedControls = [];
      let isViable = true;

      for (const control of applicableControls) {
        if (typeof control.weight_formula !== 'string') continue;
        
        let calculatedValue;
        try {
            // Use the injected secure evaluator
            calculatedValue = this.evaluator.evaluate(control.weight_formula, currentContext);
        } catch (e) {
            // Error in evaluation means the control cannot be trusted/applied, treat as non-viable or log failure.
            console.error(`Evaluation error for control ${control.id}: ${e.message}`);
            calculatedValue = 0; 
        }

        appliedControls.push({ controlId: control.id, type: control.control_type, value: calculatedValue });

        // 1. Check for VETO constraints (CONSTRAINT_POLICY)
        // A value of 0 indicates failure/violation.
        if (control.control_type === CONTROL_TYPES.CONSTRAINT_POLICY && calculatedValue === 0) {
          isViable = false;
          violationDetails = {
            constraintId: control.id,
            reason: `VETO constraint failed: Formula evaluated to 0.`
          };
          currentRequestWeight = -Infinity; // Immediate veto
          break; 
        }

        // 2. Determine Priority Weight
        if (control.control_type === CONTROL_TYPES.PRIORITY_WEIGHT) {
            currentRequestWeight = this._applyPriorityWeight(currentRequestWeight, calculatedValue, aggregationMethod);
        }
      }

      // If the request survived constraints and has a higher weight, it wins
      if (isViable && currentRequestWeight > highestWeight) {
        highestWeight = currentRequestWeight;
        winningRequest = request;
        resolutionMetadata = { 
            appliedControls: appliedControls,
            domainAggregation: aggregationMethod,
            violationDetails: null // Clear previous violations
        };
      } else if (!isViable) {
        // Capture rejection metadata for debugging/learning, even if it didn't win
        if (!resolutionMetadata.rejectedRequests) resolutionMetadata.rejectedRequests = [];
        // Assuming requests have IDs for traceability
        resolutionMetadata.rejectedRequests.push({ 
            requestId: request.id || 'unknown',
            domainId: domainId,
            violation: violationDetails
        });
      }
    }
    
    // Ensure final metadata is clean if a winner was found
    if (winningRequest && resolutionMetadata.rejectedRequests) {
        // Remove transient tracking data if a definitive winner was found
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