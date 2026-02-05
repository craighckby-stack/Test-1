# TRUSTED EVIDENCE DATA STORE (TEDS) PROTOCOL SPECIFICATION R1.0

## MANDATE
The TEDS protocol is mandatory for all failure states triggered by the Integrity Halt (IH) or the Rollback Protocol (RRP). TEDS ensures forensic immutability for subsequent Policy Correction Analysis (PCSS).

## 1.0 TEDS DATA INGRESS REQUIREMENTS
Data must be cryptographically signed by the originating agent (CRoT/GAX) upon ingress to guarantee non-repudiation and chain of custody.

## 2.0 IMMUTABLE SNAPSHOT SCHEMA (Failure Vector $F_V$)

The TEDS record ($F_V$) must contain the following mandated elements:

1. **Root Context:**
    *   `Failure_Timestamp_UTC`: Precise time of failure detection.
    *   `SAG_Version`: V98.1 R2.0 (Self-Reference Update).
    *   `CSR_Anchor_Hash`: The baseline hash defining the configuration (2.1).

2. **Trigger Details:**
    *   `Failure_Stage`: The Lifecycle stage (e.g., S04, S11) where the failure occurred.
    *   `Trigger_Protocol`: IH or RRP.
    *   `Axiom_Violation_ID`: I, II, or III (if S11 failure).
    *   `Scalar_Flags_Set`: List of P-01 inputs set to True (e.g., PVLM=True, ADTM=False).

3. **Core Artifact Snapshot (Required for PCSS):**
    *   `TEMM_Value`: The calculated metric at the time of failure (if available).
    *   `FASV_Schema_Hash`: Hash of the mandated state manifest structure.
    *   `ASM_Partial_Snapshot`: The specific, verifiable state vector segment of the Axiomatic State Manifest related to the failure boundary.

## 3.0 IMMUTABILITY GUARANTEE
TEDS implementations must employ append-only, cryptographic chaining mechanisms (e.g., Merkle Tree indexing or equivalent distributed ledger technology) to prevent retrospective modification or deletion of $F_V$ records. CRoT provides the final commit signature for $F_V$ integrity.