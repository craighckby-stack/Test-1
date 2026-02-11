/**
 * SAG V94.2 - Core Policy Type Definitions
 * Standardizes data structures used throughout the GAX Policy subsystem
 * (Verification, Structuring, Remediation).
 */

/**
 * Creates an immutable, empty object placeholder used for type consistency referencing.
 * This enforces a standardized approach for exporting structural types.
 * @returns {Readonly<Object<string, never>>}
 */
const _createTypePlaceholder = () => Object.freeze({});

/**
 * @typedef {object} Constraint
 * @property {string} constraintId - Unique ID of the violating constraint.
 * @property {string} axiomName - Name of the foundational axiom violated (e.g., 'Isolation_Priority').
 * @property {object} context - Specific variables or values involved in the conflict.
 */

/**
 * @typedef {Object<string, *>} PolicyDelta
 * A map representing changes to be applied to the current Policy State.
 * Keys are policy paths (string), values are the desired state updates (any).
 */

/**
 * @typedef {object} VerificationResult
 * The output structure from the PolicyFormalVerificationUnit.
 * @property {boolean} isVerified - True if verification passed.
 * @property {string} resultCategory - Category of failure (e.g., 'AXIOMATIC_VIOLATION', 'DEPENDENCY_MISSING').
 * @property {Array<Constraint>} failureConstraints - List of specific constraints or axioms violated.
 * @property {number} executionTimeMs - Time taken for verification.
 */

/**
 * Explicitly exporting immutable placeholders for the types defined above.
 * This guarantees the consistency of type references across the Policy subsystem.
 */
module.exports = {
  Constraint: _createTypePlaceholder(),
  PolicyDelta: _createTypePlaceholder(),
  VerificationResult: _createTypePlaceholder()
};
