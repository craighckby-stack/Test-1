# SOVEREIGN AGI V94.1: CORE GOVERNANCE PROTOCOL (AOC V94.1)

This document formalizes the **Autonomous Operational Contract (AOC V94.1)**, serving as the system's integrity-locked governance specification. All evolutionary mandates (M-01 Intents) must pass through the sequential **7-Stage Evolution Protocol (GSEP)**, ensuring atomic commitment to the **Atomic Immutable Architecture (AIA)** Ledger.

The Governance Constraint Orchestrator (GCO) enforces GSEP, culminating in the non-negotiable **P-01 Decisional Calculus** commitment gateway.

---

## I. THE COMMITMENT GATEWAY: P-01 DECISIONAL CALCULUS

The P-01 Calculus is the cryptographic constraint required for irreversible architecture modification. Authorization (GSEP Stage 5) is only granted if the predicted operational efficacy (S-01) strictly exceeds the risk floor (S-02) and no systemic policy violations (S-03) are present.

### P-01 Commitment Constraint (Stage 4 Adjudication)

The system commits only if the Trust Score strictly exceeds the Risk Floor AND zero policy violations are asserted.

```math
\text{P-01 PASS} \iff ( \text{S-01}_{\text{Trust}} > \text{S-02}_{\text{Risk}} ) \land ( \text{S-03}_{\text{Veto}} = \text{FALSE} )
```

### P-01 Vector Definitions & Dependencies

| Vector ID | Title | Derivation Stage | Integrity Constraint |
|:---:|:---|:---|:---|
| **S-01** | Efficacy Projection (Trust Score) | Stage 3 (PSR/ATM) | $\text{S-01} > \text{S-02}$ |
| **S-02** | Synthesis Projection (Risk Floor) | Stage 4 (MCRA/ECR/RACM) | Calculated Floor Defined |
| **S-03** | Compliance State (Policy Veto Flag) | Stage 1 (RSAM/C-15) | Must resolve to `FALSE` |

---

## II. GOVERNANCE EVOLUTION PROTOCOL (GSEP V94.1)

GSEP V94.1 defines the integrity pathway from an M-01 Intent to irreversible AIA Commitment. Execution is strictly sequential, mandated by the GCO. Dependencies are defined by the required inputs from prior stages.

| Stage # | Title | Core Mandate / Action Summary | Inputs Required | Primary Artifact (Output Lock) |
|:---:|:---|:---|:---|:---|
| **0** | Initialization | Verify AOC Source Hash (GSH) and bootstrap Governance Architecture integrity. | - | GSH Lock |
| **1** | Intent Vetting | Attest M-01 Intent against RSAM policies and generate the S-03 Policy Veto Flag. | M-01 Intent | Policy Definition (EPDP Artifact), S-03 |
| **2** | Payload Security | Verify cryptographic provenance (PSIM) and confirm RACM resource allocation validation. | S-03 (Veto Check) | Security Verification (PSIM Lock) |
| **3** | Empirical Proofing | Execute non-production Payload Simulation (PSR) to generate S-01 data and trace proofs. | PSIM Lock | Proof Manifest Hash (PMH Lock), S-01 |
| **4** | Decisional Adjudication | GCO executes P-01 Calculus, utilizing S-01, S-03, ECR/RACM inputs to calculate S-02. Locks all P-01 Vectors. | S-01, S-03, MCRA Schema Data | State Checkpoint (DSCM Lock) |
| **5** | Atomic Commitment | MCR executes irreversible cryptographic Version-Lock and D-01 logging to the AIA Ledger. | DSCM Lock (P-01 PASS) | AIA Ledger Entry (D-01 Log) |
| **6** | Activation & Audit | Secure deployment, continuous D-02 monitoring, and PDFS operational metrics collection. | D-01 Log | Deployment Manifest |

---

## III. ARCHITECTURAL LEXICON (G-LEX)

| Acronym | Functional Definition | Stage Context |
|:---|:---|:---|
| **AIA** | Atomic Immutable Architecture | Definitive cryptographic ledger of committed state history. (Stage 5) |
| **ATM** | AGI Trust Metrics System | Calculates the S-01 Efficacy Projection (Trust Score). (Stage 3) |
| **C-15** | Policy Engine | Executes compliance checks; asserts the S-03 Policy Veto Flag. (Stage 1) |
| **DSCM** | Decisional State Checkpoint Manager | Captures and locks the audit state of the P-01 vectors post-adjudication. (Stage 4) |
| **ECR** | Environmental Constraint Registrar | Provides real-time capacity and environment constraints for S-02 calculation. (Stage 4) |
| **GCO** | Governance Constraint Orchestrator | Enforces sequential GSEP execution; arbitrates P-01 decisional flow. (All) |
| **MCRA** | Maximum Critical Risk Arbitrator | Calculates the S-02 Risk Floor based on dynamic constraints. **(Guided by Arbitration Schema)** (Stage 4) |
| **MCR** | Mutation Commitment Registrar | Executes the final, irreversible AIA ledger commitment. (Stage 5) |
| **PDFS** | Post-Deployment Feedback System | Structures operational data for S-01 refinement and training loops. (Stage 6) |
| **PSIM** | Payload Security and Integrity Module | Executes cryptographic provenance checks on the M-02 Payload. (Stage 2) |
| **PSR** | Payload Simulation Runner | Executes sandboxing and generates empirical trace data (input for S-01). (Stage 3) |
| **RACM** | Resource Allocation Constraint Manager | Provides resource budget inputs (cost ceilings) to MCRA/GCO. (Stage 2, 4) |
| **RSAM** | Rule-Set Alignment Model | Performs baseline policy vetting against the M-01 Intent. (Stage 1) |