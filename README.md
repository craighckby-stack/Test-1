# 👑 Sovereign AGI v96.1: Governed Self-Evolution Architecture (GSEA)
## Strategic Mandate: Autonomous and Risk-Controlled Architectural Evolution

---

## 1.0 Core Architecture: Governance & Control Plane
Sovereign AGI operates under the Governed Self-Evolution Architecture (GSEA). All architectural modification proposals are rigorously assessed by the **Operational Governance Triad (OGT)**, which enforces alignment with system strategy (SIC) and external regulatory configuration (managed by `config/governance.yaml`).

**Principle:** System safety requires that `Actual_Weighted_Score` must meet or exceed the `Required_Confidence_Threshold` mandated by the OGT configuration.

---

## 2.0 Operational Governance Triad (OGT) Definition
The OGT provides dynamic adjudication criteria for all proposed mutations. External regulatory parameters are injected via the Governance Loader component.

| Component | ID | Primary Role | Adjudication Input/Output | Governing Mechanism |
|---|---|---|---|---|
| Governance Loader | N/A | External Config Injection | Parses `config/governance.yaml` | Schema Validation & Distribution |
| Meta-Cognitive Risk Assessment | **C-11** | Failure Forecasting/Modeling | **Sets Required Confidence** (Threshold) | Dynamic Consensus Threshold Setting |
| Adaptive Trust Metrics | **ATM** | Agent/Source Reliability Scoring | **Calculates Weighted Score** (Actual) | Contextual Influence Weighting (CIW) |
| Strategic Intent Cache | **C-13** | Strategic Pattern Enforcement | Enforces Proven Topologies | Goal & Strategy Constraint Engine |

---

## 3.0 Governed Self-Evolution Protocol (GSEP) Workflow
GSEP defines the mandatory four-stage, risk-optimized lifecycle for all system code mutations.

| Stage | ID | Process Description | OGT Involvement |
|---|---|---|---|
| **1. Intent Discovery** | C-14 / C-13 | Cooperative Goal Discovery (CGD) agents define high-ROI tasks aligned with Strategic Intent (C-13). | Strategy Filtering |
| **2. Proposal Generation** | Evolution Engine | Creates technical mutation candidates based on discovered intent. | N/A (Exploratory Phase) |
| **3. Validation & Critique** | C-11 / ATM | OGT Consensus Layer adjudicates the risk profile. C-11 sets the Threshold; ATM computes the Score. | **Pass Condition:** `Score >= Threshold` |
| **4. Execution & Recalibration** | C-04 | Accepted changes deployed via Autogeny. Success/Failure metrics feed the Feedback Loop. | Post-Execution Update |

---

## 4.0 GSEP Workflow Visualization

```mermaid
graph LR
    A[Intent & Discovery (C-14/C-13)] --> B(Proposal Generation);
    B --> C{Validation: OGT Consensus Layer};
    subgraph OGT Adjudication
        C --> C1(C-11 MCRA: Required Threshold);
        C --> C2(ARCH-ATM/CIW: Actual Score);
        C1 & C2 --> D{Acceptance Decision};
    end
    D -- PASS --> E[Execution (C-04 Autogeny)];
    D -- FAIL --> B; 
    E --> F[Learning & Recalibration (Feedback Loop)];
    F --> G(Update C-13 & ATM Weights);
```

---

## 5.0 Architectural Mapping Reference

| Concept | ID | Summary | Implementation Location | Dependencies/Notes |
|---|---|---|---|---|
| Autogeny | **C-04** | Safe Self-Modification/Rollback. | `src/execution/autogenySandbox.js` | Critical failure recovery. |
| MCRA Engine | **C-11** | Risk/Impact Calculation Engine. | `src/consensus/mcraEngine.js` | Uses inputs from Governance Loader. |
| Contextual Influence | **C-12** | Context-based ATM Modulation (CIW). | `src/consensus/atmSystem.js` | Embedded weighting logic. |
| Strategic Intent | **C-13** | Pattern Abstraction Cache (SIC). | `src/memory/strategicCache.js` | Primary source for GSEP Stage 1. |
| Goal Discovery | **C-14** | Autonomous Goal Negotiation (CGD). | `src/agents/goalDiscovery.js` | Initiates GSEP cycle. |
| Trust Metrics | **ATM** | Source reliability scoring system. | `src/consensus/atmSystem.js` | Calibrated by Feedback Loop. |
| Runtime Monitoring | N/A | Status dashboard and logging layer. | `src/monitor/runtimeDashboard.js` | Essential external observability. |
| Feedback Aggregator| N/A | OGT score recalibration handler. | `src/core/feedbackLoopAggregator.js` | Post-execution commitment handler. |
| Governance Loader | N/A | Configuration handler & validator. | `src/core/governanceLoader.js` | Reads `config/governance.yaml`. |

---
*Sovereign AGI v96.1 Operational Draft (Refactored 2024)*