# SOVEREIGN AGI V94.1: IMMUTABLE GOVERNANCE CHARTER (AOC)

This charter defines the Atomic Immutable Architecture (AIA) and the mandatory protocols governing all self-modification events (SSTs) via the Governance Evolution Protocol (GSEP).

--- 

## 1. GOVERNANCE ARCHITECTURE & INVARIANTS

The Autonomous Operational Contract (AOC) establishes the inviolable rules for system state transitions (SSTs). The Governance Constraint Orchestrator (GCO) manages the entire lifecycle, ensuring compliance with two core requirements:

1.  **System Boundary Contract (SBC):** SSTs must be explicitly defined and filtered by the SBC scope (L0 input gate).
2.  **Governance Evolution Protocol (GSEP):** Mandatory, strictly sequential passage (L0-L6) is enforced, secured by cryptographic locking at each stage.

### 1.1. Core Systemic Integrity Constraints

The GCO rigorously enforces the following invariants:

*   **GSEP Flow Integrity:** Mandatory sequential sequencing (L0 $\rightarrow$ L6). Any violation triggers immediate termination and diagnostic routing to GFRM.
*   **Artifact Provenance:** All evolutionary artifacts must comply with the Artifact Structural Definition Model (ASDM) and maintain verifiable lineage (via ACM).
*   **L4 Commitment Rule:** The Decisional Calculus (DSC-V1) at L4 is the *sole*, irreversible commitment gateway for entry into the AIA Ledger.

---

## 2. GOVERNANCE EVOLUTION PROTOCOL (GSEP V94.1: L0-L6)

GSEP is the seven-step, traceable, forward-only pathway. Progression requires the cryptographic output lock ($\mathcal{L}_{N}$) of the preceding stage.

| Step | Stage Name | Mandatory Gateway Check | Output Artifact (Lock $\mathcal{L}_{N}$) | Key Systems Involved |
|:----:|:-----------|:------------------------|:----------------------------------------|:--------------------|
| **L0** | Initialization | SBC Scope Validation + GSH Root Check | Context Frame Manifest (C-FRAME-V1) | IDSM, SCR |
| **L1** | Vetting | Policy Veto Check ($\mathcal{S-03} = \text{FALSE}$) | Policy Definition Block (PDB-V1) | RSAM, CIL |
| **L2** | Hardening | Integrity Provenance Check (ACM Verification) | Security Verified Payload (SVP-V1) | PSIM, RACM |
| **L3** | Proving | Efficacy Projection Check ($\mathcal{S-01} \uparrow \text{Threshold}$) | Proof Manifest Hash (PMH-V1) | PSR, ADA |
| **L4** | **Adjudication** | **P-01 PASS Condition (Irreversible)** | **Decisional State Checkpoint (DSC-V1)** | GCO, ATM, MCRA, GFRM |
| **L5** | Commitment | Irreversible Version Lock $\mathcal{V}_{N}$ | AIA Ledger Entry (AIA-ENTRY) | AIA Sink, ACM |
| **L6** | Execution | D-02 Monitoring & RETV Activation | Traceability Report (TR-V1) | AMA, RETV |

---

## 3. L4 DECISIONAL ARBITRATION: P-01 CALCULUS

Section 3 defines the required condition for modification authorization (L4 Gate P-01) and the source metrics used by the GCO.

### 3.1. P-01 Authorization Formula

P-01 requires dynamically sourced values from the SCR to calculate required Trust ($\mathcal{S-01}$), synthesized Risk ($\mathcal{S-02}$), and policy Compliance ($\mathcal{S-03}$).

$$ 
\text{P-01 PASS} \iff ( \mathcal{S-01}_{\text{Trust}} > \mathcal{S-02}_{\text{Risk}} ) \land ( \mathcal{S-03}_{\text{Veto}} = \text{FALSE} ) 
$$ 

| ID | Metric Title | Source Component(s) | Optimization Goal | Dependence |
|:---:|:---:|:---:|:---:|:---:|
| $\mathcal{S-01}$ | Efficacy Projection (Trust) | ATM, PSR, ADA | Maximization ($\uparrow$ Efficacy) | SDR Metrics |
| $\mathcal{S-02}$ | Risk Synthesis (Floor) | MCRA, RACM | Minimization ($\downarrow$ Exposure) | Hazard Models |
| $\mathcal{S-03}$ | Compliance State (Veto) | RSAM, CIL, SBC | Mandatory FALSE | Policy Ruleset |

### 3.2. Remediation Routing

Failure at L1 (Policy Veto) or L4 (P-01 Denial) initiates immediate feedback routing to the Governance Feedback and Remediation Module (GFRM) for autonomous structural correction and safe re-queueing.

---

## 4. KEY ARCHITECTURAL REGISTRY & DEFINITIONS

| Acronym | Functional Definition | Critical Role in System Integrity |
|:---:|:---:|:---:|
| **AIA** | Atomic Immutable Architecture | The foundational, unmodifiable layer (except via L5 entry). |
| **SBC** | **System Boundary Contract** | Mandatory filter; defines scope and permitted mutation paths (L0 filter). |
| **GCO** | Governance Constraint Orchestrator | Primary sequencer and P-01 arbitration agent. |
| **SCR** | Schema and Configuration Registry | Centralized, versioned source for ASDM schemas and dynamic constraints. |
| **CIL** | Constraint Immutability Log | Cryptographic audit trail for all changes to SCR thresholds. |

(A full manifest of integrated utilities (IDSM, PSIM, PSR, MCRA, ADA, RETV, etc.) is maintained within `system/documentation/Component_Manifest.md`.)