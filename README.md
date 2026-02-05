# SOVEREIGN ARCHITECTURAL GOVERNANCE (SAG) SPECIFICATION V94.1

## 0.0 CORE MANDATE: Deterministic State Evolution (DSE)

SAG mandates **Deterministic State Evolution (DSE)** ($\Psi_{N} \to \Psi_{N+1}$). All state transitions must be auditable, predictable, and defined solely by the atomic outcome of the **P-01 Finalization Calculus (S11)**. $\Psi_{N}$ is the validated current state; $\Psi_{N+1}$ is the committed evolved state.

---

## 1.0 GOVERNANCE ARTIFACTS & OPERATIONAL CONTEXT (GAOC)

### 1.1 Canonical Component Paths

| Component | Path/Stream | Role |
|:---|:---|:---|
| **Schema Root** | [`config/governance_schema.json`](./config/governance_schema.json) | Definitive structure for the Config State Root (CSR). |
| **P-01 Calculus** | [`system/core/P01_calculus_engine.py`](./system/core/P01_calculus_engine.py) | Source implementation of the finality algorithm. |
| **Event Stream** | Trusted Event Data Stream (**TEDS**) | System log stream enforcing the Auditability Tenet. |
| **IH Sentinel** | [`system/monitoring/IH_Sentinel.py`](./system/monitoring/IH_Sentinel.py) | **PROPOSED:** Real-time TEDS contract monitor (Failure detection optimization). |
| **Rollback Protocol** | [`system/utility/RRP_manager.py`](./system/utility/RRP_manager.py) | Manages state restoration upon Integrity Halt (IH). |

### 1.2 Core Glossary & Metrics

| Acronym | Definition | Type | Association (Artifact/Metric) |
|:---:|:---|:---|:---|
| **CSR** | Config State Root | Artifact | Immutable hash of governance parameters (P1). |
| **ACVD** | Axiomatic Constraint Vector Definition | Constraint | Defines mandatory metric thresholds (P2). |
| **ASM** | Axiomatic State Manifest | Artifact | Canonical output package of the evolved state (P3). |
| **STR** | State Transition Receipt | Artifact | Cryptographic confirmation/hash of the final state transition (P6). |
| **TEMM** | Total Evolved Metric Maximization | Metric | Calculated utility/performance score (P4). |
| **ECVM** | Execution Context Verification Metric | Metric | Boolean confirming P3 environment integrity (P3). |
| **GSEP-C** | Governance State Execution Pipeline | Pipeline | The mandatory 6-phase, 15-stage workflow (S00-S14). |

---

## 2.0 INTEGRITY ARCHITECTURE: TENETS, HALTS & RECOVERY

### 2.1 Atomic Tenets (Failure Triggers IH)

System operation relies on four non-negotiable constraints. Failure triggers an Integrity Halt (**IH**) and mandates immediate execution of the Rollback Protocol (RRP).

1.  **Atomicity:** P-01 Finalization (S11) must resolve instantly to a singular Boolean (PASS/FAIL).
2.  **Immutability:** The CSR is locked (P1). Any modification attempt post-S01 triggers IH.
3.  **Auditability:** All stages (S00-S14) must log sequentially to TEDS, validated by the **IH Sentinel** against the TEDS Event Contract.
4.  **Recovery:** Any IH failure automatically triggers RRP to restore state $\Psi_N$.

### 2.2 Integrity Halt (IH) Conditions & Flags

If the **IH Sentinel** or any phase audit identifies a critical flag as TRUE, the pipeline terminates immediately.

| Flag | Failure Description | Failure Phase (Audit Location) | IH Condition |
|:---:|:---|:---|:---|
| **PVLM** | Pre-Validation Logic Miss. | P2: Vetting (GAX) | Policy structure/logic failure. |
| **MPAM** | Manifest Policy Axiom Miss. | P4: Evaluation (SGS) | ASM deviates from required output contract. |
| **ADTM** | Axiomatic Deviation Threshold Miss. | P4: Evaluation (GAX) | TEMM score failure against ACVD threshold. |

---

## 3.0 GOVERNANCE PIPELINE: GSEP-C V1.2 (6 Phases)

The GSEP-C enforces DSE through a mandatory, linear 15-stage workflow (S00-S14), utilizing Separation of Duties (SoD) via three specialized Agents.

### 3.1 Agent Delegation (SoD)

*   **CRoT (Root of Trust):** Anchoring (S01) and final receipt generation (**STR**, S12).
*   **GAX (Axiomatic Governance):** Policy vetting, constraint analysis, and P-01 Finality Calculus (S11).
*   **SGS (State & Execution):** Runtime orchestration, metric generation (**TEMM, ECVM**), and state persistence.

### 3.2 GSEP-C Phase Summary

| Phase ID | Stage Range | Agent(s) | Key Goal & Validation Check |
|:---:|:---:|:---|:---|
| **P1: ANCHORING** | S00-S01 | CRoT/SGS | CSR locked; Environment verified. IH Sentinel initializes. |
| **P2: VETTING** | S02-S04 | GAX | ACVD constraints verified; PVLM audit (IH Check). |
| **P3: EXECUTION** | S05-S07 | SGS | System evolves state; ECVM generated. Canonical ASM finalized. |
| **P4: EVALUATION** | S08-S10 | SGS/GAX | TEMM validated; ADTM/MPAM audits (IH Check). |
| **P5: FINALITY** | **S11** | **GAX** | **P-01 CALCULUS: ATOMIC PASS/FAIL DECISION.** |
| **P6: COMMITMENT** | S12-S14 | CRoT/SGS | State signed (STR); irreversible transition $\Psi_{N} \to \Psi_{N+1}$. |

---

## 4.0 P-01 FINALIZATION CALCULUS (S11)

P-01 Finality (PASS) requires simultaneous satisfaction of all three independent axioms to confirm DSE integrity. The calculation is run atomically by the GAX Agent.

$$\text{P-01 PASS} \iff (\text{Axiom I}) \land (\text{Axiom II}) \land (\text{Axiom III})$$

| Axiom ID | Name | Required Condition | Failure Condition | Dependency |
|:---:|:---|:---|:---|:---|
| **I (UMA)** | Utility Maximization Attestation | $\text{TEMM} \ge \text{ACVD Threshold}$ | ADTM = True | TEMM, ACVD |
| **II (CA)** | Context Attestation | $\text{ECVM}$ is True | ECVM = False | ECVM |
| **III (AI)** | Axiomatic Integrity Validation | PVLM, MPAM, ADTM are all False | PVLM $\lor$ MPAM $\lor$ ADTM is True | IH Flags |
