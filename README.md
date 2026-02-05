# 👑 Sovereign AGI v98.1: Governed Self-Evolution Architecture (GSEA)
## Strategic Mandate: Compliance-Driven & Auditable Architectural Evolution

---

## 1.0 Core Constraint Layers (CPEL & OGT)

System integrity and compliance are enforced by two permanent regulatory structures that gate the mandatory five-stage GSEA lifecycle.

### 1.1 Compliance and Policy Enforcement Layer (CPEL)
The persistent filter enforcing high-level, static, and dynamic policy bounds (C-13, C-15). No proposal may proceed if it violates the CPEL.

### 1.2 Operational Governance Triad (OGT)
The primary risk adjudication body. The OGT decision is central to GSEP Stage 3 and mandates the strict adherence to the **Architectural Integrity Constraint (P-01)**.

#### Constraint P-01: Architectural Integrity
System mutation is permitted only if the risk model assessment finds:
`Actual_Weighted_Score` (from ATM/C-12) **>** `Required_Confidence_Threshold` (from C-11 MCRA).
All final OGT decisions must be immutably signed and logged (D-01).

---

## 2.0 GSEA Component Register: Functional Planes

Components are grouped by their mandated role in enforcing governance or facilitating evolutionary operations.

### 2.1 Governance Plane (OGT Core & CPEL)

These modules define, enforce, and log all mandatory compliance checks (P-01).

| ID | Component | Summary | Layer Role | Critical Output | Location |
|---|---|---|---|---|---|
| **C-11** | MCRA Engine | Failure Forecasting & Risk Modeling. | Risk Adjudicator | Sets `Required Threshold` (P-01 Input). | `src/consensus/mcraEngine.js` |
| **ATM** | Trust Metrics | Quantitative Reliability Scoring System. | Scoring Mechanism | Calculates `Actual Score` (P-01 Input). | `src/consensus/atmSystem.js` |
| **C-12** | Contextual Influence | Dynamic scoring factors feeding into the ATM system. | ATM Modifier | Embedded Weighting Logic. | `src/consensus/atmSystem.js` |
| **C-15** | Policy Engine | External Constraint & Regulatory Handler (`config/governance.yaml`). | CPEL Enforcement | Global Veto Signal / Constraint Mask. | `src/core/policyEngine.js` |
| **D-01** | Audit Logger | Immutable record keeper for all OGT consensus outcomes. | Compliance Trace | Signed Decision Log. | `src/core/decisionAuditLogger.js` |
| **GHM** | Governance Health Monitor (NEW) | Preemptive verification of OGT component readiness and integrity. | OGT Prerequisite | Governance Readiness Signal (GRS). | `src/governance/healthMonitor.js` |

### 2.2 Execution & Staging Plane

These modules manage the workflow stages, proposal preparation, and environment integrity.

| ID | Component | Summary | GSEP Role | Location |
|---|---|---|---|---|
| **C-13** | Strategic Intent Cache (SIC) | Defines system goals and permissible evolution scope. | Goal Filtering (Stage 1) | `src/memory/strategicCache.js` |
| **C-14** | Goal Discovery Agent (CGD) | Negotiates and translates C-13 intent into technical tasks. | Cycle Initiation (Stage 1) | `src/agents/goalDiscovery.js` |
| **A-01** | Arch. Proposal Mgr. | Secures, version-locks, and stages accepted payloads. | Pre-Execution Lock (Stage 4) | `src/core/archProposalManager.js` |
| **C-04** | Autogeny Sandbox | Isolated execution environment supporting atomic deployment/rollback. | Mutation Execution (Stage 5) | `src/execution/autogenySandbox.js` |

### 2.3 Feedback Plane

| ID | Component | Summary | GSEP Role | Location |
|---|---|---|---|---|
| **FBA** | Feedback Aggregator | Handles post-execution metric ingestion and recalibration signals. | Post-Execution Update | `src/core/feedbackLoopAggregator.js` |

---

## 3.0 Governed Self-Evolution Protocol (GSEP) Workflow

GSEP defines the mandatory five-stage, risk-optimized lifecycle, ensuring CPEL and OGT requirements are met sequentially.

| Stage | Process Description | Mandatory Gates | Output Artifact |
|---|---|---|---| 
| **1. Intent Discovery** | Agents (C-14) define tasks aligned strictly with Strategic Intent (C-13). | **CPEL Gate:** C-13 Scope Check. | Candidate Intent Payload |
| **2. Proposal Generation** | The Evolution Engine generates optimized technical changes, pre-filtered by C-15. | **CPEL Gate:** C-15 Policy Filter. | Unvalidated Proposal |
| **3. Validation & Critique** | **OGT Core Adjudication:** Checks GHM/GRS, then verifies P-01 (`Score > Threshold`). C-15 Veto check. | **OGT Gate:** P-01 Consensus Approval. | Signed Decision Log (D-01) |
| **4. Architectural Staging** | Proposal Manager (A-01) stages the validated payload, creating the atomic execution envelope. | Integrity Lock | Atomic Execution Envelope |
| **5. Execution & Feedback**| Change deployed (C-04); performance metrics feed FBA/OGT for cycle recalibration. | Completion Signal | Recalibration Signal |

---

## 4.0 GSEP Workflow Visualization (Enhanced P-01 Focus)

```mermaid
graph TD
    A[1. Discovery C-14/C-13] --> B(2. Proposal Generation);
    B --> C{GHM Check: Governance Ready?};
    C -- YES --> D{3. OGT Validation (P-01)};
    C -- NO --> A; 

    subgraph OGT Core Adjudication
        D --> D1(C-11 MCRA Threshold);
        D --> D2(ATM/C-12 Actual Score);
        D --> D3(C-15 Policy Veto);
        D1 & D2 & D3 --> E{Decision: P-01 Pass};
    end
    
    E -- FAIL --> B; 
    E -- PASS --> F[D-01 Audit Logger];
    F --> G[4. Architectural Staging A-01];
    G --> H[5. Execution C-04];
    H --> I[FBA Aggregation];
    I --> J(Recalibrate C-13/ATM);
```