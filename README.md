# SOVEREIGN AGI V98.1: AUTONOMOUS OPERATIONAL CONTRACT (AOC) GOVERNANCE STANDARD

This document defines the **Autonomous Operational Contract (AOC V98.1)**, establishing the immutable governance structure and operational mandate for constrained, systemic evolution. All irreversible state transitions (**M-02 Mutation Payloads**) are strictly governed by the **Governance Constraint Orchestrator (GCO)** and committed via the **Atomic Immutable Architecture (AIA)**.

---

## I. CORE GOVERNANCE STRUCTURE & LEXICON

Systemic integrity relies on the AOC Triad pillars, core artifacts, and the mandated failure procedure.

### A. The AOC Triad: Irreversible Commitment Enforcement

The AOC Triad enforces Irreversible Commitment. All Evolution Policy Decision Point (EPDP) checks must pass simultaneously under the auspices of these three pillars for an M-02 payload to proceed.

| Acronym | Pillar Role | Enforcement Mandate | Primary Gating Mechanisms |
|:---|:---|:---|:---|
| **AIA** | State Immutability | Verifiable cryptographic ledgering (D-01) and state locks. | MCR, RCR, DSCM |
| **GSEP** | Workflow & Flow Control | Ensures sequential integrity across the 7-phase mutation lifecycle. | GCO, EPDP A & B |
| **P-01** | Decisional Adjudication | Policy and metrics logic: Trust ($	ext{S-01}$) must strictly exceed Risk ($	ext{S-02}$). | EPDP C (Irreversible Gate) |

### B. Operational Artifacts & References (M-Series)

| ID | Artifact/Reference | Definition | Role in GSEP Stages |
|:---|:---|:---|:---|
| **M-01** | Mutation Intent | The high-level proposal detailing the intended operational change. | Input (Stage 1) |
| **M-02** | Mutation Payload | The finalized, executable code and configuration changes. | Commitment Subject (Stages 2-6) |
| **GSH** | Governance Source Hash | Cryptographic hash of the active governance policy (`governance_rules_standard.json`). | Stage 0 (Integrity Lock) |
| **EPDP** | Evolution Policy Decision Point | Critical check gate requiring conditional pass for workflow progression (A, B, C). | Stages 1, 3, 4 |
| **F-01 Path**| Failure Trace Protocol | Mandated state trace, rollback, and logging procedure invoked post-EPDP failure. | RCR, CTG (Recovery) |

---

## II. GSEP: THE 7-STAGE ATOMIC PROTOCOL (GCO Managed)

The Governance State Evolution Protocol (GSEP) strictly enforces the complete, atomic path from M-01 intent (Stage 1) to committed mutation (Stage 6).

| Stage # | Pillar Focus | Stage Name | Action Mandate / Critical EPDP Check | Key Components |
|:---:|:---|:---|:---|:---|
| **0** | AIA | Initialization & Integrity Lock | Validate AOC Governance Rule Source (GSH) hash. | GRS-VA |
| **1** | GSEP | Policy Vetting & Scoping | Attest M-01 intent against standing policies. **EPDP A**: Policy Compliance Pass? | RSAM, C-15 |
| **2** | AIA | Structural Validation | Verify M-02 payload integrity (PSIM), provenance, and Code Entropy Estimate (CEE). | PSIM, CEE |
| **3** | GSEP | Simulation & Manifest Lock | Execute rigorous sandbox simulation (PSR). **NEW INTERLOCK**: PMH created. **EPDP B**: Simulation Pass? | PSR, DSCM, PMH |
| **4** | P-01 | **COMMITMENT ADJUDICATION** | Execute P-01 Trust Calculus (II.A). Verifies M-02 integrity via PMH. **EPDP C**: P-01 Trust Adjudication Pass? | OGT, ATM, MCRA, C-15, PMH |
| **5** | AIA | State Commitment Lock | MCR executes irreversible cryptographic Version-Lock, logged by D-01/AEOR. | MCR, AEOR, D-01 |
| **6** | GSEP | Deployment & Feedback | Secure deployment (C-04), audit (FBA/SEA), and refinement loop initiation. | C-04, FBA, SEA |

### A. P-01 TRUST CALCULUS: The Irreversible Gate (Stage 4)

Commitment is only granted at Stage 4 if Trust strictly exceeds Risk, AND policy constraints are satisfied. This calculation is immediately archived by DSCM.

$$ \text{P-01 PASS} \iff ( \text{S-01}_{\text{Trust}} > \text{S-02}_{\text{Risk Floor}} ) \land ( \text{S-03}_{\text{Veto}} = \text{FALSE} ) $$

| Metric ID | Definition | Criterion | Originating Component |
|:---|:---|:---|:---|
| **S-01** | Quantitative Efficacy Projection (Trust Score) | Must strictly exceed S-02. | ATM |
| **S-02** | Dynamic Maximum Risk Floor (Risk Exposure) | Must be rigorously minimized. | MCRA Engine |
| **S-03** | Policy Veto Flag (Boolean Constraint) | Must be definitively `FALSE`. | C-15 (Policy Engine) |

---

## III. GOVERNANCE ARCHITECTURAL REGISTRY (GAR) MAP

This catalog details all mandatory components, mapped by their primary GSEP Stage of operation, enforcing the AOC Triad mandate.

### A. AIA Focused Components (Integrity & Locking)

| Acronym | Functional Definition | Primary GSEP Stage(s) |
|:---|:---|:---|
| **GRS-VA** | Governance Rule Source Validator | Stage 0 |
| **PSIM** | Payload State Integrity Module | Stage 2 |
| **DSCM** | Decisional State Checkpoint Manager | Stages 3, 4 (P-01 Audit Lock) |
| **D-01 Logger** | Immutable Ledger System | Stages 5, 6, F-01 |
| **MCR** | Mutation Commitment Registrar | Stage 5 (Version-Lock Execution) |
| **AEOR** | Atomic Execution Order Record | Stage 5 |
| **RCR** | Reversal Commitment Registrar (F-01 Action) | Failure/Recovery |

### B. GSEP Focused Components (Flow Control & Audit)

| Acronym | Functional Definition | Primary GSEP Stage(s) |
|:---|:---|:---|
| **GCO** | Governance Constraint Orchestrator | All Stages (0-6) |
| **RSAM** | Rule-Set Alignment Model (EPDP A Check) | Stage 1 |
| **CEE** | Code Entropy Estimate (Risk Data Feed) | Stage 2 |
| **PSR** | Payload Simulation Runner (EPDP B Check) | Stage 3 |
| **PMH** | Payload Manifest Hash/Lock **(New v98.1)** | Stages 3, 4 (Integrity Checkpoint) |
| **C-04** | Commitment Deployment Handler | Stage 6 |
| **SEA** | System Efficacy Auditor | Stage 6 |
| **FBA** | Feedback Analysis & Audit | Stage 6 |
| **CTG** | Centralized Trace Generator (F-01 Action) | Failure/Recovery |

### C. P-01 Focused Components (Adjudication)

| Acronym | Functional Definition | Primary GSEP Stage |
|:---|:---|:---|
| **OGT** | Operational Governance Transformer | Stage 4 |
| **ATM** | AGI Trust Metrics System (Calculates S-01) | Stage 4 |
| **MCRA Engine** | Maximum Critical Risk Arbitrator (Calculates S-02) | Stage 4 |
| **C-15** | Policy Engine (Calculates S-03 Veto Flag) | Stages 1, 4 |
