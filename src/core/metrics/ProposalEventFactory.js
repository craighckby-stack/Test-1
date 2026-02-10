import { validateProposalEventSchema, PROPOSAL_STATUS_ENUM } from '../../config/metricsSchema.js';
import { EventObjectFinalizerUtility } from 'plugins';

/**
 * Factory class responsible for creating and validating immutable Proposal Event objects.
 * Ensures 100% adherence to metricsSchema before injection into the PSHI or consensus queue.
 */
export class ProposalEventFactory {
    
    /**
     * Creates a new, validated, and frozen Proposal Event.
     * @param {object} rawEventData - The raw data payload from an Agent submission.
     * @returns {object} A validated and frozen Proposal Event object.
     * @throws {Error} If validation fails (missing required fields or type errors).
     */
    static create(rawEventData) {
        
        // 1. Initial validation using the schema utility
        const validationResult = validateProposalEventSchema(rawEventData);

        // 2. Delegate error handling, default assignment (timestamp, status), and freezing
        // to the specialized utility.
        return EventObjectFinalizerUtility.execute({
            rawData: rawEventData,
            validationResult: validationResult,
            defaultStatus: PROPOSAL_STATUS_ENUM.PENDING
        });
    }
}