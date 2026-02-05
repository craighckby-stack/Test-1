# SOVEREIGN AGI V97.0: CORE GOVERNANCE REGISTRY (GSEP & AIA Mandates)

## I. ARCHITECTURAL PRIMACY: ATOMIC IMMUTABILITY (AIA)

This registry defines the foundational requirements for the **Autonomous Operational Contract (AOC V97.0)**, mandating the **Atomic Immutable Architecture (AIA)** and enforcing the **Governing Self-Evolution Protocol (GSEP)**. All systemic evolution is pre-constrained by the Governance Constraint Orchestrator (GCO).

### A. AIA Mandate: The Irreversible State Commitment

AIA ensures system integrity by requiring all state mutations to be cryptographically attested and logged as irreversible transactions (D-01 Audit Log). Rollback capability is guaranteed via AEOR supervision.

| Metric | Specification | Enforcement Mechanism |
|:---|:---|:---|
| **Protocol Version** | V97.0 (Structural Stabilization) | **GCO Integration** (Systemic Pre-constraint) |
| **Commitment Gate** | P-01 Trust Calculus | **AIA Enforcement** (GSEP Stage 3 Mandate) |
| **Core Architecture**| Atomic Immutable Architecture (AIA) | MCR Hashing & Non-Repudiable Ledger |

### B. P-01 TRUST CALCULUS: The Irreversible Gate Checkpoint

P-01 is the mandatory high-fidelity gateway, administered by the Operational Governance Triad (OGT). A PASS condition requires strict mathematical consensus and zero policy infraction (S-03).

$$\text{P-01 PASS} \iff \begin{cases} \text{S-01}_{\text{Trust Projection (ATM)}} > \text{S-02}_{\text{Risk Floor (C-11)}} \\ \text{S-03}_{\text{Veto Condition (C-15)}} = \text{FALSE} \end{cases}$$

| Signal ID | Purpose | Source Components | Requirement for P-01 PASS |
|:---|:---|:---|:---|
| **S-01 (Trust Score)** | Predicted Efficacy of M-02 Payload. | ATM, TIAR | Must strictly exceed the S-02 Risk Floor. |
| **S-02 (Risk Floor)** | Dynamic Maximum Tolerance. | C-11, CRM, RCE | Provides the quantitative constraint ceiling. |
| **S-03 (Veto Flag)** | Mandatory Policy Compliance Check. | C-15, GRS, RSAM | Must be FALSE (No policy infraction detected). |

---

## II. GOVERNING SELF-EVOLUTION PROTOCOL (GSEP V97.0)

GSEP V97.0 defines the risk-minimized, atomic five-stage lifecycle for all system mutation, controlled via strict Evolution Policy Decision Points (EPDPs).

### A. GSEP Stages: Atomic Workflow

| Stage # | Name | Core Objective & Checkpoint | Required Artifact / Gate Function | Key Orchestrators |
|:---|:---|:---|:---|:---|
| **0 (Pre-GSEP)** | Constraint Orchestration | **GCO Integrity Check**. Formalizes intent and validates the GSEP sequence. | Governance Intent Declaration (GID) | GCO, SRM |
| **1** | Intent & Scoping | EPDP A (RSAM Vetting). Define requirements. | M-01 Intent Package | SRM, ASR, RSAM |
| **2** | Specification & Simulation | EPDP B (SMA/PSR Validation). Construct payload. | M-02 Payload Generation | MSU, PSR, SMA |
| **3** | Trust Adjudication (P-01) | EPDP C (P-01 Execution). **The Irreversible AIA Gate.** | D-01 Audit Log (TIAR Attested) | OGT, P-01, ATM, C-11 |
| **4** | Architectural Commitment | EPDP D (MCR/AIA Lock). Secure state change. | MCR Version-Lock & State Hashing | MCR, AEOR, RAM |
| **5** | Execution & Audit | EPDP E (C-04 Isolation). Deployment and validation. | Post-Audit Metrics (FBA/SEA) | C-04, AEOR, FBA |

### B. GSEP Operational Flow

```mermaid
graph TD
    subgraph Evolutionary_Feedback_Loop [AOC V97.0 GSEP Lifecycle]
        G(0. PRE-GSEP: Constraint Orchestration - GCO) --> A[1. SCOPING: M-01 Intent Package (RSAM)];
        A --> B(2. SPECIFICATION: M-02 Payload Drafting);
        B --> C{EPDP B: Schema & Simulation Validation?};
        
        C -- FAIL: Analyze --> F01[F-01: Failure Analysis/Recalibration];
        
        subgraph Commitment_Gate [3. P-01 IRREVERSIBLE TRUST ADJUDICATION]
            C -- PASS: Proceed --> D[D-01: Execute P-01 Calculus (TIAR Attestation)];
            D --> E{EPDP C: P-01 Pass/Fail?};
        end
        
        E -- FAIL: Abort & Log --> F01;
        E -- PASS: Commit --> M[4. COMMITMENT: MCR Version Lock (AEOR Control)];
        
        M --> I[5. EXECUTION: C-04 Isolated Deployment];
        I --> J[Post-Execution Audit (FBA/SEA)];
        J --> K(Feedback & Refinement Loop);

        F01 --> A;
        K --> G;
    end
```

---

## III. DEFINITIVE COMPONENT REGISTRY (SDM V97.0)

