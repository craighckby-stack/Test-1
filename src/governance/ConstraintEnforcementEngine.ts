import { ILoggerToolKernel } from 'AGI-Kernel/tools';
import { IKernel } from 'AGI-Kernel/types';

/**
 * Placeholder for external type definitions, inferred from original usage.
 */
export interface ConstraintViolation {
    constraintName: string;
    message: string;
    details?: any;
}

/**
 * Placeholder for external type definitions, inferred from original usage.
 */
export type Constraint<T> = (subject: T) => ConstraintViolation | null;

// Assuming IConstraintEvaluatorToolKernel is defined in the plugin section below

/**
 * Optimized ConstraintEnforcementKernel utilizing a dedicated, injected IConstraintEvaluatorToolKernel 
 * for efficient and abstracted asynchronous rule checking.
 */
export class ConstraintEnforcementKernel<T> implements IKernel {
    private readonly constraints: Map<string, Constraint<T>> = new Map();
    private readonly logger: ILoggerToolKernel;
    private readonly evaluator: IConstraintEvaluatorToolKernel<T>;

    /**
     * @param dependencies.logger The kernel-compliant logger utility.
     * @param dependencies.evaluator The kernel responsible for executing constraint evaluations asynchronously.
     */
    constructor(
        dependencies: {
            logger: ILoggerToolKernel;
            evaluator: IConstraintEvaluatorToolKernel<T>;
        }
    ) {
        this.logger = dependencies.logger;
        this.evaluator = dependencies.evaluator;

        this.#setupDependencies();
    }

    /**
     * Ensures all required dependencies are present and properly initialized.
     * Adheres to the mandate of isolating synchronous setup logic.
     */
    #setupDependencies(): void {
        if (!this.logger || typeof this.logger.warn !== 'function') {
            throw new Error("ConstraintEnforcementKernel requires a valid ILoggerToolKernel.");
        }
        if (!this.evaluator || typeof this.evaluator.evaluate !== 'function') {
            throw new Error("ConstraintEnforcementKernel requires a valid IConstraintEvaluatorToolKernel.");
        }
    }

    /**
     * Asynchronous initialization phase.
     */
    async initialize(): Promise<void> {
        // Future implementation for async configuration loading or setup.
    }

    /**
     * Registers a new constraint function.
     * @param name The unique name of the constraint.
     * @param constraint The function that evaluates the subject and returns a violation or null.
     */
    registerConstraint(name: string, constraint: Constraint<T>): void {
        if (this.constraints.has(name)) {
            // Replaced console.warn with logger
            this.logger.warn(`ConstraintEnforcementKernel: Constraint "${name}" was overwritten.`);
        }
        this.constraints.set(name, constraint);
    }

    /**
     * Checks the subject against all registered constraints using the abstracted
     * asynchronous evaluation logic (delegated to the injected evaluator).
     * @param subject The data/state to validate.
     * @returns A promise resolving to an array of violations, or an empty array if compliant.
     */
    async enforce(subject: T): Promise<ConstraintViolation[]> {
        this.logger.debug("Starting constraint enforcement.");
        
        // Use the injected, asynchronous evaluator
        const violations = await this.evaluator.evaluate(this.constraints, subject);

        if (violations.length > 0) {
            // Replaced console.error with logger
            this.logger.error(
                `Constraint Enforcement Failed: Detected ${violations.length} violations.`,
                { 
                    violationCount: violations.length, 
                    violations: violations.map(v => v.constraintName) 
                }
            );
        }

        return violations;
    }
}