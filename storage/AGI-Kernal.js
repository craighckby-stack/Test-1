/** AGI-KERNAL RECOVERY v6.9.7 **/
source",
  "files": [
    {
      "filename": "package.json",
      "content": "{
  "name": "agi-kernel-governance",
  "version": "1.0.0",
  "description": "AGI Kernel Governance and Audit Normalization Engine.",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build-client": "cd client && npm install && npm run build"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}"
    },
    {
      "filename": "src/GSEP_Config/ConfigLoader.js",
      "content": "/**
 * src/GSEP_Config/ConfigLoader.js
 * Mock utility to load governance configuration files.
 */
function loadConfig(configName) {
    // Mock implementation based on expected GPC structure
    if (configName === 'GPC') {
        return {
            protocol_evolution_control: {
                risk_tolerance: "MODERATE", // Policy setting: HIGH, MODERATE, LOW
                target_efficiency_gain_min: 0.15 // Minimum required predicted gain (15%)
            }
        };
    }
    throw new Error(`Configuration file ${configName} not found.`);
}

module.exports = { loadConfig };"
    },
    {
      "filename": "src/governance/AuditDataNormalizer.js",
      "content": "/**
 * src/governance/AuditDataNormalizer.js
 * Converts raw telemetry data into standardized governance metrics.
 * Required for server.js functionality.
 */
class AuditDataNormalizer {
    normalize(actorId, rawTelemetry) {
        // Example normalization logic
        const complianceRatio = rawTelemetry.complianceChecksFailed / rawTelemetry.complianceChecksRun;
        // Assume 500ms is the target max latency for scoring
        const latencyScore = 1 - (rawTelemetry.p95LatencyMs / 500); 

        return {
            efficiencyScore: Math.max(0, latencyScore),
            complianceScore: 1 - complianceRatio,
            violationCount: rawTelemetry.seriousViolations
        };
    }
}

module.exports = AuditDataNormalizer;"
    },
    {
      "filename": "src/governance/GovernanceSchemaDefs.js",
      "content": "/**
 * src/governance/GovernanceSchemaDefs.js
 * Defines constants, AJV configuration, and reusable JSON schema fragments 
 * for core AGI Kernel governance and compliance verification.
 */

// --- Configuration Constants ---

/**
 * Default location identifier for the primary governance schema file.
 * NOTE: Actual path resolution (e.g., using path.resolve) should occur in the loader utility.
 */
const GOVERNANCE_SCHEMA_IDENTIFIER = 'config/governanceSchema.json';

/**
 * Base configuration parameters for the AJV validator instance.
 * Enables strict structural enforcement essential for compliance verification.
 */
const AJV_CONFIG_STRICT = {
    // Report all structural discrepancies rather than failing fast on the first error.
    allErrors: true,
    // Enforce stricter JSON schema rules (e.g., prohibiting unknown format usages).
    strict: true,
    // Allows AJV to cast data types to match schema types (e.g., "5" -> 5)
    coerceTypes: true,
    // Enable validation for standard formats (e.g., email, uuid, date-time)
    formats: true,
};

// --- Reusable Schema Fragments (Definitions) ---

/**
 * Standard reusable definitions ($defs) for common compliance properties,
 * promoting consistency across larger governance schemas.
 */
const COMMON_SCHEMA_DEFS = {
    SeverityLevel: {
        type: "string",
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL", "DEBUG"], 
        description: "Standardized operational severity level indicating impact or urgency."
    },
    VetoTriggerSource: {
        type: "string",
        enum: ["POLICY_BREACH", "RESOURCE_EXHAUSTION", "SECURITY_EVENT", "MANUAL_OVERRIDE", "ANOMALY_DETECTION", "INIT_FAILURE"], 
        description: "The originating cause for a veto action, leading to system halt."
    },
    EntityIdentifier: {
        type: "string",
        format: "uuid", // Assumes standard UUID structure for traceability
        description: "A unique identifier for a monitored entity or resource."
    }
};

// --- Fallback Schema Definition ---

/**
 * Defines a minimal, operational schema ensuring system continuity
 * if the primary configuration file is missing or inaccessible during initialization.
 * Utilizes common definitions for internal standardization.
 */
const MINIMAL_FALLBACK_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://v94.1/schemas/minimal-compliance.json",
    $defs: COMMON_SCHEMA_DEFS,
    type: "object",
    description: "Minimal necessary compliance structure required for core operational continuity.",
    properties: {
        system_uuid: { $ref: "#/$defs/EntityIdentifier" },
        compliance_level_mandate: {
            $ref: "#/$defs/SeverityLevel",
            description: "The mandated baseline operational severity required (e.g., HIGH)."
        },
        veto_triggers: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    source: { $ref: "#/$defs/VetoTriggerSource" },
                    description: { type: "string", minLength: 10, pattern: "^[A-Z].*" } // Enforcing structure
                },
                required: ["source", "description"], 
                additionalProperties: false
            },
            minItems: 0, 
            description: "List of system events or states that trigger an automatic veto or halt, indexed by source type."
        }
    },
    required: ["compliance_level_mandate", "veto_triggers"],
    additionalProperties: false
};

module.exports = {
    GOVERNANCE_SCHEMA_IDENTIFIER,
    AJV_CONFIG_STRICT,
    COMMON_SCHEMA_DEFS,
    MINIMAL_FALLBACK_SCHEMA
};