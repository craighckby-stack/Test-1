/**
 * AGI Metrics Schema and Consensus Constants (MCS)
 * Defines the required structure and operational parameters for Proposal History Index (PSHI) 
 * and the overall consensus pipeline.
 */

// --- Standardized Data Requirements ---
export const REQUIRED_PROPOSAL_FIELDS = [
    'proposal_id',
    'agent_id',
    'validation_status' // e.g., 'ACCEPTED', 'REJECTED', 'PENDING'
];

export const PSHI_CONFIG = {
    MAX_HISTORY_SIZE: 5000, // Maximum events retained in temporal memory
    ATM_EMA_DECAY_FACTOR: 0.05, // Alpha value for Agent Trust Model EMA calculation
    RECENT_SCORE_WINDOW: 50, // How many CIW scores to track for 'recent' weighting
};

// --- Standardized Failure Tagging Taxonomy ---
// Tags must be consistent across Validation Agents (AGI-C-14 output validation)
export const FAILURE_TOPOLOGY_TAGS = {
    API_MISALIGNMENT: 'API_Schema_Misalignment',
    MEMORY_LEAK: 'Memory_Leak_Pattern',
    PERFORMANCE_DEGRADATION: 'Performance_Regression',
    SECURITY_VIOLATION: 'Security_Protocol_Failure',
    CONTEXT_DEVIATION: 'Contextual_Mandate_Drift'
};

/**
 * Validates incoming event against the consensus standard.
 * @param {object} event
 * @returns {boolean}
 */
export function validateProposalEventSchema(event) {
    return REQUIRED_PROPOSAL_FIELDS.every(field => event && event[field] !== undefined);
}
