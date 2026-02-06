# PROPOSAL LIFECYCLE STATE TRACKER (PLST) SPEC V2.0

**Scope:** Define the canonical state machine, mandatory artifacts, and transition constraints for a Governance Proposal, guaranteeing integrity and readiness before submission to the Governance System Execution Protocol - Control Layer (GSEP-C).

**Mandate:** All structural governance proposals must complete the state sequence (S0 -> ... -> S4_PRE_INGRESS) and achieve the 'READY_FOR_INGRESS' status flag. Emergency or time-sensitive proposals are handled via a separate fast-track override path (GSEP-C FTO/L-0).

---

## Proposal State Machine V2.0

The following are immutable states defining the proposal lifecycle. Transitions must be atomic, idempotent, and logged by the Audit Trail System. Failure states are mandatory for explicit branching logic.

| State ID | State Name | Required Transition Condition | Next Valid States | GSEP-C Phase Link |
|:---|:---|:---|:---|:---|
| S0 | DRAFTING | Initiated; Requires P-ID (Proposal Identifier) assignment and initial Schema Validation. | S1, S_REJECT | NOT APPLICABLE |
| S1 | INTERNAL_PEER_REVIEW | Mandates Required_Approvals (N>=2) and verified structural integrity based on security heuristics. | S2, S_REJECT | Internal Scrutiny |
| S2 | EXTERNAL_AUDIT_QUEUE | Successful S1 completion; Allocation of certified external auditor resource (e.g., assigned Audit_ID). | S3_IN_PROGRESS, S_REJECT | Resource Allocation |
| S3_IN_PROGRESS | EXTERNAL_AUDIT_RUNNING | Audit resource actively verifying proposal safety and operational integrity. | S3_PASS, S3_REMEDIATION |
| S3_PASS | AUDIT_PASS | External verification report (Audit_Hash) is clean and signed. Issues remediated if S3_REMEDIATION path was taken. | S4_PRE_INGRESS | Pre-Execution Artifact Signoff |
| S3_REMEDIATION | AUDIT_FAILURE | External verification identified critical safety or efficiency violations. Requires mandatory rework. | S0, S_REJECT | Rework Loop |
| S4_PRE_INGRESS | READY_FOR_INGRESS | Final checks: Target_SCI_Budget confirmed, all Mandatory Artifacts complete. Flag enabled. | S5_EXECUTION, S_REJECT | GSEP-C L0/L1 Trigger |
| S5_EXECUTION | DEPLOYED | GSEP-C L9 Final Audit Success; Result Artifact (D_Hash) persisted. | S_ARCHIVED | L9 EXIT/FINALIZED |
| S_REJECT | GENERAL_REJECT | Critical structural or security violation detected (S0-S4). Activates Resolution Protocol (RRP). | N/A | FAILED/RRP ACTIVATED |
| S_ARCHIVED | ARCHIVED | State maintained after successful S5 or definitive S_REJECT. Proposal data persisted for long-term audit. | N/A | SUCCESS/ARCHIVED |

## Mandatory Proposal Artifacts (Required for S4_PRE_INGRESS)

The PLST validation component must enforce the presence and correctness of these fields and log them in the Transition_Log.

1.  **P_ID (Proposal Identifier):** Canonical UUID assigned at S0.
2.  **Originator_ID:** Identifier of the submitting Sovereign Agent.
3.  **Required_Approvals:** Numerical count for S1 passage (Min: 2).
4.  **Audit_ID:** Identifier of the assigned external verification service (Required at S2).
5.  **Audit_Hash (External):** Cryptographic hash of the validated external audit report (Required at S3_PASS).
6.  **Target_SCI_Budget:** Fixed computational budget (SCI units) allocated for GSEP-C L3 (Execution Phase).
7.  **Transition_Log:** Immutable chronological log of all state changes, including timestamps and authorizing agent IDs.
