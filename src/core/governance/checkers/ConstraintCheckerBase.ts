import { TxContext, GAXConstraintSet, ConstraintViolation } from '../types';

/**
 * IConstraintChecker defines the interface for specialized constraint checkers.
 * This pattern allows ConstraintEnforcer to register and run specific categories
 * of checks dynamically, decoupled from the core execution loop.
 */
export interface IConstraintChecker {
    /** Identifier for debugging and logging. Should be unique across checkers. */
    checkerId: string;

    /**
     * Initializes the checker with relevant parts of the GAX constraint set.
     * @param constraints The global set of constraints used for validation logic.
     */
    initialize(constraints: GAXConstraintSet): void;

    /**
     * Runs the specific category of checks against the transaction context.
     * @param txContext The context (including metadata and state) of the transaction being checked.
     * @returns A list of violations found. Returns an empty array if no violations exist.
     */
    check(txContext: TxContext): ConstraintViolation[];
}