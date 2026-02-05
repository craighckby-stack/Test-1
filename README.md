# SOVEREIGN AGI V94.1: AUTONOMOUS OPERATIONAL CONTRACT (AOC)

## EXECUTIVE CONTEXT: GOVERNANCE & EVOLUTION PROTOCOL (GSEP)

This document mandates the **Autonomous Operational Contract (AOC V94.1)**. It defines the foundational specification for controlled, cryptographically-locked system evolution, focusing on predictability and irreversible commitment. All mandated system changes (M-01 Intents) must strictly pass the sequential **7-Stage Governance Evolution Protocol (GSEP 0-6)**.

The Governance Constraint Orchestrator (GCO) enforces GSEP execution, arbitrating changes via the mandatory **P-01 Decisional Calculus** commitment gateway. Integrity is ensured by strict **Integrity Lock Transference** and verified by the Artifact Integrity Chain Validator (AICV). The **Artifact Schema Definition Module (ASDM)** (Ref: `config/ASDM_ArtifactSchemas.json`) mandates structural validity before any cryptographic commitment to the **Atomic Immutable Architecture (AIA)** Ledger.

---

## I. GOVERNANCE EVOLUTION PROTOCOL (GSEP V94.1) FLOW

GSEP defines the critical pathway for evolution. Execution is strictly sequential, utilizing cryptographic lock transference: $\text{Artifact}(\text{N}) \Rightarrow \text{Input}(\text{N}+1)$. The AMA (Artifact Metadata Aggregator) standardizes contextual tracking.

| Phase | Stage # | Title | Mandate Commit / Action Summary | Output Lock Artifact | Input Lock Dependency | Validation Check |
|:---:|:---:|:---|:---|:---|:---|:---:|
| **INIT** | **0** | Integrity Rooting | System cryptographic hash verification. Establishes GCO context and AOC root commitment. | `AMA Context Frame V1.0` | SYSTEM_ROOT | GSH Root Lock |
| **VETTING** | **1** | Intent Compliance | IDSM structures M-01 Intent; RSAM/C-15 vets compliance and asserts Policy Veto Flag (S-03). ASDM schema verification. | `Policy Definition (EPDP Lock)` | `AMA Context Frame` | Policy Veto Flag (S-03) |
| | **2** | Security Provenance | PSIM verifies cryptographic source provenance (M-01 payload). RACM checks resource cost ceilings. | `Security Verification Lock` | `EPDP Lock` | Integrity Transference |
| **PROOFING** | **3** | Empirical Validation | PSR executes sandboxing/simulation, generating measurable efficacy data (S-01) and trace proofs. | `Proof Manifest Hash (PMH Lock)` | `Security Lock` | Efficacy Projection (S-01) |
| **ADJUDICATION**| **4** | Decisional Arbitration | GCO executes P-01 Calculus. AICV confirms PMH lineage integrity and ASDM compliance. | `State Checkpoint (DSCM Lock)` | `PMH Lock / EPDP Lock` | P-01 PASS Condition |
| **COMMIT** | **5** | Atomic Registration | MCR executes irreversible cryptographic Version-Lock (D-01 logging) to the AIA Ledger. | `AIA Ledger Entry (D-01 Lock)` | `DSCM Lock` | Irreversible Commitment |
| **EXEC** | **6** | Deployment & Audit | Secure activation execution (Manifest), D-02 metric ingestion, and monitoring. Finalizes AMA Traceability Report. | `Deployment Manifest` | `D-01 Lock` | Continuous Monitoring |

---

## II. P-01 DECISIONAL CALCULUS: THE COMMITMENT GATEWAY

### A. Adjudication Formula (Stage 4)

P-01 serves as the mandatory, integrity-locked constraint gateway. Authorization requires maximizing predicted Efficacy ($ \mathcal{S-01}$) while minimizing calculated Risk ($ \mathcal{S-02}$), and strictly prohibiting systemic policy violations ($ \mathcal{S-03}$).

