/**
 * Component Governance State Registry - src/governance/governanceStateRegistry.js
 * ID: GSR v94.1
 * Role: State Persistence / Transactional Safety
 *
 * The GSR maintains the current governance lifecycle status of all components
 * undergoing high-stakes actions (deprecation, retirement, etc.). 
 * It is critical for ensuring idempotency and sequential execution.
 */

// Placeholder in-memory store. In production, this would interface with a durable key-value store.
const componentStateMap = new Map(); 

const COMPONENT_STATUS = {
    ACTIVE: 'ACTIVE',
    PENDING_REVIEW: 'PENDING_REVIEW',
    SCHEDULED_ACTION: 'SCHEDULED_ACTION',
    RETIRED: 'RETIRED',
    BLOCKED: 'BLOCKED' // Due to external factors/veto
};

class GovernanceStateRegistry {

    /**
     * Retrieves the current status of a component.
     * @param {string} componentId
     * @returns {{status: string, actionType?: string, timestamp: number} | null}
     */
    getStatus(componentId) {
        return componentStateMap.get(componentId) || { status: COMPONENT_STATUS.ACTIVE };
    }

    /**
     * Checks if a component is retired.
     */
    isComponentRetired(componentId) {
        return this.getStatus(componentId).status === COMPONENT_STATUS.RETIRED;
    }

    /**
     * Checks if a component is currently pending a specific governance action.
     * @param {string} componentId
     * @param {string} actionType
     */
    isComponentPending(componentId, actionType) {
        const status = this.getStatus(componentId);
        return (status.status === COMPONENT_STATUS.PENDING_REVIEW || status.status === COMPONENT_STATUS.SCHEDULED_ACTION) && status.actionType === actionType;
    }

    /**
     * Registers that a component review has started (entering PENDING_REVIEW state).
     */
    registerPendingReview(componentId, actionType) {
        componentStateMap.set(componentId, {
            status: COMPONENT_STATUS.PENDING_REVIEW,
            actionType: actionType,
            timestamp: Date.now()
        });
    }

    /**
     * Clears the pending state, reverting to ACTIVE or BLOCK.
     */
    clearPendingReview(componentId, actionType) {
        const current = this.getStatus(componentId);
        if (current.status === COMPONENT_STATUS.PENDING_REVIEW && current.actionType === actionType) {
            componentStateMap.set(componentId, { status: COMPONENT_STATUS.ACTIVE, timestamp: Date.now() });
        }
    }

    /**
     * Registers a decision has passed adjudication and is SCHEDULED for execution.
     */
    registerActionScheduled(componentId, report) {
        componentStateMap.set(componentId, {
            status: COMPONENT_STATUS.SCHEDULED_ACTION,
            actionType: report.action,
            decisionReport: report, // Store full report for traceability
            timestamp: Date.now()
        });
    }

    /**
     * Updates the component status to permanently retired. (Called by Actuator post-execution)
     */
    registerRetirementFinalized(componentId) {
        componentStateMap.set(componentId, {
            status: COMPONENT_STATUS.RETIRED,
            actionType: 'RETIREMENT',
            timestamp: Date.now()
        });
    }
}

export const governanceStateRegistry = new GovernanceStateRegistry();
