# SOVEREIGN ARCHITECTURAL GOVERNANCE (SAG) SPECIFICATION V94.1 [REVISED]

## 0.0 ARCHITECTURAL ROOT: DETERMINISTIC FINALITY

The Sovereign mandate requires **Deterministic State Evolution (DSE)** ($\Psi_{N} \to \Psi_{N+1}$). This entire architecture is dedicated to achieving the **P-01 Finalization Calculus (S11)**, which defines the state commitment.

### 0.1 The Governing Axiom: P-01 Finality Calculus (S11)

The GAX Agent runs P-01 atomically at Stage S11. PASS requires simultaneous satisfaction of all three independent axioms. Failure triggers an Integrity Halt (IH).

$$\text{P-01 PASS} \iff (\text{Axiom I}) \land (\text{Axiom II}) \land (\text{Axiom III})$$

| Axiom ID | Name | Required Condition (PASS) | IH Flag Dependency (FAIL) |
|:---:|:---|:---|:---|
| **I (UMA)** | Utility Maximization Attestation | $\text{TEMM} \ge \text{ACVD Threshold}$ | $\text{ADTM} = \text{True}$ (Deviation) |
| **II (CA)** | Context Attestation | $\text{ECVM}$ is True | ECVM Failure (Environment) |
| **III (AI)** | Structural Integrity Validation | PVLM, MPAM, ADTM are all False | Violation of Pre/Post-execution contract. |

---

## 1.0 GOVERNANCE STATE EXECUTION PIPELINE (GSEP-C)

The GSEP-C enforces DSE through a mandatory, linear 15-stage workflow (S00-S14), utilizing three specialized Agents (CRoT, GAX, SGS).

### 1.1 Agent Delegation and Responsibilities

| Agent | Role Summary | Primary Stages (Phase) | Primary Artifacts Generated |
|:---|:---|:---|:---|
| **CRoT (Root of Trust)** | Anchoring the state, locking the CSR, and generating the final State Transition Receipt (**STR**). | P1, P6 | CSR Lock, STR |
| **GAX (Axiomatic Governance)** | Policy vetting, constraint analysis (ACVD), and running the P-01 Calculus (S11). | P2, P4 (Audit), P5 | ACVD (Vetted), P-01 Outcome |
| **SGS (State & Execution)** | Runtime orchestration, generating system metrics (TEMM, ECVM), and executing state changes (**ASM**). | P1, P3, P4 (Generation) | ASM, TEMM, ECVM |

### 1.2 GSEP-C Phase & Artifact Matrix

| Phase ID | Stage Range | Key Goal | Primary Output Artifact | Critical IH Check Location |
|:---:|:---:|:---|:---|:---|
| **P1: ANCHORING** | S00-S01 | Initialize, Lock Configuration, Environment Check. | CSR Lock Hash | N/A |
| **P2: VETTING (GAX)**| S02-S04 | Define and verify ACVD constraints. | Vetted ACVD | PVLM (P2 Miss) Audit |
| **P3: EXECUTION (SGS)**| S05-S07 | System evolves state. Verify execution context integrity. | ASM, ECVM | ECVM Failure (Axiom II) |
| **P4: EVALUATION (SGS/GAX)**| S08-S10 | Measure TEMM against ACVD thresholds. | TEMM Score | ADTM, MPAM (P4 Misses) Audits |
| **P5: FINALITY (GAX)** | **S11** | Atomic commitment decision based on Section 0.1. | P-01 Outcome Boolean | Immediate IH if FAIL |
| **P6: COMMITMENT (CRoT)**| S12-S14 | State Persistence, Non-Reversibility enforced. | STR (Transition Hash) | TEDS Check (Auditability) |

---

## 2.0 INTEGRITY HIERARCHY & HALT ARCHITECTURE

### 2.1 Artifact Paths and Core Governance Components

| Component | Acronym | Path/Stream | Role |
|:---|:---|:---|:---|
| **Config State Root** | CSR | [`config/governance_schema.json`](./config/governance_schema.json) | Definitive structure (P1 lock). |
| **P-01 Calculus Engine** | P-01 | [`system/core/P01_calculus_engine.py`](./system/core/P01_calculus_engine.py) | Finality Algorithm Source. |
| **IH Sentinel** | IH-S | [`system/monitoring/IH_Sentinel.py`](./system/monitoring/IH_Sentinel.py) | Monitors TEDS and internal outputs for IH triggers. |
| **TEDS Event Contract** | TEC | [`config/TEDS_event_contract.json`](./config/TEDS_event_contract.json) | Defines sequential logging requirements. |
| **Rollback Protocol Manager** | RRP | [`system/utility/RRP_manager.py`](./system/utility/RRP_manager.py) | Manages state restoration upon Integrity Halt. |

### 2.2 The Four Atomic Tenets (IH Triggers)

Failure of any non-negotiable constraint triggers an Integrity Halt (**IH**), mandating immediate execution of the Rollback Protocol (RRP).

1.  **Atomicity:** P-01 Finalization (S11) must resolve instantly to a singular Boolean (PASS/FAIL).
2.  **Immutability:** The CSR is locked (P1). Any modification attempt post-S01 triggers IH.
3.  **Auditability:** All stages (S00-S14) must log sequentially to the Trusted Event Data Stream (TEDS), validated against the **TEC**. 
4.  **Recovery:** Any IH automatically triggers RRP to restore state $\Psi_N$.

### 2.3 Deviation Triggers (IH Flags)

These flags are monitored by the IH Sentinel for structural deviation leading to GSEP-C termination.

| Flag | Trigger Phase | Description (Deviation Type) | Axiom Dependency |
|:---:|:---:|:---|:---|
| **PVLM** | P2: Vetting (GAX) | Pre-Validation Logic Miss. Policy structure/logic failure. | Axiom III |
| **MPAM** | P4: Evaluation (SGS) | Manifest Policy Axiom Miss. ASM output deviates from structural contract. | Axiom III |
| **ADTM** | P4: Evaluation (GAX) | Axiomatic Deviation Threshold Miss. TEMM score failure (TEMM < ACVD Threshold). | Axiom I, Axiom III |