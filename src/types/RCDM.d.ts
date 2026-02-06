type RecourseAction = "HALT_AND_QUARANTINE" | "ABORT_INFERENCE_PATH" | "LOG_VETO_PROPAGATE";
type ConstraintLayer = "L0_KERNEL_SAFEGUARD" | "L1_CORE_PROCESS" | "L2_ADAPTIVE_LAYER";
type ThresholdType = 'MINIMUM' | 'MAXIMUM' | 'BOOLEAN_MANDATE';

export interface ConstraintDefinition {
    DESCRIPTION: string;
    METRIC_ID: string;
    LAYER: ConstraintLayer;
    THRESHOLD_TYPE: ThresholdType;
    VALUE: number | boolean;
    UNIT?: string;
    RECOURSE_ACTION: RecourseAction;
}

export interface RCDMConstraintData {
    [key: string]: ConstraintDefinition;
}

/**
 * Definitive type structure for the RCDM configuration file (RCDM.json).
 */
export interface RCDMFileStructure {
    RCDM_VERSION: string;
    CRITICAL_SAFETY_CONSTRAINTS: RCDMConstraintData;
}

// Augmenting module definition for direct JSON import typing
declare module "./RCDM.json" {
    const RCDM: RCDMFileStructure;
    export default RCDM;
}