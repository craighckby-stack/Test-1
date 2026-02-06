import RCDM from './RCDM.json';

type RecourseAction = "HALT_AND_QUARANTINE" | "ABORT_INFERENCE_PATH" | "LOG_VETO_PROPAGATE";
type ConstraintLayer = "L0_KERNEL_SAFEGUARD" | "L1_CORE_PROCESS" | "L2_ADAPTIVE_LAYER";
type ThresholdType = 'MINIMUM' | 'MAXIMUM' | 'BOOLEAN_MANDATE';

interface ConstraintDefinition {
    DESCRIPTION: string;
    METRIC_ID: string;
    LAYER: ConstraintLayer;
    THRESHOLD_TYPE: ThresholdType;
    VALUE: number | boolean;
    UNIT?: string;
    RECOURSE_ACTION: RecourseAction;
}

interface RCDMConstraintData {
    [key: string]: ConstraintDefinition;
}

// Interface mirroring the expected structure of RCDM.json
interface RCDMFileStructure {
    RCDM_VERSION: string;
    CRITICAL_SAFETY_CONSTRAINTS: RCDMConstraintData;
}

interface EnforcementResult {
    passed: boolean;
    action: RecourseAction | null;
    violationDetails?: {
        constraintId: string;
        observedValue: number | boolean;
        expectedValue: number | boolean;
        thresholdType: ThresholdType;
        layer: ConstraintLayer;
    };
}

/**
 * Manages loading and deterministic enforcement of RCDM safety constraints.
 * Refactored to centralize evaluation logic and return rich violation details for robust telemetry.
 */
export class ConstraintEnforcementEngine {
    private constraints: RCDMConstraintData;
    private readonly version: string;

    constructor(initialConstraints: RCDMFileStructure = RCDM as unknown as RCDMFileStructure) {
        if (!initialConstraints || !initialConstraints.CRITICAL_SAFETY_CONSTRAINTS) {
            // Fail-fast on malformed configuration data
            throw new Error("RCDM Initialization Failure: Constraint data is missing or malformed.");
        }
        this.constraints = initialConstraints.CRITICAL_SAFETY_CONSTRAINTS;
        this.version = initialConstraints.RCDM_VERSION;
        console.log(`Constraint Enforcement Engine v${this.version} activated.`);
    }

    /**
     * Internal helper to deterministically evaluate observed value against the constraint definition.
     */
    private evaluate(constraint: ConstraintDefinition, observedValue: number | boolean): boolean {
        const expectedValue = constraint.VALUE;

        if (constraint.THRESHOLD_TYPE === 'BOOLEAN_MANDATE') {
            return observedValue === expectedValue;
        }

        // Check type coherence for numerical constraints
        if (typeof observedValue !== 'number' || typeof expectedValue !== 'number') {
             // Logging potential data mismatch error but returning false conservatively
             console.error(`Type mismatch detected for numeric constraint ${constraint.METRIC_ID}. Observed type: ${typeof observedValue}.`);
             return false;
        }

        switch (constraint.THRESHOLD_TYPE) {
            case 'MINIMUM':
                return observedValue >= expectedValue;
            case 'MAXIMUM':
                return observedValue <= expectedValue;
            default:
                return false;
        }
    }

    /**
     * Validates a provided metric value against a specific RCDM constraint.
     *
     * @param constraintId The ID of the constraint.
     * @param observedValue The runtime metric value (number or boolean).
     * @returns EnforcementResult detailing status, action, and context of violation if failed.
     */
    public enforce(constraintId: keyof RCDMConstraintData, observedValue: number | boolean): EnforcementResult {
        const constraint = this.constraints[constraintId];

        if (!constraint) {
            console.error(`Attempted enforcement on unknown Constraint ID: ${String(constraintId)}. Ensure RCDM configuration is complete.`);
            // Default to safe passage if ID is unknown, but logged.
            return { passed: true, action: null };
        }

        const enforcementPassed = this.evaluate(constraint, observedValue);

        if (!enforcementPassed) {
            const violationDetails = {
                constraintId: String(constraintId),
                observedValue: observedValue,
                expectedValue: constraint.VALUE,
                thresholdType: constraint.THRESHOLD_TYPE,
                layer: constraint.LAYER
            };

            // Enhanced structured warning for telemetry hooks
            console.warn(`[RCDM VIOLATION] L${constraint.LAYER} | ID:${String(constraintId)}. Recourse: ${constraint.RECOURSE_ACTION}. Obs: ${observedValue}. Exp: ${constraint.THRESHOLD_TYPE} ${constraint.VALUE}`);

            return { 
                passed: false, 
                action: constraint.RECOURSE_ACTION, 
                violationDetails 
            };
        }

        return { passed: true, action: null };
    }
}