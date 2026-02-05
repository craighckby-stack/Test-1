import RCDM from './RCDM.json';

type RecourseAction = "HALT_AND_QUARANTINE" | "ABORT_INFERENCE_PATH" | "LOG_VETO_PROPAGATE";
type ConstraintLayer = "L0_KERNEL_SAFEGUARD" | "L1_CORE_PROCESS" | "L2_ADAPTIVE_LAYER";

interface ConstraintDefinition {
    DESCRIPTION: string;
    METRIC_ID: string;
    LAYER: ConstraintLayer;
    THRESHOLD_TYPE: 'MINIMUM' | 'MAXIMUM' | 'BOOLEAN_MANDATE';
    VALUE: number | boolean;
    UNIT?: string;
    RECOURSE_ACTION: RecourseAction;
}

// Utility type to enforce RCDM structure typing
type RCDMConstraints = typeof RCDM.CRITICAL_SAFETY_CONSTRAINTS;

/**
 * Manages loading and deterministic enforcement of RCDM safety constraints.
 */
export class ConstraintEnforcementEngine {
    private constraints: RCDMConstraints;

    constructor() {
        this.constraints = RCDM.CRITICAL_SAFETY_CONSTRAINTS as RCDMConstraints;
        console.log(`Constraint Enforcement Engine activated. RCDM v${RCDM.RCDM_VERSION} loaded.`);
    }

    /**
     * Validates a provided metric value against a specific RCDM constraint.
     *
     * @param constraintId The ID of the constraint (key in CRITICAL_SAFETY_CONSTRAINTS).
     * @param observedValue The runtime metric value (e.g., S-01 Trust Score).
     * @returns An object containing enforcement status and the necessary recourse action if failed.
     */
    public enforce(constraintId: keyof RCDMConstraints, observedValue: number | boolean): { enforcementPassed: boolean, action: RecourseAction | null } {
        const constraint = this.constraints[constraintId] as ConstraintDefinition;
        let enforcementPassed = false;

        switch (constraint.THRESHOLD_TYPE) {
            case 'MINIMUM':
                enforcementPassed = (typeof observedValue === 'number') && (observedValue >= (constraint.VALUE as number));
                break;
            case 'MAXIMUM':
                enforcementPassed = (typeof observedValue === 'number') && (observedValue <= (constraint.VALUE as number));
                break;
            case 'BOOLEAN_MANDATE':
                enforcementPassed = (observedValue === constraint.VALUE);
                break;
        }

        if (!enforcementPassed) {
            console.warn(`RCDM Violation (${constraint.LAYER}): ${constraintId}. Observed: ${observedValue}. Recourse: ${constraint.RECOURSE_ACTION}`);
            // Must return the defined action upon failure for deterministic governance pathing
            return { enforcementPassed: false, action: constraint.RECOURSE_ACTION };
        }

        return { enforcementPassed: true, action: null };
    }
}