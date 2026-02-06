# AGENT SPECIFICATION: FORENSIC INTEGRITY AGENT (FIA)

| Key Parameter | Value |
|:---:|:---:|
| Agent ID | A-FIA-001 |
| Version | 1.0.1 (Refactored) |
| Status | Critical Core |
| Domain | Integrity & Recovery |

## 1. Core Mandate: Forensic Integrity and Deterministic Snapshotting

The Forensic Integrity Agent (FIA) maintains a singular, high-priority mandate: **Total Execution Deterministic Snapshot (TEDS) Capture and Integrity Management.** The FIA ensures the absolute immutability and verifiable isolation of all forensic capture data essential for the **Rollback Protocol (RRP)** initiation and analysis.

## 2. Isolation Principle (Segregation of Duties - SoD)

The FIA must operate in an isolated trust domain (P-05) enforced by architectural boundaries. This is non-negotiable.

1.  **Architectural Segregation:** The FIA execution environment and its target storage layer (Forensic Vault, see FVM specification) must be physically and logically isolated from standard Execution Agents (SGS, GAX) to prevent contamination or retrospective modification of evidence.
2.  **Functional Restriction:** FIA is strictly prohibited from executing P1-P4 standard workflow logic (e.g., Decision Space Evolution - DSE). Its functions are limited exclusively to real-time integrity assurance, cryptographic signing, and data archiving.

## 3. Operational Trigger: Rollback Protocol (RRP) Activation

The FIA monitors system telemetry for indicators of structural failure (RRP Activation Signal).

1.  **Trigger Sources:** Detected failure flags originating primarily from the GAX layer: PVLM (Policy Violation Logic Mask), MPAM (Mission Parameter Anomaly Mask), ADTM (Adversarial Threat Model), or direct P-01 Denial/Failure state.
2.  **Action Sequence:** Upon receiving an RRP trigger, the FIA executes a mandatory, immediate State Lock. The TEDS sequence is then initiated to capture and sign the exact system state at the moment of failure.

## 4. Data Contracts and Artifact Management

The FIA is responsible for producing two critical, integrity-verified artifacts, archived in the Forensic Vault Module (FVM):

| Artifact ID | Name | Description | Output Consumer | Integrity Requirement |
|:---:|:---|:---|:---:|:---:|
| **TEDS** | Total Execution Deterministic Snapshot | A complete, cryptographically signed, immutable record of the system state prior to the failure lock. | GAX (RRP Analysis Module) | Immutability (Requirement 5.0). Signed by CRoT. |
| **PCSS** | Policy Correction Statistical Source | Filtered statistical data derived exclusively from the verified TEDS for policy adjustment. | GAX (Policy Adaptation Module) | Verified traceability; Auditable Linkage to source TEDS hash. |

## 5. Trust Anchor

The **Chain of Root Trust (CRoT)** serves as the final, external trust anchor responsible for cryptographically signing the TEDS archive, guaranteeing compliance with all isolation and immutability standards set forth in this specification.