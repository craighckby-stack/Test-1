import { validateProposalEventSchema, PROPOSAL_STATUS_ENUM } from '../../config/metricsSchema.js';
import { EventFactoryGenerator } from 'plugins';

/**
 * Factory class responsible for creating and validating immutable Proposal Event objects.
 * Ensures 100% adherence to metricsSchema before injection into the PSHI or consensus queue.
 *
 * This factory is generated using the EventFactoryGenerator utility, coupling the specific
 * schema validator with the generic finalization pipeline.
 */
export const ProposalEventFactory = EventFactoryGenerator.createFactory({
    validatorFunction: validateProposalEventSchema,
    defaultStatus: PROPOSAL_STATUS_ENUM.PENDING
});
