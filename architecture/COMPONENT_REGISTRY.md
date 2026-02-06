## SOVEREIGN AGI V94.1: ARCHITECTURAL COMPONENT REGISTRY (ACR)

This registry catalogs the mandatory, versioned interfaces of operational subsystems required for executing the Governance Evolution Protocol (GSEP) constraints. All components report state and receive instruction exclusively through the Governance Constraint Orchestrator (GCO).

---

### CORE CALCULATION DEPENDENCIES (CCOD)

| Calculation | Description | Primary Inputs | Output Utilization |
|:---:|:---:|:---:|:---:|
| \(\mathcal{S-01}\) | Trust/Integrity Score | ATM Score, SDR Metrics | Used by MCRA and RSAM for conflict weighting. |
| \(\mathcal{S-02}\) | Operational Risk Index | MCRA Risk Score, SDR Metrics | Defines operational tolerance (L4). |
| \(\mathcal{S-03}\) | Policy Veto Threshold | RSAM Assessment, CIL State | Controls immediate execution suspension. |
| \(\mathcal{L}_{N}\) | Artifact Lineage Vector | ACM History, AIA-ENTRY Hash | Validates immutable artifact history. |

### 1. CONTEXT & INITIALIZATION LAYER (Phase 0: Input/Schema Loading)

| Acronym | Component Name | GSEP Relevance | Operational Phase | Primary Function |
|:---:|:---:|:---:|:---:|:---:|
| **IDSM** | Input/Draft State Manager | L0 | Initialization | Initializes context, loads input schema, and sets environmental variables via SCR. |
| **ACM** | Artifact Chain Manager | L2, L5 | Initialization/Commitment | Validates lineage and provenance (\(\mathcal{L}_{N}\)) of all artifacts. |

### 2. ARBITRATION & GOVERNANCE CORE (Phase 1: Validation & Decision)

| Acronym | Component Name | GSEP Relevance | Operational Phase | Primary Function |
|:---:|:---:|:---:|:---:|:---:|
| **CIL** | Compliance Integration Layer | L1 | Validation | Enforces governance policy alignment and calculates compliance state for \(\mathcal{S-03}\). |
| **RSAM** | Risk State Assessment Module | L1 | Validation | Conducts real-time risk evaluation; feeds into the \(\mathcal{S-03}\) policy veto check. |
| **ATM** | Arbitration Trust Module | L4 | Arbitration | Generates the core Trust Score used in the \(\mathcal{S-01}\) calculation. |
| **MCRA** | Mandatory Constraint Resolution Agent | L4 | Arbitration | Executes conflict resolution and provides the Risk Score used in \(\mathcal{S-02}\). |

### 3. EXECUTION & ADAPTATION LAYER (Phase 2/3: Deployment & Feedback)

| Acronym | Component Name | GSEP Relevance | Operational Phase | Primary Function |
|:---:|:---:|:---:|:---:|:---:|
| **PSR** | Projection and Synthesis Registry | L3 | Synthesis | Manages efficacy simulation results used for threshold checking (L3). |
| **SDR** | System Diagnostic & Reporting | L3, L4 | Metrics | Supplies quantifiable data points required for calculating \(\mathcal{S-01}\) and \(\mathcal{S-02}\). |
| **AMA** | Activation and Monitoring Agent | L6 | Commitment | Manages the transition of the AIA-ENTRY into an active operational state. |
| **RETV** | Real-Time Execution Vetting | L6 | Vetting | Monitors post-activation system behavior (D-02 check). |
| **ASP** | Adaptive Synthesis Planner | L7 (Proposed) | Feedback | Processes SDR/RETV output to autonomously design optimal subsequent architectural modification plans (Feeds back to IDSM). |