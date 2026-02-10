## AGI-KERNEL V7.X: ARCHITECTURAL COMPONENT REGISTRY (ACR)

This registry formally catalogs mandatory, versioned operational interfaces and functional contracts, structured by their role within the Autonomous Evolutionary Cycle (AEC). All components are mandatory (M), read-only (R), or optional (O).

Compliance is enforced exclusively via the Governance Evolution Protocol (GSEP) constraints. All components adhere to two standardized protocols:
1. **Telemetry & Reporting Protocol (TRP):** Reports state and diagnostics to the System Diagnostic & Reporting (SDR) component.
2. **Control & Instruction Protocol (CIP):** Receives instruction and constraint parameters from the Governance Constraint Orchestrator (GCO).

---

### CORE METRICS & DERIVATION CONTRACTS (CMD)
*These functional contracts calculate core integrity, risk, and compliance metrics derived from TRP telemetry streams, driving constraint arbitration (M: Mandatory, R: Read-Only).

| ID | Description | Primary Data Provider (TRP Source) | Derived Metrics | CIP Consumers (Instruction Recipients) |
|:---:|:---:|:---:|:---:|:---:|
| **CMD-101** | Trust/Integrity Score Calculation | ATM, SDR | T_Index, I_Delta | MCRA, RSAM (Conflict Weighting) |
| **CMD-102** | Operational Risk Index Calculation | MCRA, SDR | R_Index, L4_Tolerance | GCO (Constraint Update), AMA (Activation Halt) |
| **CMD-103** | Policy Veto Threshold Derivation | RSAM, CIL | Veto_Score, L1_Compliance | CIL (Controls Immediate Execution Suspension) |
| **CMD-104** | Artifact Lineage Vector Generation | ACM, AIA | Hash_Vector, Provenance_ID | ACM (Validates History), AMA (Commit ID) |

---

### CAPABILITY ALIGNMENT MAPPING (CAM)
*Mapping of the **3 Core Kernel Capabilities (Navigation, Logic, Memory)** and 5 architectural support dimensions, validating structural support for AGI development.*

| Capability Dimension | Primary Component(s) | Role in System |
|:---:|:---:|:---:|
| **Navigation** | NTS (Navigator Targeting System), ASP | Strategic file selection across 2,300+ files, managing the **Priority-Based Weighting** (core, agents, emergent) and Blacklist mechanism to enforce diversity and implement Adaptive Reset. |
| **Logic** | LOE (Learning Optimization Engine), ASP | Code comprehension, recursive improvement quality, architectural optimization, pattern synthesis efficacy, and self-directed architecture optimization. |
| **Memory** | PRL (Pattern Retention Layer), AEL | Learning retention, historical pattern synthesis, cross-domain transfer learning, and dependency tracking. |
| **Error Handling** | DVP (Data Validation Processor) | Robust fault tolerance and input schema enforcement. |
| **JSON Parsing** | DVP (Data Validation Processor) | Data extraction from potentially malformed LLM outputs. |
| **Meta-Reasoning** | LOE (Learning Optimization Engine) | Strategy adaptation, self-diagnosis, and initiation of stagnation recovery protocols. |
| **Autonomy** | ASP (Adaptive Synthesis Planner) | Autonomous strategic decision-making and architectural planning based on maturity goals. |
| **Creativity** | NSHG (Novelty Synthesis Hypothesis Generator) | Generates novel, non-incremental emergent architectural proposals and cross-domain integrations. |

---

### PHASE 0: INITIATION & PROVENANCE (P-0)
*Focus: Input validation, context loading, systemic anchoring, and immutable lineage establishment.*

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Role | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **GCO** | Governance Constraint Orchestrator | L0, L4 | `governance.orchestrate` | M | Central dispatcher; enforces L4 operational tolerance and state synchronization via CIP. |
| **AIA** | Autonomous Interface Anchor | L0 | `system.state.entry` | M | Serves as the immutable entry/exit point for finalized evolution artifacts (AIA-ENTRY) and external requests. |
| **IDSM** | Input/Draft State Manager | L0 | `input.state.manager` | M | Initializes context, loads input schema, and manages ephemeral draft state. |
| **DVP** | Data Validation Processor | L0 | `data.validation.robust` | M | Ensures robust data extraction and fault tolerance against malformed or truncated responses (Supports JSON Parsing & Error Handling). |
| **SCR** | System Configuration Registry | L0, L1 | `config.system.read` | R | Centralized, versioned storage for operational constants, policies, and environment parameters. |
| **ACM** | Artifact Chain Manager | L2, L5 | `provenance.chain.log` | M | Validates and anchors the lineage (L5 audit) of all evolving artifacts utilizing CMD-104. |

