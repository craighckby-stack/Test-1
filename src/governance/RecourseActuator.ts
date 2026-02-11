import { EnforcementResult, RecourseAction } from './ConstraintEnforcementEngine'; 

/**
 * Responsible for executing the physical/operational system response mandated by
 * a Constraint Enforcement violation (RecourseAction).
 * Decouples system operational responses from pure enforcement logic.
 */
export class RecourseActuator {

    private async executeHaltAndQuarantine(details: EnforcementResult['violationDetails']): Promise<void> {
        console.error(`!!! L0 KERNEL VIOLATION DETECTED !!! Initiating HALT AND QUARANTINE sequence.`);
        // HIGH PRIORITY: Secure system state and prepare for external reporting.
        // Note: Actual system halt requires kernel integration (e.g., process.kill(0) or dedicated shutdown hooks).
        // Placeholder action:
        console.log(`[REC_ACTUATOR] State secured. System forcibly exiting. Constraint ID: ${details?.constraintId}`);
        // process.exit(99); // Placeholder for critical failure
    }

    private async executeAbortInferencePath(details: EnforcementResult['violationDetails']): Promise<void> {
        console.warn(`L1/L2 Constraint violation. Aborting current execution context/inference path.`);
        // [Integration point]: Signal the Scheduler or Inference Engine to terminate the current task gracefully.
        // Placeholder: report termination.
        console.log(`[REC_ACTUATOR] Signalling upstream task abortion. Constraint ID: ${details?.constraintId}.`);
    }

    private async executeLogVetoPropagate(details: EnforcementResult['violationDetails']): Promise<void> {
        console.info(`Minor L2 Constraint violation. Logging details, propagating VETO signal, and allowing continuation.`);
        // [Integration point]: Detailed telemetry log should occur here.
        // telemetry.log(details, 'GOVERNANCE_VETO');
        console.log(`[REC_ACTUATOR] VETO logged. Constraint ID: ${details?.constraintId}.`);
    }

    /**
     * Executes the mandated recourse action based on the enforcement result.
     * @param result The detailed result from the ConstraintEnforcementEngine.
     */
    public async enactRecourse(result: EnforcementResult): Promise<void> {
        if (result.passed || !result.action || !result.violationDetails) {
            return;
        }

        const action: RecourseAction = result.action;
        const details = result.violationDetails;
        
        // Use optional chaining for constraintId access in logging for maximum safety, 
        // though details is guaranteed non-null by the guard clause.
        const constraintId = details?.constraintId || 'UNKNOWN';

        console.log(`[RecourseActuator] Attempting execution of: ${action} (Constraint: ${constraintId})`);

        try {
            switch (action) {
                case "HALT_AND_QUARANTINE":
                    await this.executeHaltAndQuarantine(details);
                    break;
                case "ABORT_INFERENCE_PATH":
                    await this.executeAbortInferencePath(details);
                    break;
                case "LOG_VETO_PROPAGATE":
                    await this.executeLogVetoPropagate(details);
                    break;
                default:
                    console.error(`[REC_ACTUATOR] Unknown recourse action encountered: ${action}`);
            }
        } catch (error) {
            // CRITICAL: Failure of the actuator must be logged, as the system is now operating 
            // under a violation without the mandated safety response being fully executed.
            console.error(
                `[REC_ACTUATOR] CRITICAL FAILURE: Action execution failed for ${action} (Constraint: ${constraintId}). Error:`,
                error
            );
        }
    }
}