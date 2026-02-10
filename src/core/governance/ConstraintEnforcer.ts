import { GAXConstraintSet, TxContext, ConstraintViolation, ConstraintValidationResult } from './types';
import rawConstraints from '../../../registry/protocol/gax_constraint_set.json';
import { ConstraintValidator } from './ConstraintValidator';

// Conceptual Plugin Import/Usage Definition
// This utility abstracts the limit check and violation object creation.
declare const LimitCheckAndViolationCreator: {
    execute: (args: {
        contextValue: number;
        limitConfig: { limit: number, failure_mode: 'REJECT' | 'WARN' };
        constraintName: string;
        messageGenerator: (used: number, limit: number) => string;
        details?: object;
    }) => ConstraintViolation | null;
};


/**
 * Manages, validates, and enforces all system constraints (GAX).
 * Decouples constraint logic from transaction execution flow and provides generalization for checking limits.
 */
export class ConstraintEnforcer {
    private constraints: GAXConstraintSet;

    /**
     * Loads and validates the constraint set upon initialization, ensuring data integrity.
     */
    constructor() {
        // Step 1: Runtime validation of static configuration file structure
        const validationResult: ConstraintValidationResult = ConstraintValidator.validate(rawConstraints);

        if (validationResult.success) {
            // Cast is safe after successful validation
            this.constraints = rawConstraints as GAXConstraintSet;
            console.log(`GAX Constraint Enforcer initialized (v${this.constraints.schema_version})`);
        } else {
            // Prevent startup if core governance definitions are malformed
            throw new Error(`Failed to load GAX Constraints due to validation errors:\n- ${validationResult.errors.join('\n- ')}`);
        }
    }

    /** 
     * Runs the transaction context through all configured constraints. 
     * Returns an array of violations if any constraints are broken, allowing higher layers to handle rejection/warning based on failure mode.
     *
     * @param txContext The standardized transaction context object containing runtime execution metadata.
     * @returns An array of structured ConstraintViolation objects, or null if compliant.
     */
    public checkTransaction(txContext: TxContext): ConstraintViolation[] | null {
        const violations: ConstraintViolation[] = [];

        // Phase 1: Global Execution Limits (Gas, Size, Memory, etc.)
        violations.push(...this._checkGlobalExecutionLimits(txContext));

        // Phase 2: System Integrity/Protocol Specific Limits (e.g., Max State Writes)
        // Future phases can be added here, maintaining a clean pipeline structure.

        return violations.length > 0 ? violations : null;
    }

    /** Retrieves the state of a system governance feature toggle. */
    public getToggle(feature: keyof GAXConstraintSet['system_governance_toggles']): boolean {
        return this.constraints.system_governance_toggles[feature];
    }

    /**
     * Handles all constraints defined under the 'global_execution_limits' section.
     * Delegates limit checking and violation object generation to the dedicated utility plugin.
     * @private
     */
    private _checkGlobalExecutionLimits(txContext: TxContext): ConstraintViolation[] {
        const violations: ConstraintViolation[] = [];
        const limits = this.constraints.global_execution_limits;

        // Check 1: Max Gas Units
        const gasUsed = txContext.resources?.gas || 0;
        
        const gasViolation = LimitCheckAndViolationCreator.execute({
            contextValue: gasUsed,
            limitConfig: limits.max_gas_units_per_tx,
            constraintName: 'MAX_GAS_UNITS',
            messageGenerator: (used, limit) => `Tx exceeded max gas limit: ${limit}. Used: ${used}.`
        });
        
        if (gasViolation) violations.push(gasViolation);

        // Check 2: Max Payload Size
        const payloadSize = txContext.payload_size || 0;
        
        const sizeViolation = LimitCheckAndViolationCreator.execute({
            contextValue: payloadSize,
            limitConfig: limits.max_payload_bytes,
            constraintName: 'MAX_PAYLOAD_SIZE',
            messageGenerator: (size, limit) => `Tx payload size (${size}B) exceeded limit: ${limit}B.`
        });
        
        if (sizeViolation) violations.push(sizeViolation);

        // Check N: Future limits can be added easily here, using the common plugin pattern.

        return violations;
    }
}