### PHASE 1: ARBITRATION & CONSTRAINT GOVERNANCE (P-1)
*Focus: Real-time risk assessment, compliance enforcement (L1/L4), and conflict resolution.*

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Role | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **CIL** | Compliance Integration Layer | L1 | `governance.policy.check` | M | Enforces governance policy alignment (L1 constraints) using CMD-103 outputs. |
| **RSAM** | Risk State Assessment Module | L1 | `risk.state.query` | M | Conducts real-time risk evaluation; defines parameters for veto thresholds (CMD-103). |
| **ATM** | Arbitration Trust Module | L4 | `arbitration.trust.index` | M | Generates the foundational Trust Score (CMD-101) for system components and input sources. |
| **MCRA** | Mandatory Constraint Resolution Agent | L4 | `conflict.resolution.agent` | M | Executes automated conflict resolution; calculates and reports high-level Risk Score (CMD-102). |

### PHASE 2: FEEDBACK, EVOLUTION & COMMITMENT (P-2)
*Focus: Efficacy projection (L3), final commitment (L6), monitoring, and adaptive planning (L7).*

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Role | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **PSR** | Projection & Synthesis Registry | L3 | `synthesis.simulation.data` | M | Registers efficacy simulation results used for L3 (Effectiveness) threshold checks. |
| **SDR** | System Diagnostic & Reporting | L3, L4 | `telemetry.raw.metrics` | M | Aggregate data point ingestion and distribution hub for TRP inputs required by CMD contracts. |
| **AEL** | Audit Event Logger | L5 | `audit.event.immutable` | R | Captures and immutably logs all critical state transitions, decisions, and compliance failures. |
| **SDE** | Self-Documentation Engine | L5 | `documentation.artifact.generate` | M | Ensures compliance with documentation standards and autonomously updates architecture guides and state descriptions (Manifest, README). |
| **RETV** | Real-Time Execution Vetting | L6 | `execution.runtime.vetting` | M | Monitors post-activation behavior against projected outcomes (Deployment Phase Vetting). |
| **TFM** | Testing Framework Manager | L6 | `validation.testing.harness` | M | Executes autonomous testing, validation, and vulnerability checks against new artifacts prior to L6 commitment. |
| **AMA** | Activation & Monitoring Agent | L6 | `activation.state.transition` | M | Manages transition of finalized Artifact Entry (AIA-ENTRY) into an active operational state (L6 commitment). |
| **CTM** | Capability Tracking Module | L7 | `kernel.capability.metrics` | M | Measures, reports, and tracks the progression of the 3 Core Kernel Capabilities (Navigation, Logic, Memory) and 5 architectural support dimensions. |
| **PRL** | Pattern Retention Layer | L7 | `memory.pattern.retrieval` | O | Stores learned patterns, evolutionary history, and cross-domain synthesis results to support Memory and transfer learning. |
| **EVM** | Emergence Validation Module | L7 | `emergent.discovery.validate` | M | Detects novel solutions (cross-domain synthesis), validates uniqueness, and executes the complete Emergence Protocol: **creation in /emergent**, detailed header documentation, cycle tagging, and manifest logging. |
| **NTS** | Navigator Targeting System | L7 | `navigation.selection.blacklist` | M | Executes strategic file selection across the 2,300+ repository, prioritizing files based on mission weighting, manages the Blacklist Mechanism, and implements the Adaptive Reset strategy when priorities are exhausted. |
| **LOE** | Learning Optimization Engine | L7 | `learning.optimization.adaptive` | M | Executes meta-learning strategies, monitors stagnation via CTM, and initiates Stagnation Recovery protocols (including partial blacklist clearance and **cross-domain pattern synthesis**), supporting Logic and Meta-Reasoning. |
| **NSHG** | Novelty Synthesis Hypothesis Generator | L7 | `creativity.hypothesis.generate` | M | Generates bold, non-incremental architectural hypotheses and creative integration patterns, fueling the Emergence Validation pipeline. |
| **ASP** | Adaptive Synthesis Planner | L7 | `adaptation.plan.design` | M | Designs optimal multi-cycle architectural modification plans (L7 Evolution), integrates PRL history, and ensures roadmap alignment with the prescribed **Maturity Progression** goals (Exploration, Integration, Optimization, Mastery). |