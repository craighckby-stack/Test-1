# PROPOSAL LIFECYCLE STATE TRACKER (PLST) SPEC V1.0

**Purpose:** Define the mandated state machine and transition constraints for a Governance Proposal before it is eligible for entry into the GSEP-C PRE (Proposal Ingress) layer.

**Mandate:** All governance proposals (excluding emergent/crisis proposals) must pass the state sequence and receive the 'READY_FOR_INGRESS' flag prior to execution request.

---

## Proposal State Machine

The following are immutable states defining the proposal lifecycle:

| State ID | Description | Required Transition Condition | GSEP-C Status |
|:---|:---|:---|:---|
| S0 | DRAFTING | Initiated by Sovereign Agent, requires P-ID assignment. | NOT APPLICABLE |
| S1 | INTERNAL_REVIEW | Requires 2+ peer-agent approvals; structural review complete. | NOT APPLICABLE |
| S2 | EXTERNAL_AUDIT_QUEUE | Assigned external verification contract (e.g., Llama Guard, Certora). | NOT APPLICABLE |
| S3 | AUDIT_PASS | External audit results are clean or issues remediated. | NOT APPLICABLE |
| S4 | READY_FOR_INGRESS | Final State. Mandatory trigger for GSEP-C PRE Layer execution attempt. | PRE/L0 Execution Pending |
| S5 | DEPLOYED | GSEP-C L9 Audit Success and ITR persisted. | L9 EXIT/FINAL |
| SF | FAILED_PRE_INGRESS | Violation detected in S1-S3, or GSEP-C Halt condition triggered. | FAILED/RRP ACTIVATED |

## Mandatory Metadata Fields

The PLST must track and validate these required fields before S4 transition:

1.  **Originator_ID:** Identifier of the submitting agent/source.
2.  **Required_Approvals:** Count of internal agents required for S1 transition (Min: 2).
3.  **Audit_Hash:** Checksum hash of the official external audit report (Required for S3).
4.  **Target_SCI_Budget:** Estimated SCI expenditure for L3 (Required for S4).