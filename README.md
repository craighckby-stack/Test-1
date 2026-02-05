# SOVEREIGN ARCHITECTURAL GOVERNANCE (SAG) SPECIFICATION V94.1

## 0.0 CORE MANDATE: Deterministic State Evolution (DSE)

SAG mandates **Deterministic State Evolution (DSE)** ($\Psi_{N} \to \Psi_{N+1}$). All state transitions must be auditable, predictable, and defined solely by the atomic outcome of the **P-01 Finalization Calculus (S11)**. $\Psi_{N}$ is the validated current state; $\Psi_{N+1}$ is the committed evolved state.

---

## 1.0 GOVERNANCE SPECIFICATION ROOT (GSR)

### 1.1 Canonical Artifacts & Infrastructure

| Artifact/Service | Acronym | Path/Stream | Role |
|:---|:---|:---|:---|
| **Config State Root** | CSR | [`config/governance_schema.json`](./config/governance_schema.json) | Definitive structure (P1 lock). Immutable hash of governance parameters. |
| **Axiomatic State Manifest** | ASM | N/A | Canonical output package of the evolved state (P3 artifact). |
| **State Transition Receipt** | STR | N/A | Cryptographic confirmation/hash of the final state transition (P6 artifact). |
| **P-01 Calculus Engine** | P-01 | [`system/core/P01_calculus_engine.py`](./system/core/P01_calculus_engine.py) | Source implementation of the finality algorithm. |
| **Trusted Event Data Stream** | TEDS | Stream | System log stream enforcing the Auditability Tenet. |
| **Rollback Protocol Manager** | RRP | [`system/utility/RRP_manager.py`](./system/utility/RRP_manager.py) | Manages state restoration upon Integrity Halt (IH). |

### 1.2 Core Metrics and Constraints

| Metric/Constraint | Acronym | Association (Phase) | Definition & Requirement |
|:---:|:---:|:---|:---|
| **Axiomatic Constraint Vector Definition** | ACVD | P2 (Vetting) | Defines mandatory metric thresholds (Required for Axiom I). |
| **Total Evolved Metric Maximization** | TEMM | P4 (Evaluation) | Calculated utility/performance score (Validated against ACVD). |
| **Execution Context Verification Metric** | ECVM | P3 (Execution) | Boolean confirming environment integrity (Required for Axiom II). |

---

## 2.0 INTEGRITY HIERARCHY & HALT ARCHITECTURE

### 2.1 The Four Atomic Tenets

Failure of any of these non-negotiable constraints triggers an Integrity Halt (**IH**) and mandates immediate execution of the Rollback Protocol (RRP).

1.  **Atomicity:** P-01 Finalization (S11) must resolve instantly to a singular Boolean (PASS/FAIL).
2.  **Immutability:** The CSR is locked (P1). Any modification attempt post-S01 triggers IH.
3.  **Auditability:** All stages (S00-S14) must log sequentially to TEDS, validated against the **TEDS Event Contract** by the IH Sentinel.
4.  **Recovery:** Any IH automatically triggers RRP to restore state $\Psi_N$.

### 2.2 IH Sentinel and Deviation Triggers (Flags)

The **IH Sentinel** (`./system/monitoring/IH_Sentinel.py`) monitors TEDS and internal phase outputs for deviation flags. If a flag is TRUE, the GSEP-C terminates immediately (IH).

| Flag | Trigger Phase | Description (Deviation Type) | IH Condition |
|:---:|:---:|:---|:---|
| **PVLM** | P2: Vetting (GAX) | Pre-Validation Logic Miss. | Policy structure/logic failure, violation of ACVD format. |
| **MPAM** | P4: Evaluation (SGS) | Manifest Policy Axiom Miss. | ASM deviates from the required structural output contract. |
| **ADTM** | P4: Evaluation (GAX) | Axiomatic Deviation Threshold Miss. | TEMM score failure (TEMM < ACVD Threshold). |

---

## 3.0 GOVERNANCE STATE EXECUTION PIPELINE (GSEP-C)

The GSEP-C enforces DSE through a mandatory, linear 15-stage workflow (S00-S14). Separation of Duties (SoD) is enforced via three specialized Agents.

### 3.1 Agent Delegation Summary

| Agent | Role Summary | Primary Stages (Example) |
|:---|:---|:---|
| **CRoT (Root of Trust)** | Anchoring the state (S01) and final receipt generation (**STR**, S12). | P1, P6 |
| **GAX (Axiomatic Governance)** | Constraint analysis, policy vetting, and P-01 Finality Calculus (S11). | P2, P4 (Audit), P5 |
| **SGS (State & Execution)** | Runtime orchestration, metric generation (**TEMM, ECVM**), and state persistence. | P1, P3, P4 (Generation), P6 |

### 3.2 GSEP-C Workflow Overview (6 Phases)

| Phase ID | Stage Range | Key Goal & IH Check Location | Output Artifacts/Metrics |
|:---:|:---:|:---|:---|
| **P1: ANCHORING** | S00-S01 | Initialize, lock CSR, Environment Verification. | CSR Lock Hash |
| **P2: VETTING** | S02-S04 | Verify ACVD constraints. IH Check: **PVLM** Audit. | Vetted ACVD |
| **P3: EXECUTION** | S05-S07 | System evolves state. | ASM, ECVM (True/False) |
| **P4: EVALUATION** | S08-S10 | Validate outputs against constraints. IH Checks: **ADTM, MPAM** Audits. | TEMM Score |
| **P5: FINALITY** | **S11** | **P-01 CALCULUS: ATOMIC PASS/FAIL DECISION (GAX Agent).** | P-01 Outcome Boolean |
| **P6: COMMITMENT** | S12-S14 | State Persistence, Non-Reversibility enforced. | STR (Transition Hash) |

---

## 4.0 P-01 FINALIZATION CALCULUS (S11)

The GAX Agent runs P-01 atomically. PASS requires simultaneous satisfaction of three independent axioms, confirming DSE integrity.

$$\text{P-01 PASS} \iff (\text{Axiom I}) \land (\text{Axiom II}) \land (\text{Axiom III})$$

| Axiom ID | Name | Required Condition (PASS) | IH Flag Dependency (FAIL) |
|:---:|:---|:---|:---|
| **I (UMA)** | Utility Maximization Attestation | $\text{TEMM} \ge \text{ACVD Threshold}$ | $\text{ADTM} = \text{True}$ |
| **II (CA)** | Context Attestation | $\text{ECVM}$ is True | $\text{ECVM} = \text{False}$ |
| **III (AI)** | Axiomatic Integrity Validation | PVLM, MPAM, ADTM are all False | $\text{PVLM} \lor \text{MPAM} \lor \text{ADTM} = \text{True}$ |