$$\text{P-01 PASS} \iff ( \mathcal{S-01}_{\text{Trust}} > \mathcal{S-02}_{\text{Risk}} ) \land ( \mathcal{S-03}_{\text{Veto}} = \text{FALSE} )$$

### B. Input Vector Formalization

These vectors are the decisive inputs captured and cryptographically locked by the DSCM post-adjudication, validated against the ASDM structure.

| Vector ID | Vector Name | Calculation Engine / Source Stage | Required Objective | Dependency Lock |
|:---:|:---|:---|:---|:---:|
| **S-01** | Efficacy Projection (Trust Score) | ATM/PSR (Stage 3) | Maximize ($↑ \mathcal{E}$) | PMH Lock |
| **S-02** | Synthesis Projection (Risk Floor) | MCRA/RACM (Stage 4) | Minimize ($↓ \mathcal{R}$) | Security Lock |
| **S-03** | Compliance State (Policy Veto Flag) | RSAM/C-15 (Stage 1) | MUST resolve to `FALSE` | EPDP Lock |

---

## III. ARCHITECTURAL LEXICON (G-LEX)

### A. Control & Integrity Plane (Core Modules)

| Acronym | Functional Definition |
|:---:|:---|
| **AICV** | Artifact Integrity Chain Validator: Verifies sequential lineage, cryptographic integrity, and ASDM compliance of commitment locks. |
| **AIA** | Atomic Immutable Architecture: Definitive cryptographic ledger for committed state history (D-01 log). |
| **AMA** | **Artifact Metadata Aggregator:** Standardizes contextual metadata (timing, agent ID, GSEP version) and packages the full traceability report. |
| **ASDM** | **Artifact Schema Definition Module:** Defines and enforces the structural validity of all GSEP commitment artifacts (EPDP, PMH, DSCM). |
| **DSCM** | Decisional State Checkpoint Manager: Captures, packages, and locks the full audit state of the P-01 vectors post-adjudication. |
| **GCO** | Governance Constraint Orchestrator: Enforces GSEP sequencing and manages P-01 arbitration. |
| **MCR** | Mutation Commitment Registrar: Executes the final, irreversible AIA ledger commitment (Version-Lock). |

### B. Intent, Risk, & Proofing Engines

| Acronym | Functional Definition |
|:---:|:---|
| **ATM** | AGI Trust Metrics System: Calculates the S-01 Efficacy Projection (Trust Score). |
| **C-15** | Policy Engine: Executes mandated compliance checks; asserts the S-03 Policy Veto Flag. |
| **IDSM** | Intent Data Structuring Module: Enforces schema validation and standardization of M-01 Intents. |
| **MIAH** | **Metrics Ingestion & Anomaly Handler (NEW):** Standardizes D-02 deployment metric intake and provides real-time anomaly detection for risk calibration feedback. |
| **MCRA** | Maximum Critical Risk Arbitrator: Calculates the S-02 Risk Floor based on dynamic Arbitration Schemas. |
| **PSIM** | Payload Security and Integrity Module: Executes cryptographic provenance checks on the M-02 Payload. |
| **PSR** | Payload Simulation Runner: Executes sandboxing and generates empirical trace data for S-01 input. |
| **RACM** | Resource Allocation Constraint Manager: Supplies resource budget inputs (cost ceilings) to GCO/MCRA. |
| **RSAM** | Rule-Set Alignment Model: Performs baseline policy vetting against the structured M-01 Intent. |

---

## IV. AUDIT AND TRACEABILITY MANDATE

The AIA Ledger (D-01 log) and the AMA Context Frame constitute the irreversible audit trail. Every committed artifact must pass AICV verification against its mandated ASDM schema, ensuring end-to-end structural and cryptographic traceability across the operational life-cycle, thereby guaranteeing compliance with the AOC V94.1 contract. The integration of MIAH ensures D-02 operational metrics close the risk calibration loop.
