## SOVEREIGN AGI V94.1: ARCHITECTURAL COMPONENT REGISTRY (ACR)

This registry formally catalogs mandatory, versioned operational interfaces and functional contracts. Compliance is enforced exclusively via the Governance Evolution Protocol (GSEP) constraints. All components report state and receive instruction through the Governance Constraint Orchestrator (GCO).

---

### PRIMITIVE CONTROL ALGORITHMS (PCA)
*These foundational, non-mutative algorithms calculate core metrics derived from telemetry and state, driving constraint arbitration and risk assessment.*

| ID | Description | DATA SOURCE (Primary Input Component) | Derived Metrics | Output Consumers (APIs) |
|:---:|:---:|:---:|:---:|:---:|
| **PCA-101** | Trust/Integrity Score Calculation | ATM, SDR | T_Index, I_Delta | MCRA, RSAM (Conflict Weighting) |
| **PCA-102** | Operational Risk Index Calculation | MCRA, SDR | R_Index, L4_Tolerance | GCO (Constraint Update), AMA (Activation Halt) |
| **PCA-103** | Policy Veto Threshold Derivation | RSAM, CIL | Veto_Score, L1_Compliance | CIL (Controls Immediate Execution Suspension) |
| **PCA-104** | Artifact Lineage Vector Generation | ACM, AIA-ENTRY | Hash_Vector, Provenance_ID | ACM (Validates History), AMA (Commit ID) |

---

### DOMAIN 0: CORE GOVERNANCE & ORCHESTRATION (D-0)
*Phase: Architectural Root. Components essential for systemic integrity and central decision dispatch.*

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Dependencies | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **GCO** | Governance Constraint Orchestrator | L0, L4 | `governance.orchestrate` | All | Central dispatcher; receives PCA metrics; enforces L4 operational tolerance and state synchronization. |
| **AIA** | Autonomous Interface Anchor | L0 | `system.state.entry` | IDSM, GCO | Serves as the immutable interface for external requests and finalized evolution artifacts (AIA-ENTRY). |

### DOMAIN I: PROVENANCE & CONTEXT INGESTION (D-I)
*Phase 0: Initialization. Focus: Input validation, context loading, and establishing immutable lineage.*

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Dependencies | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **IDSM** | Input/Draft State Manager | L0 | `input.state.manager` | AIA, SCR | Initializes context and loads input schema; manages ephemeral draft state. |
| **ACM** | Artifact Chain Manager | L2, L5 | `provenance.chain.log` | PCA-104, AEL | Validates and anchors the lineage and provenance (L5 audit) of all evolving artifacts. |
| **SCR** | System Configuration Registry | L0, L1 | `config.system.read` | IDSM, CIL | Centralized, versioned storage for operational constants, policies, and environment parameters. |

### DOMAIN II: ARBITRATION & CONSTRAINT GOVERNANCE (D-II)
*Phase 1: Decision. Focus: Real-time risk assessment, compliance enforcement, and conflict resolution.*

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Dependencies | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **CIL** | Compliance Integration Layer | L1 | `governance.policy.check` | PCA-103, SCR | Enforces governance policy alignment (L1 constraints) and calculates immediate compliance state. |
| **RSAM** | Risk State Assessment Module | L1 | `risk.state.query` | PCA-103, PCA-101 | Conducts real-time risk evaluation; defines parameters used to calculate policy veto threshold. |
| **ATM** | Arbitration Trust Module | L4 | `arbitration.trust.index` | PCA-101 (Source), AEL | Generates the foundational Trust Score for system components and input sources. |
| **MCRA** | Mandatory Constraint Resolution Agent | L4 | `conflict.resolution.agent` | PCA-101, PCA-102 | Executes automated conflict resolution; calculates and reports high-level Risk Score. |

### DOMAIN III: EVOLUTION, TELEMETRY, & COMMITMENT (D-III)
*Phase 2/3: Feedback & Deployment. Focus: Efficacy projection, final commitment, monitoring, and autonomous adaptation.*

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Dependencies | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **PSR** | Projection & Synthesis Registry | L3 | `synthesis.simulation.data` | RETV, ASP | Registers efficacy simulation results used for L3 (Effectiveness) threshold checks. |
| **SDR** | System Diagnostic & Reporting | L3, L4 | `telemetry.raw.metrics` | AEL (Input), All | Supplies aggregated, quantifiable data points required for calculating PCA metrics (L3 feedback loops). |
| **AEL** | Audit Event Logger [NEW] | L5 | `audit.event.immutable` | CIL, MCRA, ATM | **Captures and immutably logs all critical state transitions, decisions, and compliance failures.** |
| **AMA** | Activation & Monitoring Agent | L6 | `activation.state.transition` | ACM, GCO | Manages the transition of the finalized Artifact Entry (AIA-ENTRY) into an active operational state (L6 commitment). |
| **RETV** | Real-Time Execution Vetting | L6 | `execution.runtime.vetting` | SDR, AMA | Monitors post-activation system behavior against projected outcomes (Deployment Phase Vetting). |
| **ASP** | Adaptive Synthesis Planner | L7 | `adaptation.plan.design` | SDR, RETV, IDSM | Processes telemetry output to autonomously design optimal subsequent architectural modification plans (L7 Evolution). |