import { ConstraintEvaluator, ConstraintViolation, Constraint } from "./plugins/ConstraintEvaluator";

/**
 * Optimized ConstraintEnforcementEngine utilizing a dedicated ConstraintEvaluator
 * for efficient and abstracted rule checking and recursive abstraction.
 */
export class ConstraintEnforcementEngine<T> {
    private constraints: Map<string, Constraint<T>> = new Map();

    /**
     * Registers a new constraint function.
     * @param name The unique name of the constraint.
     * @param constraint The function that evaluates the subject and returns a violation or null.
     */
    registerConstraint(name: string, constraint: Constraint<T>): void {
        if (this.constraints.has(name)) {
            console.warn(`Constraint "${name}" was overwritten.`);
        }
        this.constraints.set(name, constraint);
    }

    /**
     * Checks the subject against all registered constraints using the abstracted
     * evaluation logic (delegated to ConstraintEvaluator).
     * @param subject The data/state to validate.
     * @returns An array of violations, or an empty array if compliant.
     */
    enforce(subject: T): ConstraintViolation[] {
        const violations = ConstraintEvaluator.evaluate(this.constraints, subject);

        if (violations.length > 0) {
            console.error(`Constraint Enforcement Failed: Detected ${violations.length} violations.`);
            // Optional: throw an EnforcementError if strict failure is required
        }

        return violations;
    }
}
