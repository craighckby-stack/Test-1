/**
 * GovernanceStateTracker (GST)
 * Monitors and records the current phase, active ruleset execution, and decision lifecycle against the RCDM config.
 */

import { RCDM_CONFIG } from './RCDM.json';

// Define the interface for the injected tool for TypeScript compatibility
interface IRCDMPhaseTransitionValidator {
    execute(args: { rcdmConfig: any, newPhaseId: string }): { success: boolean, rulesetId: string | null, error: string | null };
}

// Assume the plugin is globally accessible or injected via dependency inversion
declare const RCDMPhaseTransitionValidatorTool: IRCDMPhaseTransitionValidator;

class GovernanceStateTracker {
    private currentState: {
        phase: string;
        ruleset: string | null;
        active_proposals: Record<string, any>;
        metrics_cache: Record<string, any>;
    };
    private rcdmValidator: IRCDMPhaseTransitionValidator;

    constructor() {
        this.currentState = {
            phase: 'initialization',
            ruleset: null,
            active_proposals: {},
            metrics_cache: {}
        };
        // Initialize the validator tool
        this.rcdmValidator = RCDMPhaseTransitionValidatorTool;
    }

    updatePhase(newPhaseId: string): boolean {
        // Delegate configuration lookup and validation to the extracted utility
        const validationResult = this.rcdmValidator.execute({
            rcdmConfig: RCDM_CONFIG,
            newPhaseId: newPhaseId
        });
        
        if (validationResult.success && validationResult.rulesetId) {
            this.currentState.phase = newPhaseId;
            this.currentState.ruleset = validationResult.rulesetId;
            console.log(`Transitioned to Phase: ${newPhaseId}. Ruleset: ${validationResult.rulesetId}`);
            return true;
        }
        
        console.error(`Failed to transition phase to '${newPhaseId}'. Error: ${validationResult.error || 'Unknown validation failure.'}`);
        return false;
    }

    recordProposalVote(proposalId: string, actorId: string, score: number) {
        // Logic to track individual actor scores and apply ruleset weighting (from RCDM) to calculate consensus.
        // If consensus is met, trigger dynamic_transition check.
    }

    checkTransitionCriteria() {
        // Checks if current metrics satisfy the required exit/dynamic criteria defined in the active RCDM phase.
    }

    getState() {
        return this.currentState;
    }
}

export default GovernanceStateTracker;