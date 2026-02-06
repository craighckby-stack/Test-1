## SOVEREIGN AGI V94.1: ARCHITECTURAL COMPONENT REGISTRY (ACR)

This registry catalogs the mandatory, versioned interfaces and functional contracts of operational subsystems, enforcing compliance via the Governance Evolution Protocol (GSEP) constraints. All components report state and receive instruction exclusively through the Governance Constraint Orchestrator (GCO).

---

### PRIMITIVE CONTROL ALGORITHMS (PCA)

These algorithms calculate core metrics derived from real-time and historical states, driving critical constraint-checking and arbitration decisions.

| ID | Description | Primary Inputs | Output Consumers |
|:---:|:---:|:---:|:---:|
| **PCA-101** | Trust/Integrity Score | ATM Trust Index, SDR Telemetry | MCRA, RSAM (Conflict Weighting) |
| **PCA-102** | Operational Risk Index | MCRA Risk Score, SDR Telemetry | GCO (Defines L4 Operational Tolerance) |
| **PCA-103** | Policy Veto Threshold | RSAM Assessment, CIL Compliance State | CIL (Controls Immediate Execution Suspension) |
| **PCA-104** | Artifact Lineage Vector | ACM History Log, AIA-ENTRY Hash | ACM (Validates Immutable Artifact History) |

### DOMAIN I: PROVENANCE & CONTEXT INGESTION (Phase 0: Initialization)

Focus: Input validation, context loading, and establishing immutable lineage.

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Linked PCA/Dependencies | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **IDSM** | Input/Draft State Manager | L0 | `input.state.manager` | SCR | Initializes context and loads input schema; retrieves L0 environment configuration. |
| **ACM** | Artifact Chain Manager | L2, L5 | `provenance.chain.log` | PCA-104 | Validates and anchors the lineage and provenance of all evolving artifacts. |
| **SCR** | System Configuration Registry | L0, L1 | `config.system.read` | IDSM, CIL, PCA | **[NEW]** Centralized, versioned storage for operational constants and policy parameters (L0/L1). |

### DOMAIN II: ARBITRATION & CONSTRAINT GOVERNANCE (Phase 1: Decision)

Focus: Real-time risk assessment, compliance enforcement, and conflict resolution.

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Linked PCA/Dependencies | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **CIL** | Compliance Integration Layer | L1 | `governance.policy.check` | PCA-103, SCR | Enforces governance policy alignment and calculates immediate compliance state. |
| **RSAM** | Risk State Assessment Module | L1 | `risk.state.query` | PCA-103 (Input), PCA-101 (Consumer) | Conducts real-time risk evaluation; defines parameters for policy veto threshold. |
| **ATM** | Arbitration Trust Module | L4 | `arbitration.trust.index` | PCA-101 (Input) | Generates the foundational Trust Score for system components and data sources. |
| **MCRA** | Mandatory Constraint Resolution Agent | L4 | `conflict.resolution.agent` | PCA-101, PCA-102 | Executes automated conflict resolution and calculates the high-level Risk Score. |

### DOMAIN III: EVOLUTION & TELEMETRY COMMITMENT (Phase 2/3: Feedback & Deployment)

Focus: Efficacy projection, final commitment, monitoring, and autonomous adaptation planning.

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Linked PCA/Dependencies | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **PSR** | Projection & Synthesis Registry | L3 | `synthesis.simulation.data` | RETV (Consumer) | Manages and registers efficacy simulation results used for L3 threshold checks. |
| **SDR** | System Diagnostic & Reporting | L3, L4 | `telemetry.raw.metrics` | PCA-101, PCA-102 | Supplies aggregated, quantifiable data points required for calculating core PCA metrics. |
| **AMA** | Activation & Monitoring Agent | L6 | `activation.state.transition` | ACM | Manages the transition of the finalized Artifact Entry (AIA-ENTRY) into an active operational state. |
| **RETV** | Real-Time Execution Vetting | L6 | `execution.runtime.vetting` | SDR | Monitors post-activation system behavior against projected outcomes (D-02 check). |
| **ASP** | Adaptive Synthesis Planner | L7 | `adaptation.plan.design` | SDR, RETV, IDSM (Feedback) | Processes telemetry output to autonomously design optimal subsequent architectural modification plans. |