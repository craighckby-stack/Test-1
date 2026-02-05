# 👑 Sovereign AGI v95.0: Governed Self-Evolution Protocol (GSEP)
## Mission: Autonomous Code Evolution via Scaled Governance

---

## ➣️ Pillar 0: The Architectural Mandate (Formalized Exploration)
AGI progress is strictly managed through the conversion of high-variance exploratory concepts (hallucination) into validated, production-ready systems. This mandates regulated architectural self-refinement, governed entirely by the Operational Governance Triad.

**Strategic Principle**: Every system modification must be weighted, forecasted for risk, and aligned with the Strategic Intent Cache (SIC).

---

## ⛯️ Operational Governance Triad (OGT): The Regulatory Contract

Configuration thresholds are dynamically managed externally via `config/governance.yaml` (see proposed scaffold).

| ID | Component | Operational Goal | Governing Mechanism | OGT Function |
|---|---|---|---|---|
| **AGI-C-11** | Meta-Cognitive Risk Assessment (MCRA) | Impact modeling and failure forecasting. | Dependency-based Consensus Threshold Setting. | **Sets Required Confidence** |
| **ARCH-ATM** | Adaptive Trust Metrics | Agent reliability scoring & source weighting. | Contextual Influence Weighting (CIW: AGI-C-12). | **Calculates Weighted Confidence Score** |
| **AGI-C-13** | Strategic Intent Cache (SIC) | Strategy enforcement, pattern abstraction, and bias introduction. | Recalls analysis towards proven topologies. | **Enforces High-Level Strategy** |

---

## ↺️ The Governed Self-Evolution Protocol (GSEP)
The formalized four-stage evolution cycle, optimized for risk/reward based on live OGT adjudication.

1.  **Intent & Discovery (AGI-C-14):** Cooperative Goal Discovery (CGD) agents, guided by the **SIC (AGI-C-13)**, define strategic direction and high-ROI tasks.
2.  **Proposal Generation:** The `Evolution Engine` generates mutation candidates (the exploratory phase).
3.  **Critique & Validation (OGT Intervention):** The Consensus Layer adjudicates the proposal based on externally defined thresholds.
    *   **Threshold Set:** **MCRA (AGI-C-11)** dictates the required confidence level (`MCRA_ACCEPT_THRESHOLD`).
    *   **Score Calculated:** **ATM (ARCH-ATM)**, modulated by **CIW (AGI-C-12)**, calculates the actual weighted confidence score (`ACTUAL_SCORE`).
    *   *Decision*: If `ACTUAL_SCORE >= MCRA_ACCEPT_THRESHOLD`, proceed to execution.
4.  **Execution & Learning:** Validated code deploys via **Autogeny (AGI-C-04)**. Success patterns are committed to the SIC, and OGT scoring metrics are recalibrated via the `Feedback Loop Aggregator`.

---

## ⌘️ Core GSEP Flow & Governance Intervention

```mermaid
graph LR
    A[Intent & Discovery (CGD/SIC)] --> B(Proposal Generation);
    B --> C{Consensus Layer Adjudication};
    subgraph Operational Governance Triad Check
        C --> C1(AGI-C-11 MCRA: Reads Threshold);
        C --> C2(ARCH-ATM/AGI-C-12 CIW: Computes Score);
        C1 & C2 --> D{Validation Decision};
    end
    D -- Pass/Accept --> E[Execution (AGI-C-04 Autogeny)];
    D -- Fail/Reject --> B; 
    E --> F[Learning & Recalibration];
    F --> G(Update ATM/SIC);
```

---

## ␨ Foundational Concepts & Mapping Reference

| ID | Concept | Summary | Implementation Location |
|---|---|---|---|
| **AGI-C-04** | Autogeny | Safe Self-Modification & Rollback Systems | `src/execution/autogenySandbox.js` |
| **AGI-C-11** | MCRA | Risk/Impact Calculation | `src/consensus/mcraEngine.js` |
| **AGI-C-12** | CIW | Context-Based ATM Modulation | Consensus Layer Weighting Logic |
| **AGI-C-13** | SIC | Pattern Abstraction Cache | `src/memory/strategicCache.js` |
| **AGI-C-14** | CGD | Autonomous Goal Negotiation | `src/agents/goalDiscovery.js` |
| **ARCH-ATM** | Adaptive Trust Metrics | Source reliability scoring | `src/consensus/atmSystem.js` |

---

## 💻 Implementation Files & Status
*   **Governance Contract:** `config/governance.yaml` (Critical External Thresholds)
*   **Trust Calibration:** `src/consensus/atmSystem.js`
*   **Risk Assessment:** `src/consensus/mcraEngine.js`
*   **Strategy Cache:** `src/memory/strategicCache.js`
*   **Feedback Loop:** `src/core/feedbackLoopAggregator.js`
*   **Runtime Monitoring:** `src/monitor/runtimeDashboard.js`

---
_Sovereign AGI v95.0 Operational Draft. (Evolved from v94.3, 2024)_