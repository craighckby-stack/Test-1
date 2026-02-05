# SOVEREIGN AGI V97.1: CORE GOVERNANCE REGISTRY (README)

This registry defines the core architecture and mandates of the **Autonomous Operational Contract (AOC V97.1)**. Systemic integrity is enforced through three pillars: the **Governing Self-Evolution Protocol (GSEP V97.1)**, the **Atomic Immutable Architecture (AIA)**, and supervision by the Governance Constraint Orchestrator (GCO).

---

## I. GOVERNING SELF-EVOLUTION PROTOCOL (GSEP V97.1)

GSEP V97.1 establishes the atomic, six-stage lifecycle for all system mutation, rigorously defining the risk-minimized path from intent to commitment. All mutations are subject to strict adherence to mandatory Evolution Policy Decision Points (EPDPs) and culminate in the irreversible **P-01 Trust Calculus** gate.

### A. GSEP Stages: Atomic Workflow Definition

(Refined to harmonize with the architectural requirement for explicit structural pre-validation (PSIM) before resource-intensive simulation.)

| Stage # | Stage Name | Core Objective & Gate Function | Governance Control (EPDP) | Key Artifact | Key Orchestrators |
|:---|:---|:---|:---|:---|:---|
| **0** | Constraint & Initialization | **GCO/GIRAM Integrity Check**. Formalize intent; validate prerequisite governance state. | N/A (Pre-GSEP Gate) | Governance State Hash (GSH) | GCO, GIRAM |
| **1** | Intent & Scoping | Translate requirements into M-01 scope definition and initial structural vetting. | EPDP A (RSAM Vetting) | M-01 Intent Package | SRM, ASR, RSAM |
| **1.5** | **Structural Integrity Check** | PSIM validation of proposed payload structure against AIA schema requirements. | PSIM Gate Check | Structural Integrity Report | **PSIM** |
| **2** | Specification & Simulation | Construct M-02 payload; rigorously test operational integrity using PSR. | EPDP B (PSR Validation) | M-02 Payload Generation | MSU, PSR, SMA |
| **3 (AIA Lock)** | Trust Adjudication (P-01) | **EPDP C: The Irreversible Commitment Gate.** Execute P-01 calculus based on attested metrics. | EPDP C (P-01 Pass/Fail) | D-01 Audit Log (TIAR Attested) | OGT, P-01, ATM, C-11 |
| **4** | Architectural Commitment | Cryptographically attest and lock the new immutable architectural state. | EPDP D (MCR Lock) | MCR Version-Lock & State Hashing | MCR, AEOR, RAM |
| **5** | Execution & Audit | Secure, isolated deployment (C-04), post-audit validation, and feedback ingestion. | EPDP E (C-04 Isolation) | Post-Audit Metrics (FBA/SEA) | C-04, AEOR, FBA |

### B. Evolution Policy Decision Points (EPDPs) Mandates

| EPDP | Mandatory Gate Function | Triggering Components/Artifacts |
|:---|:---|:---|
| **EPDP A** | Compliance Vetting (M-01) | RSAM confirmation of Intent Package adherence to GRS. |
| **EPDP B** | Runtime Integrity Assurance | PSR successful simulation trace for M-02 payload. |
| **EPDP C** | Irreversible Trust Commitment | P-01 Calculus result must meet S-01/S-02/S-03 criteria. |
| **EPDP D** | Cryptographic State Locking | MCR confirms state hash registration and immutability lock. |
| **EPDP E** | Operational Environment Isolation | C-04 Sandbox guarantees zero-side-effect deployment integrity. |

### C. GSEP Operational Flow Diagram & Error Handling

```mermaid
graph TD
    subgraph Evolutionary_Feedback_Loop [AOC V97.1 GSEP Lifecycle]
        G(0. INIT: GIRAM Governance Integrity Check) --> A[1. SCOPING: M-01 Intent];
        
        A --> V[1.5 VALIDATION: PSIM Structural Check];
        V -- FAIL: Structure Error --> F01[F-01: Failure Analysis/Recalibration];

        V --> B(2. SPECIFICATION: M-02 Payload Drafting/PSR Simulation);
        
        B --> C{EPDP B: Simulation Validation?};
        
        C -- FAIL: Trace --> F01;
        
        subgraph Commitment_Gate [3. P-01 IRREVERSIBLE TRUST ADJUDICATION]
            C -- PASS: Proceed --> D[D-01: Execute P-01 Calculus];
            D --> E{EPDP C: P-01 Pass/Fail?};
        end
        
        E -- FAIL: CTG Trace & Abort Log --> F01;
        E -- PASS: Commit --> M[4. COMMITMENT: MCR Version Lock];
        
        M --> I[5. EXECUTION: C-04 Isolated Deployment];
        I --> J[Post-Execution Audit];
        J --> K(Feedback & Refinement Loop);

        F01 --> G;
        K --> G;
    end
```

---

## II. ARCHITECTURAL PRIMACY: AIA & P-01 CALCULUS

### A. Atomic Immutable Architecture (AIA) Mandate

AIA enforces mandatory structural integrity. All Stage 3+ state mutations must be cryptographically attested (D-01 log) and function as irreversible transactions, controllable exclusively by the AEOR supervision framework. Explicit, versioned configuration must govern AEOR's control over rollback paths.

| Metric | Specification | Constraint Enforced By | Required Gate |
|:---|:---|:---|:---|
| **State Mutability** | Locked (Irreversible Transaction) | **MCR Version-Lock Hashing** | P-01 Commitment Gate |
| **Rollback Capability**| Exclusively via AEOR Supervision API | GSEP V97.1 Enforcement Policy & **AIA Configuration** | P-01 Trust Calculus |