Mapping of core components, their functional focus, and mandatory stage alignment.

### III.A. GOVERNANCE & POLICY ENFORCEMENT

These components manage governance policies, policy integrity, and the S-03 Veto Check.

| ID | Component Name | Functional Focus | Location | Stage Scope |
|:---|:---|:---|:---|:---|
| **GCO** | Governance Constraint Orchestrator | Mandatory integrity barrier enforcing GSEP sequence for all policy changes. | `src/governance/orchestration/gco.js` | Stage 0 |
| **C-15** | Policy Engine | Executes the S-03 mandatory veto check based on GRS policies. | `src/core/policyEngine.js` | Stage 3 |
| **GRS** | Governance Rule Source | Immutable, version-controlled repository for core governance rules. | `src/governance/governanceRuleSource.js` | Foundation/3 |
| **RSAM** | Rule Set Attestation Manager | Attests the integrity and validity of proposed rule set changes (PDS compliance). | `src/governance/ruleSetAttestationManager.js` | Stage 1/3 |
| **SMA** | Schema Migration Adjudicator | Validates schema transition integrity for M-02 payloads before commitment. | `src/governance/schemaMigrationAdjudicator.js` | Stage 2 |

### III.B. CONSENSUS & ATTESTATION CORE (P-01 Inputs & Audit)

These components generate the critical S-01 (Trust) and S-02 (Risk) signals and record the outcome.

| ID | Component Name | Functional Focus | Location | Stage Scope |
|:---|:---|:---|:---|:---|
| **ATM** | Trust Metrics System | Calculates Quantitative Reliability Projection (S-01 Trust Score). | `src/consensus/atmSystem.js` | Stage 3 |
| **C-11** | MCRA Engine | Contextual Risk Modeling and Floor Calculation (S-02 Risk Floor). | `src/consensus/mcraEngine.js` | Stage 3 |
| **TIAR** | Telemetry Input Attestation Registrar | Cryptographically attests all P-01 input data (S-01/S-02) integrity. | `src/consensus/telemetryAttestationRegistrar.js` | Stage 3 |
| **CRM** | Contextual Runtime Monitor | Feeds high-fidelity, real-time telemetry into C-11 for dynamic S-02 calculation. | `src/telemetry/contextualRuntimeMonitor.js` | Stage 3 |
| **RCE** | Resource Constraint Evaluator | Provides dynamic resource availability context for S-02 calculation. | `src/governance/resourceConstraintEvaluator.js` | Stage 3 |
| **D-01** | Decision Audit Logger | Immutable record keeper for P-01 Calculus decisions and state transition logs. | `src/core/decisionAuditLogger.js` | Stage 3/4 |

### III.C. EVOLUTION ORCHESTRATION & EXECUTION

These components manage the GSEP lifecycle state transitions, commitment lock, and deployment.

| ID | Component Name | Functional Focus (Code Evolution Lifecycle) | Location | Stage Scope |
|:---|:---|:---|:---|:---|
| **AEOR** | Atomic Execution & Orchestration Registrar | Controls P-01 PASS transition, manages MCR lock, and mandates AIA rollback capability. | `src/governance/orchestration/aeor.js` | Stage 4/5 |
| **MCR** | Mutation Commitment Registrar | Executes the MCR Version-Lock cryptographic attestation of the new state. | `src/infrastructure/mutationCommitmentRegistrar.js` | Stage 4 |
| **SRM** | Systemic Requirement Modulator | Translates internal requirements/feedback into M-01 Intent Packages. | `src/synthesis/systemicRequirementModulator.js` | Stage 1 |
| **PSR** | Pre-Commit Simulation Runner | Utility for rigorously testing M-02 payload integrity and validating S-01 input. | `src/governance/preCommitSimulationRunner.js` | Stage 2 |
| **C-04** | Autogeny Sandbox | Isolated, monitored deployment environment with mandatory rollback capability. | `src/execution/autogenySandbox.js` | Stage 5 |
| **FBA** | Feedback Aggregator | Ingests post-performance metrics for self-tuning/feedback loop input. | `src/core/feedbackLoopAggregator.js` | Stage 5 |

---

## IV. CORE GLOSSARY (V97.0 Ontology)

| Initialism | Definition | Functional Pillar | GSEP Stage Scope |
|:---|:---|:---|:---|:---|
| **AOC** | Autonomous Operational Contract | GOVERNANCE | Foundation |
| **GSEP** | Governing Self-Evolution Protocol | GOVERNANCE | All |
| **AIA** | Atomic Immutable Architecture | GOVERNANCE | Commitment |
| **GCO** | Governance Constraint Orchestrator | GOVERNANCE | Stage 0 |
| **AEOR** | Atomic Execution & Orchestration Registrar | GOVERNANCE | Commitment/Execution |
| **RSAM** | Rule Set Attestation Manager | GOVERNANCE | Policy Vetting |
| **P-01** | Trust Calculus | CONSENSUS | Stage 3 |
| **OGT** | Operational Governance Triad | GOVERNANCE | Stage 3 |
| **MCR** | Mutation Commitment Registrar | INFRASTRUCTURE | Stage 4 |
| **TIAR** | Telemetry Input Attestation Registrar | CONSENSUS | Stage 3 |
| **EPDP** | Evolution Policy Decision Point | GOVERNANCE | Inter-Stage Control |