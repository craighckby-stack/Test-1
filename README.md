# SOVEREIGN ARCHITECTURAL GOVERNANCE (SAG) SPECIFICATION V97.2 R2 (Refactored)

## MISSION MANDATE: Deterministic State Evolution (DSE)

SAG V97.2 R2 mandates the **Deterministic State Evolution (DSE)** protocol ($\Psi_{N} \to \Psi_{N+1}$), achieved through strict separation of duties (CRoT, GAX, SGS). State transition is non-repudiable and relies solely on the atomic verification of the P-01 Finality Calculus.

---

## 1.0 SOVEREIGN ACRONYM KEY (SAK)

### 1.1 Agents, Protocols, and Core Tenets (Actors and Rules)

| Acronym | Definition | Role/Type | Responsible Agent(s) |
|:---:|:---|:---:|:---:|
| **DSE** | Deterministic State Evolution | Core Protocol | CRoT/SGS |
| **P-01** | Finality Calculus Checkpoint | Mandatory State Lock (M-CKPT) | Shared (GAX/CRoT) |
| **CRoT** | Cryptographic Root of Trust | Integrity & State Commitment | CRoT |
| **GAX** | Axiomatics Agent | Policy Enforcement & Validation | GAX |
| **SGS** | Execution Agent | Workflow & Metric Calculation | SGS |
| **SoD** | Separation of Duties | Foundational Tenet | All |
| **RRP** | Rollback Protocol | Failure Triage Mechanism | Shared |

### 1.2 Critical Artifacts and State Components (Data Structure and Outcome)

| Acronym | Definition | Originator (Write) | Validator (Read/Check) | Focus |
|:---:|:---|:---:|:---:|:---:|
| **ASM** | Axiomatic State Manifest | SGS | GAX | Canonical Input State for P-01. |
| **ACV** | Axiomatic Constraint Vector | GAX | GAX | Defines constraints checked during P-01. |
| **TEMM** | Total Evolved Metric Maximization | SGS | GAX | Core utility outcome metric (Numerator). |
| **FASV** | Final Axiomatic State Validation | GAX | GAX/CRoT | Schema definition for ASM validation. |
| **ACVD**| ACV Definition | GAX (Config) | GAX | Configuration defining ACV thresholds/rules. |
| **FMR** | Finality Metric Registry | CRoT | All | Index of chronological P-01 results. |

---

## 2.0 AGENT MANDATES & SoD ENFORCEMENT

Decentralized accountability is ensured by defining specialized, non-overlapping mandates.

| Agent | Core Mandate (Focus) | P-01 Validation Focus | Key Artifacts |
|:---:|:---:|:---:|:---:|
| **CRoT** | Integrity Verification, Final State Signing (S13 Commit). | Non-repudiation and Trust Anchoring. | FMR, GSM, SIPM, XEL (Shared) |
| **GAX** | Policy Enforcement, Constraint Validation (UMA I, CA II, AI III). | ACV Adherence and Constraint Logic. | ACVD, PCLD, APCS, FASV |
| **SGS** | Workflow Orchestration, Execution Integrity, Metric Calculation. | Execution Attestation & Utility Optimization (TEMM). | ADEP, TEDS, TVCR, ASM (Write), **EPB** (Read)|

---

## 3.0 P-01 FINALITY NUCLEUS: ACV CALCULUS

The P-01 Checkpoint is the non-negotiable state finality gate, performed atomically by **GAX** at Stage **S11**. It validates the **ASM** (runtime state input) against the mandated **ACV** (constraint definitions).

### 3.1 P-01 PASS Condition (DSE Success Formula)

Successful DSE requires the simultaneous satisfaction of all three axiomatic constraints at S11:

$$
\text{P-01 PASS} \iff (\text{UMA I}) \land (\text{CA II}) \land (\text{AI III})
$$

### 3.2 Axiomatic Constraints Definition (ACV Structure)

The ACV mandates the following requirements, using input supplied by specified Agents:

