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

// --- Gax Constraint Enforcer Kernel ---

export class GaxConstraintEnforcerKernel {
  #indexedConstraints: IndexedConstraintMap;
  #checkers: Map<string, IConstraintChecker>;

  /**
   * Initializes the kernel with pre-indexed constraints and a set of constraint checkers.
   */
  constructor(indexedConstraints: IndexedConstraintMap, checkers: IConstraintChecker[]) {
    this.#setupDependencies(indexedConstraints, checkers);
  }

  // --- Setup and Initialization ---

  /**
   * Synchronously validates dependencies and initializes internal state.
   * (Satisfies the synchronous setup extraction goal.)
   */
  #setupDependencies(indexedConstraints: IndexedConstraintMap, checkers: IConstraintChecker[]): void {
    if (!indexedConstraints || !checkers) {
      this.#throwSetupError("Indexed constraints and checkers list must be provided.");
    }
    this.#indexedConstraints = indexedConstraints;

    const checkerMap = new Map<string, IConstraintChecker>();
    for (const checker of checkers) {
      if (!checker || !checker.constraintType) {
        this.#throwSetupError("Invalid checker provided; must implement IConstraintChecker.");
      }
      checkerMap.set(checker.constraintType, checker);
    }
    this.#checkers = checkerMap;
  }

  // I/O Proxy: Setup Error Handling
  #throwSetupError(message: string): never {
    throw new Error(`[GaxConstraintEnforcerKernel Setup Error] ${message}`);
  }

  // --- Public Interface ---

  /**
   * Retrieves and enforces all relevant constraints for a specific API call.
   */
  public enforce(serviceName: string, methodName: string, request: unknown): void {
    const constraints = this.#delegateToConstraintLookup(serviceName, methodName);

    for (const constraint of constraints) {
      const checker = this.#delegateToCheckerLookup(constraint.type);

      if (!checker) {
        this.#logMissingCheckerWarning(constraint.type);
        continue;
      }

      const result = this.#executeChecker(checker, constraint, request);

      if (result.isViolated) {
        this.#throwViolationError(constraint, result);
      }
    }
  }

  // --- I/O Proxies ---

  /**
   * I/O Proxy: Calculates the effective constraints by accessing private state.
   */
  #delegateToConstraintLookup(serviceName: string, methodName: string): ConstraintDefinition[] {
    const key = `${serviceName}/${methodName}`;
    return this.#indexedConstraints.get(key) || [];
  }

  /**
   * I/O Proxy: Looks up a registered checker by type.
   */
  #delegateToCheckerLookup(constraintType: string): IConstraintChecker | undefined {
      return this.#checkers.get(constraintType);
  }

  /**
   * I/O Proxy: Executes the constraint check (External Tool Delegation).
   */
  #executeChecker(checker: IConstraintChecker, constraint: ConstraintDefinition, request: unknown): ConstraintCheckResult {
    return checker.execute(constraint, request);
  }

  /**
   * I/O Proxy: Handles logging a warning for an unregistered checker.
   */
  #logMissingCheckerWarning(constraintType: string): void {
    console.warn(`[GaxConstraintEnforcerKernel] Skipping constraint '${constraintType}'. No checker registered.`);
  }

  /**
   * I/O Proxy: Handles throwing a ConstraintViolationError (Control Flow Isolation).
   */
  #throwViolationError(constraint: ConstraintDefinition, result: ConstraintCheckResult): never {
    const message = result.violationMessage || `Constraint violation of type '${constraint.type}' detected.`;
    throw new ConstraintViolationError(message, constraint.type);
  }
}
