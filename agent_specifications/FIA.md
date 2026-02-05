# FORENSIC INTEGRITY AGENT (FIA) SPECIFICATION

## FIA Mandate: TEDS Capture and Integrity Management

The FIA operates with a singular, non-overlapping mandate: to ensure the integrity, immutability, and isolation of all forensic capture data necessary for the **Rollback Protocol (RRP)**. The FIA must be architecturally isolated from Agents involved in standard P1-P4 execution (SGS, GAX) to prevent contamination or manipulation of forensic evidence.

## Integration Points

### 1. RRP Triggered State (S02 - S11 Failure)

Upon activation of the RRP (detected by GAX failure flags PVLM, MPAM, ADTM, or P-01 denial), the FIA immediately initiates the Total Execution Deterministic Snapshot (TEDS) sequence. The FIA temporarily locks the execution state to ensure a verifiable snapshot.

### 2. Critical Output Artifacts

| Artifact | Role | Consumption Agent | Integrity Requirement |
|:---:|:---|:---:|:---:|
| **TEDS** | Total Execution Deterministic Snapshot. Immutable, cryptographically signed record of system state prior to failure. | GAX (During RRP Analysis) | Immutability (Requirement 5.0) |
| **PCSS** | Policy Correction Statistical Source. Analytical output derived from TEDS for policy adjustment by GAX. | GAX | Auditable Linkage to TEDS |

## SoD Enforcement

FIA is prohibited from executing P1-P4 workflow logic (DSE) and is restricted to forensic capture and immutability management only. CRoT serves as the final trust anchor for the FIA's cryptographic signing of the TEDS archive.