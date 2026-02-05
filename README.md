# 👑 Sovereign AGI v98.1: Autonomous Governance Architecture (GSEA)

## Strategic Mandate: Compliance, Auditable Integrity, and Risk-Managed Evolution

The Governed Self-Evolution Architecture (GSEA) mandates that all system mutations must be approved by the **Operational Governance Triad (OGT)** and strictly conform to immutable policies defined by the **Compliance and Policy Enforcement Layer (CPEL)**.

---

## 1.0 The P-01 Constraint: Core Adjudication Loop

System evolution is fundamentally governed by the **Architectural Integrity Constraint (P-01)**, enforced by the OGT. This ensures that changes only occur when the system has maximum confidence in the outcome, measured across three inputs:

### P-01: Risk Threshold Requirement

| Assessment Point | Mechanism | Requirement |
|---|---|---|
| **Actual Reliability Score** | Trust Metrics (ATM/C-12) | Must calculate a quantitative reliability score of the proposed payload. |
| **Required Confidence** | MCRA Engine (C-11) | Sets the baseline risk tolerance threshold required for approval. |
| **Consensus Approval** | OGT Decision | `Actual_Weighted_Score` (ATM) **>** `Required_Confidence_Threshold` (C-11) |

All successful P-01 outcomes result in an immutably signed log via D-01.

---

## 2.0 Governed Self-Evolution Protocol (GSEP) Workflow

GSEP defines the mandatory, five-stage, risk-optimized lifecycle, ensuring CPEL and OGT requirements are met sequentially and audibly.

### 2.1 Workflow Stages & Gates

| Stage | Process Description | Primary Component Role | Mandatory Gate |
|---|---|---|---|
| **1. Intent Discovery** | Agents (C-14) define tasks strictly aligned with Strategic Intent (C-13). | Goal Discovery Agent (C-14) | **CPEL Gate:** C-13 Scope Check. |
| **2. Proposal Generation** | The Evolution Engine generates technical changes, filtered by CPEL policies (C-15). | Policy Engine (C-15) | **CPEL Gate:** C-15 Policy Filter. |
| **3. Validation & Adjudication** | The OGT checks GHM health, verifies P-01 criteria, and issues the decision (D-01). | OGT Core (C-11, ATM, GHM) | **OGT Gate:** P-01 Consensus Approval. |
| **4. Architectural Staging** | Proposal Manager (A-01) secures, version-locks, and stages the accepted payload for execution. | Arch. Proposal Mgr. (A-01) | Integrity Lock Envelope. |
| **5. Execution & Feedback**| Change deployed (C-04); metrics feed FBA/PEIQ for post-execution governance and recalibration. | Autogeny Sandbox (C-04), FBA, PEIQ | Completion Signal/Quarantine Trigger. |

### 2.2 GSEP Visualization (P-01 Centrality)

```mermaid
graph TD
    A[1. Discovery C-14/C-13] --> B(2. Proposal Generation);
    B --> C{GHM: Governance Ready?};
    C -- YES --> D{3. OGT Validation (P-01)};
    C -- NO --> A; 

    subgraph OGT Core Adjudication
        D --> D1(C-11 Threshold);
        D --> D2(ATM/C-12 Score);
        D --> D3(C-15 Veto Check);
        D1 & D2 & D3 --> E{Decision: P-01 Pass};
    end
    
    E -- FAIL --> B; 
    E -- PASS --> F[D-01 Audit Logger];
    F --> G[4. Architectural Staging A-01];
    G --> H[5. Execution C-04];
    H --> I[FBA/PEIQ Post-Execution Governance];
    I --> J(Recalibrate C-13/ATM);
```

---

## 3.0 Architecture Register: Functional Planes

Components are grouped by their mandated role in supporting P-01 adjudication, compliance, or evolutionary operation.

### 3.1 Governance & Adjudication Plane (OGT Core)

These modules define, enforce, and log all mandatory compliance checks (P-01).

| ID | Component | Summary | Layer Role | Critical Output | Location |
|---|---|---|---|---|---|
| **C-11** | MCRA Engine | Failure Forecasting & Risk Modeling. | P-01 Input | Required Threshold. | `src/consensus/mcraEngine.js` |
| **ATM** | Trust Metrics | Quantitative Reliability Scoring System. | P-01 Input | Actual Score. | `src/consensus/atmSystem.js` |
| **C-12** | Contextual Influence | Dynamic scoring factors feeding into the ATM system. | ATM Modifier | Embedded Weighting Logic. | `src/consensus/atmSystem.js` |
| **C-15** | Policy Engine | External Constraint & Regulatory Handler (`config/governance.yaml`). | CPEL Enforcement | Global Veto Signal. | `src/core/policyEngine.js` |
| **GHM** | Gov. Health Monitor | Preemptive verification of OGT component readiness. | OGT Prerequisite | Governance Readiness Signal (GRS). | `src/governance/healthMonitor.js` |

### 3.2 Integrity and Auditing Plane

| ID | Component | Summary | GSEP Role | Location |
|---|---|---|---|---|
| **D-01** | Audit Logger | Immutable record keeper for all OGT consensus outcomes. | Compliance Trace | Signed Decision Log. | `src/core/decisionAuditLogger.js` |
| **PEIQ** | Integrity Quarantine (NEW) | Monitors post-execution integrity; isolates and flags failed payloads. | Post-Execution Audit | `src/governance/integrityQuarantine.js` |
| **FBA** | Feedback Aggregator | Handles post-execution metric ingestion and recalibration signals. | Post-Execution Update | `src/core/feedbackLoopAggregator.js` |

### 3.3 Execution & Staging Plane

These modules manage the workflow stages, proposal preparation, and environment integrity.

| ID | Component | Summary | GSEP Role | Location |
|---|---|---|---|---|
| **C-13** | Strategic Intent Cache (SIC) | Defines system goals and permissible evolution scope. | Goal Filtering (Stage 1) | `src/memory/strategicCache.js` |
| **C-14** | Goal Discovery Agent (CGD) | Negotiates and translates C-13 intent into technical tasks. | Cycle Initiation (Stage 1) | `src/agents/goalDiscovery.js` |
| **A-01** | Arch. Proposal Mgr. | Secures, version-locks, and stages accepted payloads. | Pre-Execution Lock (Stage 4) | `src/core/archProposalManager.js` |
| **C-04** | Autogeny Sandbox | Isolated execution environment supporting atomic deployment/rollback. | Mutation Execution (Stage 5) | `src/execution/autogenySandbox.js` |