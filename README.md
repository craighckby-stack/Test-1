# SOVEREIGN AGI V94.1: GOVERNANCE CHARTER (AOC)

## MANDATE: Autonomous Operational Contract (AOC)

This document mandates the non-negotiable protocols for all System State Transitions (SSTs) and self-modification events. The system's evolution must adhere strictly to the **Governance Evolution Protocol (GSEP)**, focused on maintaining the integrity of the **Atomic Immutable Architecture (AIA)** through auditable, mathematically quantified decision-making.

---

## 1. INVIOLABLE ARCHITECTURAL INVARIANTS (AIA Protection)

The Governance Constraint Orchestrator (GCO) rigorously enforces these mandatory rules across all SSTs. Failure in any constraint triggers immediate routing to the Governance Feedback & Remediation Module (GFRM).

### 1.1. Protocol Integrity & Sequencing

*   **Sequential Mandate:** GSEP progression must be forward sequential (L0 → L6). Sequence disruption ($\text{FAIL}_{N-1}$) triggers emergency routing to GFRM, bypassing subsequent GSEP stages.
*   **Input Constraint (L0):** All SST proposals must achieve strict L0 validation, confirming compliance against the System Boundary Contract (SBC) and the structural ruleset of the Schema and Configuration Registry (SCR).

### 1.2. Provenance & Commitment Requirements

*   **Verifiable Lineage (L2):** All artifacts must maintain auditable lineage via the Artifact Chain Manager (ACM) and conform to the Artifact Structural Definition Model (ASDM).
*   **Irreversible Gateway (L4):** The Decisional State Checkpoint (DSC-V1) generated solely at L4 is the singular, cryptographically irreversible commitment gateway. This requires absolute P-01 authorization.

---

## 2. GOVERNANCE EVOLUTION PROTOCOL (GSEP V94.1: L0-L6)

GSEP is the mandatory, seven-step, forward-only pathway. Progression requires successful verification of the cryptographic output lock ($\mathcal{L}_{N}$) from the preceding stage.

| Step | Stage Name | Core Function & Constraint Agents | Output Artifact ($\\mathcal{L}_{N}$) | Mandatory Check/Lock State |
|:----:|:-----------|:--------------------------------|:-----------------------------------|:----------------------|
| **L0** | Initialization | Input Filtering & Scope Definition (SCR, SBC) | Context Frame Manifest (C-FRAME-V1) | SBC Scope + SCR Parameters |
| **L1** | Vetting | Policy Compliance Assessment (AOC, GFRM Veto Path) | Policy Definition Block (PDB-V1) | Policy Veto Check ($\\mathcal{S-03} = \text{FALSE}$) |
| **L2** | Hardening | Security & Integrity Verification (ACM) | Security Verified Payload (SVP-V1) | Integrity Provenance Check |
| **L3** | Proving | Efficacy Modeling & Projection (SDR) | Proof Manifest Hash (PMH-V1) | Efficacy Projection Check ($\\mathcal{S-01} \uparrow \text{Threshold}$) |
| **L4** | **ADJUDICATION** | **Risk/Efficacy Arbitrator (GCO fed by SDR, HMC)** | **Decisional State Checkpoint (DSC-V1)** | **Irreversible P-01 PASS Condition** |
| **L5** | Commitment | AIA Ledger Finalization (AIA Sink) | AIA Ledger Entry (AIA-ENTRY) | Irreversible Version Lock $\\mathcal{V}_{N}$ |
| **L6** | Execution | Operational Activation & Monitoring (RETV) | Traceability Report (TR-V1) | D-02 Monitoring & Activation |

---

## 3. L4 COMMITMENT ARBITRATION: P-01 FORMULA

L4 evaluates risk vs. utility using inputs provided by SDR (Efficacy) and HMC (Risk). P-01 authorization is conditional on mathematical certainty.

$$
\text{P-01 PASS} \iff ( \mathcal{S-01}_{\text{Efficacy}} > \mathcal{S-02}_{\text{Risk}} ) \land ( \mathcal{S-03}_{\text{Veto}} = \text{FALSE} )
$$

### Governing Metrics & Sources

The detailed calculation methodologies for $\mathcal{S-01}$ and $\mathcal{S-02}$ must conform to the mandated System Metric Standard (SMS) definition located in the SCR configuration space.

| ID | Metric Title | Source Agent | Optimization Goal |
|:---:|:---:|:---:|:---:|
| $\mathcal{S-01}$ | Efficacy Projection (Utility) | System Diagnostic & Reporting (SDR) | Maximization ($\uparrow$ Utility) |
| $\mathcal{S-02}$ | Risk Synthesis (Hazard Exposure) | Hazard Modeling Component (HMC) | Minimization ($\downarrow$ Exposure) |
| $\mathcal{S-03}$ | Compliance State (Veto) | AOC/SBC | Mandatory FALSE Veto |

---

## 4. AGENT & ARCHITECTURAL REGISTRY (AAR) REFERENCE

| Acronym | Type | Functional Definition |
|:---:|:---:|:---|
| **AIA** | Architecture | Atomic Immutable Architecture: Foundational ledger state. |
| **AOC** | Contract | Autonomous Operational Contract: This governance charter. |
| **GCO** | Agent | Governance Constraint Orchestrator: Primary SST arbiter; validates L4 authorization. |
| **GSEP** | Protocol | Governance Evolution Protocol: The mandatory L0-L6 modification pathway. |
| **SBC** | Contract | System Boundary Contract: Mandatory L0 input filter defining scope/constraints. |
| **SCR** | Agent | Schema and Configuration Registry: Canonical source for structural constraints. |
| **GFRM** | Agent | Governance Feedback & Remediation Module: Autonomous error handler (L1/L4 failure path). |
| **SDR** | Agent | System Diagnostic & Reporting: Supplies $\mathcal{S-01}$ (Efficacy) inputs to the GCO. |
| **HMC** | Agent | Hazard Modeling Component: Supplies $\mathcal{S-02}$ (Risk) inputs to the GCO. |
| **ACM** | Agent | Artifact Chain Manager: Confirms verifiable lineage (L2). |
| **RETV** | Agent | Execution Vetting: Manages L6 operational activation and monitoring. |