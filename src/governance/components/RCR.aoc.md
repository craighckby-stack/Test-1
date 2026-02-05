## Component Specification: RCR (Rollback Commitment Registrar)

**Component ID:** RCR
**Governing Pillar:** AIA (Atomic Immutable Architecture)
**Primary Function:** Secure, auditable state reversal in response to F-01 Failure Trace mandates.
**Dependent Components:** CTG (Input Mandate), D-01 (Ledgering), AEOR (Orchestration/Authorization).

### I. RCR Operational Mandate

The RCR is the sole mechanism authorized to execute and register a state reversal payload (M-R). Its mandate ensures that any reversion to a prior committed state is treated as a new, high-priority state transition, subject to AIA cryptographic ledgering requirements.

### II. Rollback Protocol (Atomic M-R Execution)

1.  **Authorization:** RCR receives a signed, mandatory execution instruction from the CTG, following an F-01 path failure. The instruction must reference the original failing M-02 and the target roll-back state hash (H-RT).
2.  **M-R Construction:** The RCR constructs the Rollback Mutation Payload (M-R), referencing the H-RT state and logging the specific policy/risk violation that triggered the rollback.
3.  **D-01 Logging (Pre-Execution):** The RCR forces an immediate, non-negotiable log entry (D-01, type: REVERSAL_INTENT) detailing the M-R intent and CTG mandate.
4.  **State Reversal:** RCR utilizes the Rollback API (governed by AEOR) to atomically revert the system state to H-RT.
5.  **D-01 Logging (Post-Execution):** Upon verifiable reversal, the RCR logs the final M-R transaction (D-01, type: REVERSAL_SUCCESS), cryptographically sealing the rollback sequence to the immutable audit log. 

### III. Constraint Requirements

*   **Immutability:** RCR cannot destroy or modify D-01 entries; it only adds new, reversal-specific records.
*   **Velocity:** M-R transactions are prioritized above standard M-02 transactions to minimize exposure time during failure states.
*   **Attestation:** All M-R inputs must be attested (signed) by both CTG and AEOR prior to commitment.