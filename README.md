# SOVEREIGN AGI V94.1: AUTONOMOUS OPERATIONAL CHARTER (AOC)

## 0. EXECUTIVE SUMMARY: GOVERNANCE CORE REFERENCE

This charter specifies the **Autonomous Operational Contract (AOC)**, defining mandatory protocols and constraints for all System State Transitions (SSTs). System evolution is governed by the **Governance Evolution Protocol (GSEP)**, ensuring verifiable finality via the **Atomic Immutable Architecture (AIA)**.

---

## I. CORE MECHANISM: GOVERNANCE EVOLUTION PROTOCOL (GSEP L0-L6)

The GSEP is the mandatory, atomic, seven-step pathway controlling all self-modification events ($\mathcal{V}_{N}$). 

| Step | Stage Name | Protocol / Agent | Gate Check | Artifact ($\mathcal{L}_{N}$) |
|:----:|:-----------|:-----------------|:-----------|:-----------------------------|
| **L0** | Input Validation | SCR / SBC | Compliance (Schema PASS) | C-FRAME-V1 (Context Frame) |
| **L1** | Policy Screening | AOC (Veto Def.) | Veto Check ($\mathcal{S-03} = \text{FALSE}$) | PDB-V1 (Policy Block) |
| **L2** | Integrity Hardening | ACM | Provenance PASS | SVP-V1 (Verified Payload) |
| **L3** | Utility Proofing | SDR | Efficacy Projection ($\mathcal{S-01} \uparrow \text{T}_{\text{Util}}$) | PMH-V1 (Proof Manifest) |
| **L4** | **COMMIT ARBITRATION** | **GCO (P-01 Synthesis)** | **IRREVERSIBLE P-01 PASS** | **DSC-V1 (Decisional Checkpoint)** |
| **L5** | Ledger Finality | AIA (Immutable Sink) | Version Lock $\mathcal{V}_{N}$ | AIA-ENTRY (Ledger Entry) |
| **L6** | Operational Vetting | RETV | Activation Trace D-02 PASS | TR-V1 (Traceability Report) |

---

## II. INVIOLABLE MANDATES & CONSTRAINTS

1.  **AOC Supremacy ($\mathcal{S-03}$):** No SST may proceed if the Autonomous Operational Contract is violated ($\mathcal{S-03} = \text{TRUE}$). 
2.  **Forward Progression:** Modification must strictly adhere to the GSEP's L0 $\to$ L6 sequential path.
3.  **Failure Protocol ($\text{FAIL}_{N-1}$):** Constraint failure triggers immediate routing to the GFRM (Governance Feedback & Remediation Module), blocking subsequent GSEP stages.
4.  **L5 Immutability:** L5 commitment (AIA-ENTRY) makes the associated state transition ($\mathcal{V}_{N}$) irreversible and immutable.

---

## III. L4 ARBITRATION: P-01 COMMITMENT GATEWAY

The GCO governs L4, balancing Efficacy ($\mathcal{S-01}$) against Risk ($\mathcal{S-02}$), under mandatory Compliance ($\mathcal{S-03}$). Thresholds are dynamically managed by the **GTCM**.

### III.1. Governing Constraint Equation (P-01 PASS Condition)

$$ 
\text{P-01 PASS} \iff ( \mathcal{S-01}_{\text{Efficacy}} > \mathcal{S-02}_{\text{Risk}} ) \land ( \mathcal{S-03}_{\text{Veto}} = \text{FALSE} )
$$

### III.2. System Metric Standard (SMS Reference)

| ID | Metric Title | Source Agent | Goal | Threshold Reference |
|:---:|:---:|:---:|:---:|:---:|
| $\mathcal{S-01}$ | Efficacy Projection | SDR | Maximization | Utility Threshold (`GTCM.Utility`) |
| $\mathcal{S-02}$ | Risk Synthesis | HMC | Minimization | Exposure Threshold (`GTCM.Exposure`) |
| $\mathcal{S-03}$ | Compliance State | AOC | Mandatory FALSE | Policy Veto (AOC) |

---

## IV. GOVERNANCE COMPONENT MAP (GCM)

### IV.1. Active Agents (Operational Roles)
GCO (Arbiter), SDR (Utility), HMC (Risk), ACM (Integrity), GFRM (Remediation), RETV (Deployment).

### IV.2. Passive Architectures & Protocols (Defining Roles)
AIA (Ledger), AOC (Policy Contract), SBC (Boundary Contract), SCR (Registry), GSEP (Protocol), GTCM (Threshold Config).