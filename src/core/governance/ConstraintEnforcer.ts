import { GAXConstraintSet, TxContext, ConstraintViolation, ConstraintValidationResult } from './types';
import rawConstraints from '../../../registry/protocol/gax_constraint_set.json';
import { ConstraintValidator } from './ConstraintValidator';

/**
 * Manages, validates, and enforces all system constraints (GAX).
 * Decouples constraint logic from transaction execution flow.
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

        // --- Constraint Runner Loop/Registry (currently inline for simple examples) ---

        // Check 1: Max Gas Units
        const gasUsed = txContext.resources?.gas || 0;
        const gasLimitCfg = this.constraints.global_execution_limits.max_gas_units_per_tx;

        if (gasUsed > gasLimitCfg.limit) {
            violations.push({
                constraint: 'MAX_GAS_UNITS',
                level: gasLimitCfg.failure_mode,
                message: `Tx exceeded max gas limit: ${gasLimitCfg.limit}. Used: ${gasUsed}.`,
                details: { used: gasUsed, limit: gasLimitCfg.limit, action: gasLimitCfg.failure_mode }
            });
        }

        // Check 2: Max Payload Size (Hypothetical, for pattern illustration)
        const payloadSize = txContext.payload_size || 0;
        const sizeLimitCfg = this.constraints.global_execution_limits.max_payload_bytes;
        
        if (payloadSize > sizeLimitCfg.limit) {
            violations.push({
                constraint: 'MAX_PAYLOAD_SIZE',
                level: sizeLimitCfg.failure_mode,
                message: `Tx payload size (${payloadSize}B) exceeded limit: ${sizeLimitCfg.limit}B.`,
                details: { size: payloadSize, limit: sizeLimitCfg.limit }
            });
        }

        return violations.length > 0 ? violations : null;
    }

    /** Retrieves the state of a system governance feature toggle. */
    public getToggle(feature: keyof GAXConstraintSet['system_governance_toggles']): boolean {
        return this.constraints.system_governance_toggles[feature];
    }
}