const { StructuredErrorBase } = require('@kernel/StructuredErrorBase');

/**
 * Base error for all Policy related exceptions. Abstracted from StructuredErrorBase
 * for maximum computational efficiency in stack trace capture and serialization.
 */
class PolicyError extends StructuredErrorBase {
  /**
   * @param {string} [message] - Descriptive error message.
   * @param {any} [details] - Additional contextual data.
   * @param {number} [status] - HTTP status code, defaults to 400 (Bad Request).
   */
  constructor(message = 'A generic policy violation occurred.', details, status = 400) {
    super(message, status);
    // Ensure details are immutable or properly handled for recursive abstraction
    this.details = Object.freeze(details);
  }
}

/**
 * Policy violation indicating insufficient access or forbidden action (HTTP 403).
 * This is distinct from authentication failure (401).
 */
class AccessDeniedPolicyError extends PolicyError {
  constructor(message = 'Access is denied based on current security policies.', policyId) {
    super(message, { policyId }, 403);
  }
}

/**
 * Policy violation indicating required preconditions were not met (HTTP 412).
 */
class PreconditionFailedError extends PolicyError {
  constructor(message = 'Required state preconditions were not satisfied.', failingConditions) {
    super(message, { failingConditions }, 412);
  }
}

module.exports = {
  PolicyError,
  AccessDeniedPolicyError,
  PreconditionFailedError,
};