| Axiom ID | Name | Constraint Definition (Logic) | Data Supplier Agent | Dependency (ASM Keys) |
|:---:|:---|:---|:---:|:---:|
| **I** | Utility Maximization (UMA) | $\text{TEMM} \ge \text{UFRM} + \text{CFTM}$ | SGS, GAX (Thresholds) | TEMM, UFRM, CFTM |
| **II** | Context Attestation (CA) | $\text{ECVM} = \text{True}$ (Execution Context Verified) | SGS | ECVM |
| **III** | Axiomatic Integrity (AI) | $\neg (\text{PVLM} \lor \text{MPAM} \lor \text{ADTM})$ (No failure flags raised) | GAX (Pre/Post Veto) | PVLM, MPAM, ADTM |

---

## 4.0 CERTIFIED STATE EVOLUTION PIPELINE (GSEP-C)

The mandatory 15-stage protocol ensures verifiable execution, accumulating the state manifest (**ASM**) for S11 finality.

| Phase | Stage | Agent | Primary Objective | Key Artifact Status Update | Fallback Protocol |
|:---:|:---:|:---:|:---|:---|:---:|
| **P1: INIT** | S00-S01 | CRoT/SGS | Secure Environment Attestation & Initialization. | GSM, SIPM initialized. **EPB** loaded by SGS. | IH/STD |
| **P2: VALIDATE**| S02-S04 | GAX | Pre-Execution Integrity Check based on EPB. | Sets integrity failure flags (**PVLM, MPAM**) | RRP |
| **P3: EXECUTION** | S06 | SGS | Runtime Workflow Execution & Context Attestation. | Sets **ECVM** Status (CA II fulfillment). | RRP |
| **P4: METRIC** | S08 | SGS | Calculate Outcome Utility Metrics. | Writes **TEMM** value to ASM (UMA I Input). | RRP |
| | S09-S10 | GAX | Post-Execution Policy Review & Veto Check. | Sets **ADTM** Status, Verifies UFRM/CFTM adherence. | RRP |
| **P5: FINALITY** | **S11 (M-CKPT)** | **GAX** | **ATOMIC P-01 PASS/FAIL Evaluation (Full ACV).** | Final **FASV** Check / Logs Result to FMR. | **RRP** |
| | S13-S14 | CRoT/SGS | Final Cryptographic Signing & State Transition. | CRoT Final Commitment (TRUST COMMITMENT). | IH |

---

## 5.0 FAILURE HIERARCHY & TRIAGE PROTOCOL

Failure responses are stratified to maintain DSE integrity and enable forensic recovery.

| Level | Codification | P-01 Impact Window | Remediation Action |
|:---:|:---:|:---:|:---:|
| **IH** | INTEGRITY HALT | S13/S14 (Post-P-01 State Commitment failure). | **Immediate System Halt.** Mandatory CRoT root reset and forensic image retention. |
| **RRP** | ROLLBACK PROTOCOL | S02 - S11 Failures (Axiomatic/Context Violation). | **Mandatory Forensic Capture (TEDS).** Requires GAX-led Policy Correction Analysis (PCSS). |

---

## 6.0 CANONICAL ARTIFACT ARCHITECTURE (A-CAT)

### 6.1 Runtime State & Audit Trail (Highly Mutable)

| Acronym | Managing Agent | Focus | P-01 Linkage |
|:---:|:---|:---:|:---:|
| **ASM** | SGS/GAX | Canonical Input State Schema. | S02-S10 Accumulation. |
| TEDS | SGS | Triage Event Data Stream (Forensic Capture Log). | RRP Trigger. |
| **XEL** | CRoT/SGS | Execution Ledger (Verifiable timeline). | All Phases. |
| **FMR** | CRoT | Finality Metric Registry (P-01 Status Index). | S11 Logging. |

### 6.2 Agent Directives & Configuration (Low Mutability)

| Acronym | Governing Agent | Focus | P-01 Linkage |
|:---:|:---|:---:|:---:|
| **ACVD** | GAX | Axiomatic Constraint Vector Definition (Thresholds/Operators). | UMA I, AI III Bounds. |
| PCLD | GAX | Policy Correction Logic Definition (Ruleset for PCSS). | RRP Analysis. |
| **FASV** | GAX | Schema defining expected ASM structure for P-01 input. | S11 Integrity Check. |
| **EPB** | SGS | **Execution Parameter Blueprint** (Defines SGS workflow steps/requirements). | P1 Initialization/Setup. |
