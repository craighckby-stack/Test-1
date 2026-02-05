## SOVEREIGN AGI V94.1: OPERATIONAL COMPONENT REGISTRY

This registry defines the mandatory operational subsystems that execute the Governance Evolution Protocol (GSEP) constraints. These systems operate under the strict oversight of the Governance Constraint Orchestrator (GCO) defined in the AOC Charter.

### 1. ARBITRATION & CONTROL SUBSYSTEMS

| Acronym | Component Name | GSEP Relevance | Primary Function |
|:---:|:---:|:---:|:---:|
| **ACM** | Artifact Chain Manager | L2, L5 | Validates lineage and provenance of all artifact outputs (\(\mathcal{L}_{N}\)). |
| **ATM** | Arbitration Trust Module | L4 | Generates the core Trust Score used in the \(\mathcal{S-01}\) calculation. |
| **MCRA** | Mandatory Constraint Resolution Agent | L4 | Executes conflict resolution and provides the Risk Score used in \(\mathcal{S-02}\). |
| **IDSM** | Input/Draft State Manager | L0 | Initializes context and enforces the initial Schema Load via SCR. |

### 2. POLICY & VALIDATION SUBSYSTEMS

| Acronym | Component Name | GSEP Relevance | Primary Function |
|:---:|:---:|:---:|:---:|
| **RSAM** | Risk State Assessment Module | L1 | Conducts real-time risk evaluation and feeds into the \(\mathcal{S-03}\) policy veto check. |
| **CIL** | Compliance Integration Layer | L1 | Enforces policy alignment and provides the compliance state for the Veto check. |
| **PSR** | Projection and Synthesis Registry | L3 | Manages efficacy simulation results used for threshold checking (L3). |
| **SDR** | System Diagnostic & Reporting Metrics | L3, L4 | Supplies quantifiable data points required for calculating both \(\mathcal{S-01}\) and \(\mathcal{S-02}\). |

### 3. POST-COMMITMENT SUBSYSTEMS

| Acronym | Component Name | GSEP Relevance | Primary Function |
|:---:|:---:|:---:|:---:|
| **RETV** | Real-Time Execution Vetting | L6 | Monitors system behavior post-activation to ensure continuity and mandate compliance (D-02 check). |
| **AMA** | Activation and Monitoring Agent | L6 | Manages the seamless transition of the AIA-ENTRY into active operational state. |
