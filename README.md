# 👑 Sovereign AGI v96.0: Governed Self-Evolution Architecture (GSEA)
## Mission: Autonomous and Risk-Controlled Architectural Evolution

---

## 1.0 The Architectural Mandate (Governance Principle)
All exploratory concepts (hallucinations) are subjected to mandatory, formal conversion steps before integration. System modification is a highly regulated process governed by the Operational Governance Triad (OGT).

**Principle:** Conversion requires verified alignment with the Strategic Intent Cache (SIC) and a forecast risk acceptable to the OGT thresholds.

---

## 2.0 Operational Governance Triad (OGT)
External configuration and regulatory thresholds are managed dynamically via `config/governance.yaml`. The OGT dictates the acceptance criteria for all evolutionary proposals.

| Component | ID | Operational Goal | OGT Function | Governing Mechanism |
|---|---|---|---|---|
| Meta-Cognitive Risk Assessment | **C-11** | Failure forecasting and impact modeling. | **Sets Required Confidence** (Threshold) | Consensus Threshold Setting (Dynamic) |
| Adaptive Trust Metrics | **ATM** | Agent/source reliability scoring. | **Calculates Weighted Score** (Actual) | Contextual Influence Weighting (CIW) |
| Strategic Intent Cache | **C-13** | Strategy enforcement and pattern abstraction. | **Enforces High-Level Strategy** | Recalls analysis towards proven topologies |

---

## 3.0 Governed Self-Evolution Protocol (GSEP)
The mandated four-stage lifecycle ensures risk-optimized code mutation based on real-time OGT adjudication.

### 3.1 GSEP Stages
1.  **Intent Discovery (C-14):** Cooperative Goal Discovery (CGD) agents, guided by C-13 (SIC), define high-ROI strategic tasks.
2.  **Proposal Generation:** The Evolution Engine creates mutation candidates (Exploratory Phase).
3.  **Validation & Critique (OGT Intervention):** The Consensus Layer adjudicates the risk and trustworthiness of the proposal.
    *   C-11 (MCRA) provides `Required_Threshold`.
    *   ATM/CIW computes the `Actual_Weighted_Score`.
    *   *Decision:* Acceptance requires `Actual_Weighted_Score >= Required_Threshold`.
4.  **Execution & Recalibration:** Accepted changes are deployed via C-04 (Autogeny). Success patterns update C-13 (SIC), and OGT metrics recalibrate via the Feedback Aggregator.

---

## 4.0 GSEP Workflow Visualization

```mermaid
graph LR
    A[Intent & Discovery (C-14/C-13)] --> B(Proposal Generation);
    B --> C{Validation: OGT Consensus Layer};
    subgraph OGT Adjudication
        C --> C1(C-11 MCRA: Get Threshold);
        C --> C2(ARCH-ATM/CIW: Compute Score);
        C1 & C2 --> D{Acceptance Decision};
    end
    D -- PASS --> E[Execution (C-04 Autogeny)];
    D -- FAIL --> B; 
    E --> F[Learning & Recalibration];
    F --> G(Update C-13 & ATM);
```

---

## 5.0 Architecture Mapping Reference

| Concept | ID | Summary | Implementation Location | Dependencies/Notes |
|---|---|---|---|---|
| Autogeny | **C-04** | Safe Self-Modification/Rollback. | `src/execution/autogenySandbox.js` | Critical failure recovery. |
| MCRA Engine | **C-11** | Risk/Impact Calculation. | `src/consensus/mcraEngine.js` | Driven by external governance thresholds. |
| Contextual Influence | **C-12** | Context-based ATM Modulation (CIW). | `src/consensus/atmSystem.js` | Logic embedded within ATM system. |
| Strategic Intent | **C-13** | Pattern Abstraction Cache (SIC). | `src/memory/strategicCache.js` | Key source for GSEP Stage 1 direction. |
| Goal Discovery | **C-14** | Autonomous Goal Negotiation (CGD). | `src/agents/goalDiscovery.js` | Initiates the GSEP cycle. |
| Trust Metrics | **ATM** | Source reliability scoring. | `src/consensus/atmSystem.js` | Calibrated by Feedback Loop. |
| Runtime Monitoring | N/A | Status dashboard and logging. | `src/monitor/runtimeDashboard.js` | Essential for external observability. |
| Feedback Aggregator| N/A | OGT score recalibration. | `src/core/feedbackLoopAggregator.js` | Post-execution commitment handler. |
| Governance Contract| N/A | External Threshold Configuration. | `config/governance.yaml` | Requires schema validation. |

---
*Sovereign AGI v96.0 Operational Draft (Refactored 2024)*