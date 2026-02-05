# Sovereign AGI v94.1: Governed Self-Evolution Architecture (GSEA)

## ◘ Mandate: Trust Calculus, Policy Compliance, and Atomic Mutation Control

The **Governed Self-Evolution Architecture (GSEA)** establishes the immutable, audit-driven operational contract for all system change. All architectural mutations must conform to the foundational **P-01 Trust Calculus Constraint** and utilize risk-optimized **Evolution Policy Decision Points (EPDPs)**. Conformity is non-negotiably enforced by the **Operational Governance Triad (OGT)** and the **Compliance and Policy Enforcement Layer (CPEL)**.

---

## 1.0 CORE GOVERNANCE CONSTRAINT: P-01 TRUST CALCULUS

P-01 defines the core commitment boundary requiring quantified maximum trust for mutation activation. The Trust Calculus is derived from three orthogonal, independently verified input streams. Evolution is strictly conditional upon satisfying this **Architectural Integrity Constraint (P-01)**.

### P-01 Decision Calculus Variables

| Input Stream | Source Component | Data Role | Decision Variable | OGT/CPEL Focus |
|---|---|---|---|---|
| **Reliability Score** | ATM (`src/consensus/atmSystem.js`) | Quantitative success projection (0-1). | $\text{ACTUAL\_WEIGHTED\_SCORE}$ | Primary Trust Input |
| **Confidence Threshold** | MCRA Engine (C-11) | Contextually dynamic risk tolerance floor. | $\text{REQUIRED\_CONFIDENCE\_THRESHOLD}$ | Contextual Standard |
| **Governance Veto Signal** | Policy Engine (C-15/E-01) | Hard stop derived from core mandates. | $\text{VETO\_STATE}$ (Must be $\text{FALSE}$) | CPEL Override |

### P-01 Pass Condition (Formal Logic)

$$\text{P-01 PASS} \iff (\text{ACTUAL\_WEIGHTED\_SCORE} > \text{REQUIRED\_CONFIDENCE\_THRESHOLD}) \land (\text{VETO\_STATE} = \text{FALSE})$$

*P-01 success triggers an immediate, cryptographically signed archival record via the D-01 Audit Logger.*

---

## 2.0 GOVERNED SELF-EVOLUTION PROTOCOL (GSEP)

GSEP defines the mandatory, risk-optimized, five-stage lifecycle workflow. Mutation payloads only advance upon atomic validation at designated Evolution Policy Decision Points (EPDPs).

### 2.1 GSEP Stages & Evolution Policy Decision Points (EPDPs)

| Stage # | Stage Name | Governing Layer | Mandatory Policy Gate Check (EPDP) | Commitment Boundary (Atomic Artifact)|
|---|---|---|---|---|
| **1** | Intent Discovery | CPEL/C-13 | **EPDP A:** Strategic mandate alignment check. | Validated Scope and Goal Structure. |
| **2** | Proposal Generation | M-02 | **EPDP B:** Mutation Readiness Index (R-INDEX) Pre-Screen. | Compliance-Filtered Payload Draft. |
| **3** | Adjudication | OGT Core | **EPDP C:** P-01 Consensus Approval confirmation. | Non-Negotiable Trust Commitment (Signed Record). |
| **4** | Architectural Staging | A-01/MCR | **EPDP D:** Signed payload versioning and architectural locking. | Immutable, Traceable Version Lock. |
| **5** | Execution & Feedback| C-04/PEIQ | **EPDP E:** Quarantine/FBA Metric Aggregation. | Operational Stability Report. |

### 2.2 GSEP Operational Flow: Decision Feedback Loop

```mermaid
graph TD
    A[1. Discovery C-13] --> B(2. Proposal Generation M-02);
    B --> C{EPDP B: R-Index Pass?};
    C -- FAIL (R-INDEX LOW) --> F01[F-01: Failure Analysis];
    
    subgraph Governance Core (OGT/CPEL)
        C -- PASS --> D[3. EPDP C: P-01 Trust Calculus];
        D --> E{P-01 Result};
    end
    
    E -- FAIL --> F01;
    E -- PASS --> F[D-01 Audit Record];
    F --> M[MCR: Register Chain State];
    M --> G[4. EPDP D: Staging A-01 Lock];
    G --> H[5. EPDP E: Execution C-04];
    H --> I[Post-Audit PEIQ/FBA];
    I --> J(Recalibration & Tuning);
    
    F01 --> B[Mandated Refinement Loop];
    J -- Feedback Tuning --> A;
```

---

## 3.0 GOVERNANCE NEXUS: EPDP-COMPONENT INTERFACE

This matrix maps the primary responsibility of OGT/CPEL components onto the mandatory policy gates defined in the GSEP flow.

