/**
 * Defines strong types used across the GRCS Verification component suite.
 * This optimization establishes canonical, immutable constant definitions for
 * all core enumerations (Liability Units, Audit Steps), ensuring structural
 * integrity and type consistency across the kernel's governance components.
 */

// --- Canonical Constants for Structural Integrity ---

export const LIABILITY_UNITS = Object.freeze({
    USD: 'USD',
    EUR: 'EUR',
    PPR: 'PPR', // Probability Percent (Failure Probability)
    UNKNOWN: 'Unknown',
} as const);

export const VERIFICATION_AUDIT_STEPS = Object.freeze({
    CROT_SIGNATURE: 'CRoT_Signature',
    POLICY_ADHERENCE: 'Policy_Adherence',
    RISK_THRESHOLD: 'Risk_Threshold',
} as const);

// --- Reusable Risk Definition Types ---

export type LiabilityUnit = typeof LIABILITY_UNITS[keyof typeof LIABILITY_UNITS];

export interface FailureProfile {
    S02_Value: number; // Current calculated risk value (e.g., projected monetary liability or failure probability).
    S02_Tolerance: number; // The maximum tolerance limit derived from the active policy definition (must be >= S02_Value).
    LiabilityUnit: LiabilityUnit; // Unit of liability.
}

// --- GRCS Specific Types ---

export interface CertifiedUtilityMetrics {
    MetricsSetID: string;
    CRoT_Signature: string; // Cryptographic Root of Trust Signature
    S01_Telemetry: string; // Core immutable telemetry used for hashing
}

export interface GRCSReport {
    ReportID: string;
    Timestamp: string;
    PolicyReference: string;
    CertifiedUtilityMetrics: CertifiedUtilityMetrics;
    EstimatedFailureProfile: FailureProfile;
    SourceEntityID: string;
}

export type VerificationAuditStep = typeof VERIFICATION_AUDIT_STEPS[keyof typeof VERIFICATION_AUDIT_STEPS];

export interface VerificationAuditEntry {
    step: VerificationAuditStep;
    success: boolean;
    reason: string;
    details?: string;
}

export interface VerificationResult {
    passed: boolean;
    auditTrail: VerificationAuditEntry[];
}

export interface VerifierConfiguration {
    standardRiskCeiling: number; // The system-mandated global maximum risk tolerance for standard operations (in LiabilityUnit).
}