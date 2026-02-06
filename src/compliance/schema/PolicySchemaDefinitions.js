import path from 'path';

export const DEFAULT_GOVERNANCE_SCHEMA_PATH = path.resolve('config/governanceSchema.json');

export const AJV_CONFIGURATION = {
    allErrors: true, // Report all structural discrepancies
    strict: true,    // Enforce stricter JSON schema rules
    // Future: Add caching or custom formats here if performance demands increase.
};

/**
 * Defines a minimal, operational schema to ensure system continuity if the primary configuration
 * file is missing or inaccessible during initialization.
 */
export const MINIMAL_FALLBACK_SCHEMA = {
    $id: "https://v94.1/schemas/minimal-compliance.json",
    type: "object",
    properties: {
        compliance_level: { type: "string", pattern: "^L[0-9]+$", description: "The mandated compliance severity level (e.g., L3)." },
        veto_triggers: {
            type: "array",
            items: { type: "string" },
            description: "List of system events or states that trigger an automatic veto or halt."
        }
    },
    required: ["compliance_level", "veto_triggers"],
    additionalProperties: false // Ensures strict adherence
};