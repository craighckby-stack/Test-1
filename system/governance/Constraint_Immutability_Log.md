# Constraint Immutability Log (CIL) V94.1

## 1. Mandate and Purpose
The CIL serves as the immutable ledger for governance-critical configurations, parameters, and constraints derived from the Schema and Configuration Registry (SCR). While the SCR maintains the *current* active state, the CIL ensures cryptographic auditability and provenance for every historical version of regulatory thresholds and mandatory schemas.

## 2. Operational Specification

### 2.1. Triggering Events
Logging to the CIL is mandatory upon any of the following state changes:
1. Update to ASDM structural schema.
2. Modification of any GSEP V94.1 protocol gateway threshold (e.g., L3 Efficacy Threshold, $\mathcal{S-01}$ target).
3. Any change to the P-01 Decisional Calculus formula or associated metrics definition (Section 3.3 in AOC).
4. A System State Transition that includes the generation of a new $\mathcal{V}_{N}$ major version lock (L5).

### 2.2. Data Structure (CIL-ENTRY)
Each entry is a cryptographically signed payload guaranteeing non-repudiation:

| Field | Description |
|:---:|:---:|
| `Constraint_ID` | Unique hash identifier for the specific rule or schema (e.g., `S01_THRESHOLD_V3`). |
| `Source_SCR_Hash` | SHA-256 hash of the full relevant SCR subset at the time of commitment. |
| `Timestamp_UTC` | Atomic clock timestamp of commitment. |
| `Integrity_Signature` | Digital signature provided by the GCO and validated by the AICV. |
| `Referenced_AIA_ID` | Reference to the corresponding AIA-ENTRY (L5) that utilized this constraint set. |

## 3. Integration with GSEP
The CIL is accessed by the GCO during the L3 (Proving) and L4 (Adjudication) steps to ensure the thresholds used for evaluation ($\mathcal{S}$-Metrics) match the officially mandated and historically traceable governance ruleset.