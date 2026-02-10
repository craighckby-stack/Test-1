/**
 * src/config/governanceInvariants.ts
 *
 * Configuration file for Governance Invariants (M-02, P-01).
 * Defines structural compliance rules, invariant limits, and associated penalties.
 *
 * This configuration is rigorously validated upon loading using the GovernanceConfigSchemaValidator tool.
 */

interface GovernanceInvariantRule {
    failureMessage: string;
    penaltyWeight: number; // Must be between 0.0 and 1.0, defines R_INDEX reduction upon failure
}

interface GovernanceInvariants {
    MAX_MUTATION_SIZE_KB: number; // Maximum payload size in KB
    MAX_DEPENDENCY_INJECTIONS: number; // Limit on new external dependencies
    REQUIRED_TEST_COVERAGE_SIGNAL: number; // Minimum static coverage signal (0.0 to 1.0)
}

interface GovernanceThresholds {
    pass: number; // M-02 R_INDEX minimum required to proceed (0.0 to 1.0)
}

interface GovernanceConfig {
    invariants: GovernanceInvariants;
    rules: { [key: string]: GovernanceInvariantRule };
    thresholds: GovernanceThresholds;
}

const config: GovernanceConfig = {
    // Defines system-wide invariant limits that mutations must adhere to.
    invariants: {
        MAX_MUTATION_SIZE_KB: 128, // Hard limit on proposed code size (low-latency check)
        MAX_DEPENDENCY_INJECTIONS: 5, // Limit on new external dependencies proposed
        REQUIRED_TEST_COVERAGE_SIGNAL: 0.15 // Minimum static signal required (not full execution)
    },

    // Defines the compliance checks, failure messages, and R_INDEX penalty weights.
    rules: {
        'DEPENDENCY_INTEGRITY': {
            failureMessage: "Failed dependency resolution or module integrity check.",
            penaltyWeight: 0.35
        },
        'RESOURCE_LIMITS': {
            failureMessage: "Exceeded system resource invariants (e.g., size or injection limits).",
            penaltyWeight: 0.40
        },
        'GHM_SIGNAL': {
            failureMessage: "Missing or invalid GHM Operational Readiness Signal (GRS) linkage.",
            penaltyWeight: 0.10
        },
        'SCHEMA_VALIDITY': {
            failureMessage: "Mutation payload failed configuration schema validation.",
            penaltyWeight: 0.20
        }
    },

    // Defines overall pass/fail thresholds for M-02 and subsequent stages.
    thresholds: {
        pass: 0.70 // M-02 R_INDEX minimum required to proceed to Trust Calculus (P-01)
    }
};

module.exports = config;
