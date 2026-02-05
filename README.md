# SOVEREIGN AGI V94.1: AUTONOMOUS OPERATIONAL CONTRACT (AOC)

This foundational charter establishes the **Autonomous Operational Contract (AOC)**, defining the mandatory protocols and constraints for all System State Transitions (SSTs) and self-modification events. All evolution must strictly adhere to the **Governance Evolution Protocol (GSEP)**, ensuring data integrity via the **Atomic Immutable Architecture (AIA)**.

---

## 0. SYSTEM COMPONENT MAP & GOVERNANCE ARTIFACTS (SCM)

### 0.1. Protocols, Architectures, and Contracts (Passive/Defining Layers)

| Acronym | Type | Functional Definition | Critical I/O | Persistence/Scope |
|:---:|:---:|:---|:---|:---:|
| **AIA** | Architecture | **Atomic Immutable Architecture**: Foundational, append-only ledger state. Ensures L5 irreversible commitment. | Output: L5 Commitment | Persistence Layer |
| **AOC** | Contract | **Autonomous Operational Contract**: Authoritative governance charter defining L1 Veto Policy ($\mathcal{S-03}$). | Input: Policy Veto | L1 Policy Definition |
| **SBC** | Contract | **System Boundary Contract**: Mandatory L0 filter defining external operational scope and immutable physical boundaries. | Input: L0 Scope Definition | L0 Constraint Filter |
| **SCR** | Registry | **Schema and Configuration Registry**: Canonical source for structural rulesets (ASDM) and L0 parameters. | Input: L0 Parameters & Schemas | L0 Initialization |
| **GSEP** | Protocol | **Governance Evolution Protocol**: Mandatory seven-step, forward-only modification pathway (L0-L6). | Protocol: End-to-End Transition | Core Mechanism |

### 0.2. Active Governance Agents (Operational Layers)

| Acronym | Agent | Functional Definition | Primary GSEP Role | Critical State I/O |
|:---:|:---:|:---|:---|:---:|
| **GCO** | **G**overnance **C**onstraint **O**rchestrator | Primary SST arbiter; validates P-01 authorization and controls L4 flow. | Critical Arbiter (L4) | Process: L4 Adjudication |
| **HMC** | **H**azard **M**odeling **C**omponent | Quantifies systemic risk synthesis ($\mathcal{S-02}$ / Hazard Exposure). | L4 Input Provider | Input: $\mathcal{S-02}$ (Risk Score) |
| **SDR** | **S**ystem **D**iagnostic & **R**eporting | Projects modification efficacy/utility ($\mathcal{S-01}$ / Utility Score). | L3 Input Provider | Input: $\mathcal{S-01}$ (Utility Score) |
| **ACM** | **A**rtifact **C**hain **M**anager | Verifies modification artifact provenance and lineage against SCR/ASDM (L2). | Integrity Verification (L2) | Process: L2 Hardening |
| **GFRM** | **G**overnance **F**eedback & **R**emediation **M**odule | Autonomous error handler, triggered by constraint failure ($\text{FAIL}_{N-1}$). Initiates Constraint Failure Manifest (CFM). | Constraint Recovery | Output: CFM |
| **RETV** | **R**eporting & **E**xecution **V**etting | Manages L6 operational activation, integration, and monitoring lifecycle. | Deployment & Trace (L6) | Output: TR-V1 |

---

## 1. INVIOLABLE MANDATE & GSEP FLOW CONTROL

All proposed modification artifacts are subject to mandatory structural integrity checks (L0/L2) and strict forward-sequential progression through the GSEP.

### 1.1. Core Constraint Principles

*   **Failure Protocol:** Failure at any stage ($\text{FAIL}_{N-1}$) triggers immediate execution routing to the GFRM, which generates a Constraint Failure Manifest (CFM) and bypasses subsequent stages.
*   **L0 (Initialization):** Artifacts must satisfy SCR structural schemas and SBC boundary rules.
*   **L2 (Hardening):** Provenance must be cryptographically verifiable via the ACM.
*   **L4 (Adjudication / Commitment Gateway):** The Decisional State Checkpoint (DSC-V1) requires strict P-01 authorization, serving as the singular commitment gateway.
*   **L5 (Finality):** AIA ensures irreversible, append-only ledger commitment ($\mathcal{V}_{N}$).

---

## 2. GOVERNANCE EVOLUTION PROTOCOL (GSEP V94.1: L0-L6)

| Step | Stage Name | Constraint Agents & Key Function | System Metric Check | Artifact Output ($\mathcal{L}_{N}$) |
|:----:|:-----------|:-------------------------------|:------------------------|:-----------------------------------|
| **L0** | Input Filter | Defines scope and validates structure (SBC, SCR) | Schema & Boundary Compliance PASS | Context Frame Manifest (C-FRAME-V1) |
| **L1** | Policy Lock | Assesses charter compliance (AOC, GFRM Veto) | Policy Veto Check ($\mathcal{S-03} = \text{FALSE}$) | Policy Definition Block (PDB-V1) |
| **L2** | Artifact Hardening | Verifies verifiable lineage and integrity (ACM) | Integrity Provenance Check PASS | Security Verified Payload (SVP-V1) |
| **L3** | Efficacy Proof | Models projected utility (SDR Agent) | Efficacy Projection ($\mathcal{S-01} \uparrow \text{Threshold}$) | Proof Manifest Hash (PMH-V1) |
| **L4** | **COMMITMENT ARBITRATION** | **Risk/Utility Orchestration (GCO)** | **IRREVERSIBLE P-01 PASS** | **Decisional State Checkpoint (DSC-V1)** |
| **L5** | Ledger Finality | Final AIA Write-Lock (AIA Sink) | Irreversible Version Lock $\mathcal{V}_{N}$ | AIA Ledger Entry (AIA-ENTRY) |
| **L6** | Operational Trace | Deployment and Liveness Monitoring (RETV) | D-02 Monitoring & Activation | Traceability Report (TR-V1) |

---

## 3. L4 COMMITMENT ARBITRATION: P-01 AUTHORIZATION

The GCO rigorously confirms the viability of the state transition by assessing projected utility ($\mathcal{S-01}$) against calculated hazard exposure ($\mathcal{S-02}$) while maintaining policy adherence ($\mathcal{S-03}$). 

### 3.1. Governing Constraint Equation (P-01 PASS Condition)

P-01 authorization requires Efficacy to strictly exceed Risk, AND the policy Veto state to be absent (FALSE).

$$\text{P-01 PASS} \iff ( \mathcal{S-01}_{\text{Utility}} > \mathcal{S-02}_{\text{Risk}} ) \land ( \mathcal{S-03}_{\text{Veto}} = \text{FALSE} )$$

### 3.2. System Metric Standard (SMS Reference)

| ID | Metric Title | Source Agent | Constraint Goal |
|:---:|:---:|:---:|:---:|
| $\mathcal{S-01}$ | Efficacy Projection (Utility Score) | SDR | Maximization ($\uparrow$ Utility Threshold) |
| $\mathcal{S-02}$ | Risk Synthesis (Hazard Exposure) | HMC | Minimization ($\downarrow$ Exposure Threshold) |
| $\mathcal{S-03}$ | Compliance State (Policy Veto) | AOC | Mandatory FALSE Veto State |