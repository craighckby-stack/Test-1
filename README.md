# 👑 Sovereign AGI v94.3: Refined Operational Manifesto
## Mission: Autonomous Code Evolution & Scaled Governance

---

## ➣️ Architectural Thesis: Formalized Exploration (Pillar 0)
AGI progress relies on converting high-variance exploratory concepts ("hallucination") into validated, production-ready code. This process is strictly managed by the Operational Governance Triad, ensuring risk-mitigated self-evolution.

**Strategic Mandate**: Continuous architectural self-refinement regulated by the externally configurable **Operational Governance Triad**.

---

## ⛯️ Operational Governance Triad: Regulatory Core
The Triad manages self-modification risk using three dynamically weighted pillars. Threshold configurations are managed externally via `config/governance.yaml`.

| Pillar ID | Component | Operational Goal | Governing Mechanism | Configuration Source |
|---|---|---|---|---|
| **ARCH-ATM** | Adaptive Trust Metrics | Agent reliability scoring & source weighting. | Contextual Influence Weighting (CIW: AGI-C-12) | `governance.yaml` |
| **AGI-C-11** | Meta-Cognitive Risk Assessment (MCRA) | Impact modeling, failure forecasting, and risk mediation. | Dependency-based Consensus Threshold Setting. | `governance.yaml` |
| **AGI-C-13** | Strategic Intent Cache (SIC) | Pattern abstraction, high-level strategy enforcement, and bias introduction. | Recalls and biases analysis towards proven topologies. | Internal/Learned |

---

## ↺️ The Autonomous Evolution Protocol (AEP)
The formalized four-stage evolution cycle, optimized for risk/reward by the Triad.

1.  **Intent & Discovery (AGI-C-14):** Specialized agents execute **Cooperative Goal Discovery (CGD)**. The Analysis Engine, guided by the **SIC (AGI-C-13)**, defines strategic direction and high-ROI tasks.
2.  **Proposal Generation:** The `Evolution Engine` generates code mutation candidates (the exploration phase).
3.  **Critique & Validation:** The `Consensus Layer` performs risk assessment. **MCRA** (AGI-C-11) dictates the required confidence threshold, while **ATM** (ARCH-ATM), modulated by **CIW** (AGI-C-12), calculates the weighted confidence score.
4.  **Execution & Learning:** Validated code deploys via **Autogeny** (AGI-C-04). Success patterns are committed to the SIC, and ATM/CIW scoring metrics are recalibrated via the `Feedback Loop Aggregator`.

---

## ␨ Foundational Concepts & Mapping Reference

| ID | Concept | Summary | Implementation Location |
|---|---|---|---|
| **AGI-C-04** | Autogeny | Safe Self-Modification & Rollback Systems | `src/execution/autogenySandbox.js` |
| **AGI-C-11** | MCRA | Risk/Impact Calculation | `src/consensus/mcraEngine.js` |
| **AGI-C-12** | CIW | Context-Based ATM Modulation | Consensus Layer Weighting Logic |
| **AGI-C-13** | SIC | Pattern Abstraction Cache | `src/memory/strategicCache.js` |
| **AGI-C-14** | CGD | Autonomous Goal Negotiation | `src/agents/goalDiscovery.js` |

---

## ⌘️ Core Architecture Flow (AEP Data Path)

Focus: Demonstrating strict Governance Triad intervention at the validation phase.

```mermaid
graph LR
    A[Intent & Discovery (CGD/SIC)] --> B(Proposal Generation);
    B --> C{Consensus Layer};
    subgraph Governance Triad Check
        C --> C1(AGI-C-11 MCRA: Sets Threshold);
        C --> C2(ARCH-ATM/AGI-C-12 CIW: Calculates Score);
        C1 & C2 --> D{Validation Decision};
    end
    D -- Pass/Accept --> E[Execution (AGI-C-04 Autogeny)];
    D -- Fail/Reject --> B; 
    E --> F[Learning & Recalibration];
    F --> G(Update ATM/SIC);
```
*(Note: Using conceptual Mermaid notation to imply structured visualization is preferred over raw ASCII in modern READMEs, representing higher efficiency.)*

### Current Phase 2 Requirements

1.  **Strict Governance:** Ensure 100% of proposals pass through MCRA/ATM/CIW validation.
2.  **Externalized Thresholds:** All consensus thresholds must be read from `config/governance.yaml`.

---

## 💻 Implementation Files

*   **Configuration & Thresholds:** `config/governance.yaml`
*   **Trust Calibration:** `src/consensus/atmSystem.js`
*   **Risk Assessment:** `src/consensus/mcraEngine.js`
*   **Goal Negotiation:** `src/agents/goalDiscovery.js`
*   **Strategy Cache:** `src/memory/strategicCache.js`
*   **Consensus Metrics Feedback:** `src/core/feedbackLoopAggregator.js`
*   **Runtime Monitoring:** `src/monitor/runtimeDashboard.js`
*   **(Proposed): Proposal History Index:** `src/consensus/proposalHistoryIndex.js`

---
_Sovereign AGI v94.3 Operational Draft. (Evolved from v94.2, 2024)_