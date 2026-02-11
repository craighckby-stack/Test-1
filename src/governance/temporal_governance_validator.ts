import { PESMSchema } from './policy_evolution_schema';

// NOTE: We assume 'TemporalWindowIntegrityValidatorTool' is globally available or injected
// as provided in the AGI-KERNEL plugin registry.

interface ITemporalWindowValidatorResult {
    success: boolean;
    error?: string;
}

// Define precise types for the external tool's arguments
interface ITemporalValidatorArgs {
    stagingTimestamp: number | string;
    vetoWindowEnd: number | string;
    durationMs: number;
    requestFinalization?: boolean;
    toleranceMs?: number;
}

// Define the type for the tool function itself
type TemporalValidatorTool = (args: ITemporalValidatorArgs) => ITemporalWindowValidatorResult;

// Mock function signature for the external plugin call (for TypeScript visibility)
declare function TemporalWindowIntegrityValidatorTool(args: ITemporalValidatorArgs): ITemporalWindowValidatorResult;

/**
 * Validates the temporal requirements defined in the PESM schema,
 * specifically enforcing the HIL-T Veto Check period using the external
 * TemporalWindowIntegrityValidatorTool.
 */
export class TemporalGovernanceValidator {
    private static readonly VETO_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours
    
    private readonly validatorTool: TemporalValidatorTool;

    constructor(tool: TemporalValidatorTool = TemporalWindowIntegrityValidatorTool) {
        this.validatorTool = tool;
    }

    /**
     * Ensures the vetoWindowEnd is correctly set based on stagingTimestamp and verifies
     * that the current time has passed this window if finalization is requested.
     * @param manifest The policy evolution manifest object.
     * @param requestFinalization True if checking for S0 integration readiness.
     */
    public validate(manifest: PESMSchema, requestFinalization: boolean = false): boolean | Error {
        const { stagingMetadata } = manifest;

        const result = this.validatorTool({
            stagingTimestamp: stagingMetadata.stagingTimestamp,
            vetoWindowEnd: stagingMetadata.vetoWindowEnd,
            durationMs: TemporalGovernanceValidator.VETO_DURATION_MS,
            requestFinalization: requestFinalization,
            toleranceMs: 1000 // 1 second margin
        });

        if (!result.success) {
            // Map the generic plugin error message back to the domain-specific context
            let errorMessage = result.error || "Temporal validation failed.";

            if (errorMessage.includes("Temporal Integrity Failure")) {
                // Mapping 1: PESM Integrity Check
                errorMessage = errorMessage.replace("Temporal Integrity Failure", "PESM Integrity Failure");
            } else if (errorMessage.includes("Enforcement blocked")) {
                // Mapping 2: HIL-T Specific Enforcement
                const remainingMatch = errorMessage.match(/Remaining: ([\d.]+) hours\./);
                const remainingHours = remainingMatch ? remainingMatch[1] : "unknown";

                errorMessage = `Deployment blocked. Mandatory HIL-T Veto Check period still active. Remaining: ${remainingHours} hours.`;
            }
            
            throw new Error(errorMessage);
        }

        return true;
    }
}