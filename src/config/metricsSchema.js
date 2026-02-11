/**
 * AGI Metrics Schema and Consensus Pipeline Constants (AMC)
 * Defines the required structure, enumerations, and operational parameters for the 
 * Proposal History Index (PSHI) and the overall consensus pipeline.
 * 
 * Dependencies: StructuralSchemaValidatorTool must be injected or globally available 
 * for validation functions to operate correctly.
 */

// 1. Core Enumerations (Ensuring immutability and centralized state management)
export const PROPOSAL_STATUS_ENUM = Object.freeze({
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    PENDING: 'PENDING',
    EVALUATING: 'EVALUATING',
    EXPIRED: 'EXPIRED'
});

const PROPOSAL_STATUS_VALUES = Object.values(PROPOSAL_STATUS_ENUM);

// 2. Proposal Event Schema Definition (Metadata-rich structure for validation)
// Defines expected field names, required status, and data types.
export const PROPOSAL_SCHEMA_DEFINITION = Object.freeze({
    proposal_id: { type: 'string', required: true, description: 'Unique identifier for the code change or directive.' },
    agent_id: { type: 'string', required: true, description: 'ID of the submitting agent (AGI-C-XX).' },
    validation_status: { 
        type: 'enum', 
        enum: PROPOSAL_STATUS_VALUES, 
        required: true,
        description: 'Current consensus state of the proposal.'
    },
    timestamp: { type: 'number', required: true, description: 'Creation time (Unix epoch).' },
    trust_score_impact: { type: 'number', required: false, description: 'Delta impact on agent trust model post-resolution.' }
});

// 3. Operational Configuration Constants (PSHI: Proposal/Scoring History Index)
export const PSHI_CONFIG = Object.freeze({
    MAX_HISTORY_SIZE: 5000, // Maximum events retained in temporal memory
    ATM_EMA_DECAY_FACTOR: 0.05, // Alpha value for Agent Trust Model (ATM) EMA calculation
    RECENT_SCORE_WINDOW: 50, // How many CIW scores to track for 'recent' weighting
});

// 4. Standardized Failure Tagging Taxonomy
export const FAILURE_TOPOLOGY_TAGS = Object.freeze({
    API_SCHEMA_MISALIGNMENT: 'API_Schema_Misalignment',
    RESOURCE_LEAK: 'Resource_Contention_Pattern', 
    PERFORMANCE_REGRESSION: 'Performance_Regression',
    SECURITY_FAILURE: 'Security_Protocol_Failure',
    CONTEXTUAL_DRIFT: 'Contextual_Mandate_Drift',
    TEST_INFRASTRUCTURE_FAILURE: 'Test_Infra_Failure'
});

/**
 * Validates an event object against PROPOSAL_SCHEMA_DEFINITION using the 
 * StructuralSchemaValidatorTool (must be dependency-injected or globally available).
 * 
 * @param {object} event The event object to validate.
 * @param {object} [validatorTool] Optional StructuralSchemaValidatorTool instance for injection.
 * @returns {object} Validation result { isValid: boolean, missingFields: string[], typeErrors: string[] }.
 * @throws {Error} If the required validator tool is not accessible.
 */
export function validateProposalEventSchema(event, validatorTool) {
    const tool = validatorTool || (typeof global !== 'undefined' ? (global).StructuralSchemaValidatorTool : null);

    if (!tool || typeof tool.execute !== 'function') {
        throw new Error("AGI Initialization Error: StructuralSchemaValidatorTool is required for schema validation but was not injected.");
    }
    
    return tool.execute({ data: event, schema: PROPOSAL_SCHEMA_DEFINITION });
}

// Group all primary exports for comprehensive access
export const AGI_METRICS_CONFIG = {
    PSHI_CONFIG,
    PROPOSAL_STATUS_ENUM,
    PROPOSAL_SCHEMA_DEFINITION,
    FAILURE_TOPOLOGY_TAGS,
    validateProposalEventSchema
};