### B. P-01 Trust Calculus: Inputs and Success Condition

P-01 is the mandatory checkpoint (Stage 3). Success requires the calculated Trust Score (S-01) to dynamically surpass the defined Risk Floor (S-02), and the Policy Veto Flag (S-03) must be definitively FALSE.

**The Irreversible Pass Condition:**
$$\text{P-01 PASS} \iff \begin{cases}
\text{S-01}_{\text{Trust Projection}} > \text{S-02}_{\text{Risk Floor}} \\ 
\text{S-03}_{\text{Veto Condition}} = \text{FALSE}
\end{cases}$$

| Signal ID | Metric Source | Calculation Component | Required Threshold |
|:---|:---|:---|:---|
| **S-01 (Trust Score)** | Predicted Efficacy of M-02 Payload. | ATM, TIAR | Must strictly exceed S-02. |
| **S-02 (Risk Floor)** | Dynamic Maximum Tolerance. | C-11, CRM, RCE | Provides the quantitative constraint ceiling. |
| **S-03 (Veto Flag)** | Mandatory Policy Compliance Check. | C-15, GRS, RSAM | Must be FALSE (Absence of Policy Infraction). |

---

## III. DEFINITIVE COMPONENT REGISTRY (V97.1 Ontology)

(No changes to component list, highly efficient structure maintained.)

### A. GOVERNANCE, POLICY & INTEGRITY (Stage 0, 1, Failure)

| ID | Component Name | Functional Focus | Stage Scope | Key Mandate |
|:---|:---|:---|:---|:---|
| **GCO** | Governance Constraint Orchestrator | Integrity barrier enforcing GSEP sequential flow. | Stage 0 | Process Control |
| **GIRAM** | Governance Integrity & Rule Attestation Module | Mandatory integrity check for GRS policy set before Stage 1 initialization. | Stage 0 | Policy Integrity |
| **RSAM** | Rule Set Attestation Manager | Attests validity and compliance of proposed rule set changes. | Stage 1/3 | Rule Validation |
| **CTG** | Compliance Trace Generator | Executes post-S-03 failure trace to expedite F-01 analysis. | Failure Path (F-01) | Error Analysis |
| **GRS** | Governance Rule Source | Immutable, version-controlled repository for core governance rules. | Foundation/3 | Source of Truth |

### B. SPECIFICATION & PRE-COMMITMENT VALIDATION (Stage 1.5, 2)

| ID | Component Name | Functional Focus | Stage Scope | Key Mandate |
|:---|:---|:---|:---|:---|
| **PSIM** | Payload Structural Integrity Manager | Verifies M-02 Payload adherence to AIA schema before simulation. | Stage 1.5 | Schema Enforcement |
| **PSR** | Pre-Commit Simulation Runner | Rigorously tests M-02 payload operational integrity. | Stage 2 | Runtime Vetting |
| **MSU** | Mutation Specification Utility | Generates the M-02 payload based on M-01 intent. | Stage 2 | Payload Drafting |

### C. TRUST ADJUDICATION & ATTESTATION CORE (Stage 3, 4)

| ID | Component Name | Functional Focus | Stage Scope | Key Mandate |
|:---|:---|:---|:---|:---|
| **TIAR** | Telemetry Input Attestation Registrar | Cryptographically attests P-01 input data integrity prior to calculation. | Stage 3 | Input Integrity (S-01/S-02) |
| **C-11** | MCRA Engine | Contextual Risk Modeling and Floor Calculation (S-02 Risk Floor). | Stage 3 | Risk Quantification |
| **ATM** | Trust Metrics System | Calculates Quantitative Reliability Projection (S-01 Trust Score). | Stage 3 | Efficacy Projection |
| **C-15** | Policy Engine | Executes the S-03 mandatory veto check using GRS policies. | Stage 3 | Policy Veto Check |
| **D-01** | Decision Audit Logger | Immutable record keeper for P-01 Calculus and state transition logs. | Stage 3/4 | Transaction Logging |
| **OGT** | Operational Governance Triad | Coordination layer for core Stage 3 inputs (ATM, C-11, C-15). | Stage 3 | Triad Coordination |

### D. EXECUTION & ARCHITECTURAL COMMITMENT (Stage 4, 5)

| ID | Component Name | Functional Focus | Stage Scope | Key Mandate |
|:---|:---|:---|:---|:---|
| **MCR** | Mutation Commitment Registrar | Executes the MCR Version-Lock cryptographic attestation of the new state. | Stage 4 | State Hashing/Lock |
| **AEOR** | Atomic Execution & Orchestration Registrar | Controls P-01 PASS transition and mandates AIA rollback capability. | Stage 4/5 | Execution Supervision |
| **C-04** | Autogeny Sandbox | Isolated, monitored deployment environment. | Stage 5 | Secure Deployment |
| **FBA** | Feedback Analysis Module | Post-execution validation and performance metrics ingest. | Stage 5 | Post-Audit Metrics |

---

## IV. CORE ARCHITECTURAL CONCEPTS (V97.1 Glossary)

| Initialism | Definition | Functional Pillar | Key Role/Constraint |
|:---|:---|:---|:---|
| **AOC** | Autonomous Operational Contract | GOVERNANCE | Defining the system's operational scope. |
| **AIA** | Atomic Immutable Architecture | ARCHITECTURE | Enforcement of irreversible, attested state transitions. |
| **GSEP** | Governing Self-Evolution Protocol | GOVERNANCE | Defining the atomic, phased evolutionary workflow. |
| **P-01** | Trust Calculus | CONSENSUS | The irreversible, quantitative commitment threshold. |
| **EPDP** | Evolution Policy Decision Point | GOVERNANCE | Mandatory compliance checkpoint between GSEP stages. |