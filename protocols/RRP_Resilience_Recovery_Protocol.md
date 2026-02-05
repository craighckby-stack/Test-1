# RESILIENCE & RECOVERY PROTOCOL (RRP) V1.0

## 0.0 Mandate and Scope

The RRP is mandated by SGS V94.4 (Section 3.2) and is triggered upon any `CRITICAL` GSEP-C stage failure (S2, S3, S4, S4.5, S6, S6.5, S6.7, S8).

Its primary function is to achieve an attested, predictable, and safe state rollback, enabling GAX/SGS triage and subsequent re-attempt or shutdown.

## 1.0 RRP Triage Hierarchy (CRITICAL Failure)

Upon $V_{Critical\ Trigger}$, the following sequence must be executed:

1. **Attestation Capture:** All runtime metrics and environment snapshots leading up to the failure point must be immutably recorded.
2. **VRRM Persistence (GAX):** The error payload, context (ECVM/GICM), and stage variables are immediately logged to the Veto/Rollback/Recovery Manifest (VRRM).
3. **Rollback Certification (CRoT):** CRoT must cryptographically attest the integrity of the rollback target state (typically $\Psi_{N}$ or $\Psi_{Stage-1}$).
4. **Recovery Attempt:** SGS initiates a triage based on GAX constraints (VRRM analysis) to determine if a pipeline re-entry (reprocessing) or systemic soft-halt is required.

## 2.0 VRRM Structure Specification

The VRRM is a non-repudiable ledger entry detailing CRITICAL failure context.

| Field | Type | Mandate |
|:---|:---|:---|
| `timestamp` | UTC | Time of Veto/Failure trigger. |
| `gsep_stage` | S[0-11] | Failing pipeline stage. |
| `veto_agent` | GAX/CRoT | Agent asserting the veto. |
| `veto_artifact` | Acronym | Artifact triggering the veto (PVLM, MPAM, ADTM). |
| `error_hash` | SHA256 | Immutable hash of the detailed error traceback. |
| `rollback_target` | $\Psi_{N}$/Stage ID | The attested safe state targeted for recovery. |
| `is_resolved` | Boolean | Final flag set upon successful re-entry/shutdown. |