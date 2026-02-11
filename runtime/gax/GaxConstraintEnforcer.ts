declare const PayloadSizeChecker: { execute: (args: { request: unknown, limit: number, unit?: string }) => boolean; };

// --- Constraint Definitions ---
export class ConstraintViolationError extends Error {
  public constraintType: string;
  
  constructor(message: string, constraintType: string) {
    super(`Constraint violation detected: ${message}`);
    this.name = 'ConstraintViolationError';
    this.constraintType = constraintType;
  }
}

export interface ConstraintDefinition {
  type: 'rate_limit' | 'payload_size' | 'timeout' | string; // Use known constraint types for better DX
  value: number | string;
  unit?: string;
  appliesTo: 'service' | 'method' | 'field';
}

// Defines the optimized lookup structure: Map<"serviceName/methodName", ConstraintDefinition[]>
export type IndexedConstraintMap = Map<string, ConstraintDefinition[]>; 

// --- Plugin Interface Definitions ---

export interface ConstraintCheckResult {
    isViolated: boolean;
    violationMessage?: string;
}

export interface IConstraintChecker {
    /** The type of constraint this checker handles (e.g., 'payload_size'). */
    readonly constraintType: string; 
    /** Executes the check against the request and constraint definition. */
    execute(constraint: ConstraintDefinition, request: unknown): ConstraintCheckResult;
}

// --- Gax Constraint Enforcer (Refactored) ---

export class GaxConstraintEnforcer {
  private indexedConstraints: IndexedConstraintMap;
  private checkers: Map<string, IConstraintChecker>;

  /**
   * Initializes the enforcer with pre-indexed constraints and a set of constraint checkers.
   * Indexing logic (inheritance, merging) must occur externally.
   */
  constructor(indexedConstraints: IndexedConstraintMap, checkers: IConstraintChecker[]) {
    this.indexedConstraints = indexedConstraints;
    this.checkers = new Map();
    for (const checker of checkers) {
      this.checkers.set(checker.constraintType, checker);
    }
  }

  /**
   * Retrieves and enforces all relevant constraints for a specific API call.
   */
  public enforce(serviceName: string, methodName: string, request: unknown): void {
    const constraints = this.getEffectiveConstraints(serviceName, methodName);

    for (const constraint of constraints) {
      const checker = this.checkers.get(constraint.type);

      if (!checker) {
        // If a constraint is defined but no checker exists, skip it but log a warning
        console.warn(`[GaxConstraintEnforcer] Skipping constraint '${constraint.type}'. No checker registered.`);
        continue;
      }

      const result = checker.execute(constraint, request);

      if (result.isViolated) {
        const message = result.violationMessage || `Constraint violation of type '${constraint.type}' detected.`;
        throw new ConstraintViolationError(message, constraint.type);
      }
    }
  }

  /**
   * Calculates the effective constraints. O(1) lookup since constraints are pre-indexed by method.
   */
  private getEffectiveConstraints(serviceName: string, methodName: string): ConstraintDefinition[] {
    const key = `${serviceName}/${methodName}`;
    return this.indexedConstraints.get(key) || [];
  }
}