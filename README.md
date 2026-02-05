# SOVEREIGN ARCHITECTURAL GOVERNANCE (SAG) SPECIFICATION V94.1 [REVISED]

## 0.0 ARCHITECTURAL ROOT: DETERMINISTIC FINALITY (DSE)

The Sovereign architecture mandates **Deterministic State Evolution (DSE)** ($\Psi_{N} \to \Psi_{N+1}$). This entire system converges on the **P-01 Finalization Calculus (S11)**, which governs state commitment and triggers the Integrity Halt (IH) if failed.

### 0.1 The P-01 Finality Calculus (S11) - Axiomatic Structure

The GAX Agent executes P-01 atomically at Stage S11. PASS requires simultaneous satisfaction of all three independent governance axioms. Failure (IH) is triggered immediately by the dependent flag state.

$$\text{P-01 PASS} \iff (\text{Axiom I}) \land (\text{Axiom II}) \land (\text{Axiom III})$$

| Axiom ID | Name | Required Condition (PASS) | IH Failure Trigger (Flag/Event) | Critical Failure Stage |
|:---:|:---|:---|:---|:---|
| **I (UMA)** | Utility Maximization Attestation | $\text{TEMM} \ge \text{ACVD Threshold}$ | $\text{ADTM} = \text{True}$ (Axiomatic Deviation Threshold Miss) | P4 |
| **II (CA)** | Context Attestation | $\text{ECVM}$ is True (Environment Check Validated Metric) | ECVM Failure (Runtime Environment Violation) | P3 |
| **III (AI)** | Structural Integrity Validation | PVLM, MPAM, ADTM are all False | PVLM / MPAM (Logic/Manifest Contract Miss) | P2 / P4 |

---

## 1.0 GOVERNANCE STATE EXECUTION PIPELINE (GSEP-C)

The GSEP-C enforces DSE through a mandatory, linear 15-stage workflow (S00-S14), leveraging three specialized Agents (CRoT, GAX, SGS).

### 1.1 Agent Delegation and Responsibilities

| Agent | Role Summary | Primary Stages (Phase) | Primary Artifacts Generated |
|:---|:---|:---|:---|
| **CRoT (Root of Trust)** | Anchors state, locks the CSR, and generates the final State Transition Receipt (**STR**). | P1, P6 | CSR Lock Hash, STR |
| **GAX (Axiomatic Governance)** | Policy vetting, constraint analysis (ACVD), runs P-01 Calculus (S11). | P2, P4 (Audit), P5 | Vetted ACVD, P-01 Outcome |
| **SGS (State & Execution)** | Runtime orchestration, metric generation (TEMM, ECVM), and executing state changes (**ASM**). | P1, P3, P4 (Generation) | ASM, TEMM, ECVM |

### 1.2 GSEP-C Phase & Artifact Matrix

| Phase ID | Stage Range | Key Goal | Primary Output Artifact | IH Check & Axiom Dependency |
|:---:|:---:|:---|:---|:---|
| **P1: ANCHORING** | S00-S01 | Initialize, Lock Configuration, Environment Check. | CSR Lock Hash | No IH check. Sets immutability baseline. |
| **P2: VETTING (GAX)**| S02-S04 | Define and verify ACVD constraints. | Vetted ACVD | PVLM (Pre-Validation Miss) $\to$ Axiom III |
| **P3: EXECUTION (SGS)**| S05-S07 | System evolves state. Verify execution context integrity. | ASM, ECVM | ECVM Failure $\to$ Axiom II |
| **P4: EVALUATION (SGS/GAX)**| S08-S10 | Measure TEMM against ACVD thresholds. | TEMM Score | ADTM or MPAM Miss $\to$ Axioms I & III |
| **P5: FINALITY (GAX)** | **S11** | Atomic commitment decision (P-01). | P-01 Outcome Boolean | Immediate IH if P-01 == FAIL |
| **P6: COMMITMENT (CRoT)**| S12-S14 | State Persistence, Non-Reversibility enforced. | STR (Transition Hash) | TEDS Check (Auditability Tenet) |

---

## 2.0 INTEGRITY HIERARCHY & HALT ARCHITECTURE

### 2.1 Artifact Paths and Core Governance Components

| Component | Acronym | Path/Stream | Role |
|:---|:---|:---|:---|
| **Config State Root** | CSR | [`config/governance_schema.json`](./config/governance_schema.json) | Definitive structure (P1 lock). |
| **P-01 Calculus Engine** | P-01 | [`system/core/P01_calculus_engine.py`](./system/core/P01_calculus_engine.py) | Finality Algorithm Source. |
| **IH Sentinel** | IH-S | [`system/monitoring/IH_Sentinel.py`](./system/monitoring/IH_Sentinel.py) | Monitors TEDS and internal outputs for IH triggers. |
| **TEDS Event Contract** | TEC | [`config/TEDS_event_contract.json`](./config/TEDS_event_contract.json) | Defines sequential logging requirements. |
| **Metric Aggregator** | TMA | [`system/metrics/MetricAggregator.py`](./system/metrics/MetricAggregator.py) | Utility for generating TEMM score during P3/P4. |
| **Rollback Protocol Manager** | RRP | [`system/utility/RRP_manager.py`](./system/utility/RRP_manager.py) | Manages state restoration upon Integrity Halt. |

### 2.2 The Four Atomic Tenets (IH Triggers)

Failure of any non-negotiable constraint triggers an Integrity Halt (**IH**), mandating immediate execution of the Rollback Protocol (RRP).

1.  **Atomicity:** P-01 Finalization (S11) must resolve instantly to a singular Boolean (PASS/FAIL).
2.  **Immutability:** The CSR is locked (P1). Any modification attempt post-S01 triggers IH.
3.  **Auditability:** All stages (S00-S14) must log sequentially to the Trusted Event Data Stream (TEDS), validated against the **TEC**.
4.  **Recovery:** Any IH automatically triggers RRP to restore state $\Psi_N$.

### 2.3 IH Flag Mapping (Deviation Triggers)

These internal flags are monitored by the IH Sentinel (IH-S) for structural deviation leading to GSEP-C termination.

| Flag | Trigger Phase | Description (Deviation Type) | Primary Axiom Breach |
|:---:|:---:|:---|:---|
| **PVLM** | P2: Vetting (GAX) | Pre-Validation Logic Miss. Policy structure/logic failure. | Axiom III |
| **MPAM** | P4: Evaluation (SGS) | Manifest Policy Axiom Miss. ASM output deviates from structural contract. | Axiom III |
| **ADTM** | P4: Evaluation (GAX) | Axiomatic Deviation Threshold Miss. TEMM score failure (TEMM < ACVD Threshold). | Axiom I / Axiom III |