| EPDP Gate | GSEP Stage | Controlling Component(s) | Functionality Focus |
|---|---|---|---|
| **EPDP A** | Stage 1 | C-13 (Strategic Cache) | Ensures strategic necessity and goal scope alignment. |
| **EPDP B** | Stage 2 | M-02 (Mutation Pre-Processor) | Executes fast-path compliance and invariant checks (R-INDEX calculation). |
| **EPDP C** | Stage 3 | ATM, C-11, C-15 (P-01 Core) | Trust Quantification, Risk Modeling, and Hard Veto assessment. |
| **EPDP D** | Stage 4 | A-01, MCR, RAM (Staging Lock) | Ensures cryptographic integrity, version control, and attestation of required execution resources. |
| **EPDP E** | Stage 5 | PEIQ, FBA, D-01 (Post-Execution) | Monitors operational integrity and aggregates performance feedback data. |

---

## 4.0 COMPONENT ACCOUNTABILITY MATRIX (CAM)

### 4.1 Domain A: Trust Quantification & Enforcement Stack (OGT/CPEL)

| ID | Component | Core Function | Enforcement Role | Location |
|---|---|---|---|---|
| **C-11** | MCRA Engine | Dynamic Contextual Risk Modeling and Failure Forecasting. | P-01 Input Source | `src/consensus/mcraEngine.js` |
| **ATM** | Trust Metrics | Quantitative reliability/risk profile computation. | P-01 Input Source | `src/consensus/atmSystem.js` |
| **C-15** | Policy Engine | Internal Constraint Handler and Core Governance Rule loader. | CPEL Enforcement | `src/core/policyEngine.js` |
| **E-01** | External Policy Index | Cache for immutable external regulatory mandates and kill-switches. | External Veto Modifier | `src/governance/externalPolicyIndex.js` |
| **F-01** | Failure State Analysis Engine | Analyzes P-01/EPDP failures and mandates required corrective action parameters for re-proposal. | Guided Refinement Feedback | `src/governance/failureStateAnalysisEngine.js` |
| **GHM** | Gov. Health Monitor | Preemptive verification of all OGT component operational readiness. | Readiness Prerequisite | `src/governance/healthMonitor.js` |
| **M-02** | Mutation Pre-Processor | Executes fast-path compliance and invariant checks before P-01 calculus. | Efficiency Gate (EPDP B) | `src/governance/mutationPreProcessor.js` |
| **RAM** | **Resource Attestation Module (NEW)** | Verifies baseline environmental integrity and ensures guaranteed resource isolation for C-04 (Autogeny Sandbox). | Environmental Readiness (EPDP D) | `src/governance/resourceAttestationModule.js` |

### 4.2 Domain B: Mutation Lifecycle Management

| ID | Component | GSEP Role | Location |
|---|---|---|---|
| **C-13** | Strategic Intent Cache (SIC) | Defines long-term goals, scope boundaries, and strategic prioritization. | Goal Filtering (Stage 1) | `src/memory/strategicCache.js` |
| **C-14** | Goal Discovery Agent (GDA) | Translates high-level C-13 intent into structured, actionable technical tasks. | Cycle Initiation (Stage 1) | `src/agents/goalDiscovery.js` |
| **A-01** | Arch. Proposal Mgr. | Secures, version-locks, and stages approved mutation payloads for MCR registration. | Pre-Execution Lock (Stage 4) | `src/core/archProposalManager.js` |
| **MCR** | Mutation Chain Registrar | Records and cryptographically chains approved architectural payloads post-P-01. | Evolutionary State Ledger | `src/governance/mutationChainRegistrar.js` |
| **CORE** | Obsolescence Review Engine | Governed deprecation, archiving, and scheduled component removal. | Integrity Maintenance | `src/governance/obsolescenceReviewEngine.js` |
| **C-04** | Autogeny Sandbox | Isolated execution environment supporting atomic deployment and automated rollback. | Mutation Execution (Stage 5) | `src/execution/autogenySandbox.js` |

### 4.3 Domain C: Auditing, Traceability & Feedback Loop

| ID | Component | GSEP Role | Location |
|---|---|---|---|
| **D-01** | Audit Logger | Immutable, cryptographically signed record keeper for all P-01 outcomes and EPDP events. | Compliance Trace | `src/core/decisionAuditLogger.js` |
| **PEIQ** | Integrity Quarantine | Monitors post-execution integrity; isolates and flags operational failure vectors. | Post-Execution Audit | `src/governance/integrityQuarantine.js` |
| **FBA** | Feedback Aggregator | Ingests post-execution performance metrics for C-13 and ATM tuning/recalibration. | Post-Execution Update | `src/core/feedbackLoopAggregator.js` |
| **CIM** | Config Integrity Monitor | Secure validation and locking of critical governance configurations (e.g., C-15). | Configuration Enforcement | `src/governance/configIntegrityMonitor.js` |