# SOVEREIGN ARCHITECTURAL GOVERNANCE (SAG) SPECIFICATION V97.1

## CRITICAL MANDATE: Deterministic State Evolution (DSE) Protocol

SAG V97.1 refines the governance structure for Sovereign AGI (SA-V94.1). Non-repudiable state transition ($\Psi_{N} \to \Psi_{N+1}$) is exclusively governed by the three-agent separation model (CRoT, GAX, SGS) and is finalized only upon the atomic validation of the P-01 Finality Calculus.

### Core Tenet: Separation of Duties (SoD)
Protocols enforce strict separation between the Execution Agent (SGS) and the Constraint Adherence Agent (GAX) to maintain intrinsic governance integrity.

---

## 1.0 GOVERNANCE AGENTS & SEPARATION OF DUTIES (SoD)

Decentralized accountability is ensured through three primary agents enforcing system integrity and mandatory P-01 fulfillment.

| ID | Designation | Core Mandate | P-01 Critical Focus | Artifact Control Plane |
|:---:|:---|:---:|:---:|:---:|
| **CRoT** | Root of Trust | Cryptographic Integrity, State Commitment, Chronological Indexing. | Trust Anchoring & State Finality (S13 Commit). | Cryptography, FMR, GSM, SIPM. |
| **GAX** | Axiomatics Agent | **Policy Finality**, Constraint Logic, Threshold Management. | Constraint Enforcement (**UMA (I)** & **AI (III)**). | ACVD, PRM, APCS, PCLD. |
| **SGS** | Execution Agent | Workflow Orchestration, Environment Attestation, Metric Calculation. | Execution Integrity (**CA (II)** & TEMM calculation). | ADEP, TEDS, TEDS. |

---

## 2.0 P-01 FINALITY CALCULUS & ACV MANDATE

The P-01 Checkpoint is the singular, atomic requirement for DSE finality. Non-Repudiable State Finality requires the simultaneous, verifiable satisfaction of the Axiomatic Constraint Vector (ACV) at Stage S11.

### 2.1 ACV Finality Formula (P-01 PASS Condition)

$$ 
\text{P-01 PASS} \iff (\text{UMA I}) \land (\text{CA II}) \land (\text{AI III})
$$

### 2.2 Axiomatic State Manifest (ASM) Constraints Mapping

Validation requires the ASM (populated via ADEP and validated against FASV) to deterministically map to the ACV formula variables.

| Axiom ID | Name | Constraint Definition | Governed Variables (ASM Keys) | Agent |
|:---:|:---|:---:|:---:|:---:|
| **I** | Utility Maximization | $\text{TEMM} \ge \text{UFRM} + \text{CFTM}$ | TEMM, UFRM, CFTM | GAX/SGS |
| **II** | Context Attestation | $\text{ECVM} = \text{True}$ | ECVM | SGS |
| **III** | Axiomatic Integrity | $\neg (\text{PVLM} \lor \text{MPAM} \lor \text{ADTM})$ | PVLM, MPAM, ADTM | GAX |

---

## 3.0 CERTIFIED STATE EVOLUTION PIPELINE (GSEP-C)

The mandatory 15-stage DSE protocol utilizes the P-01 Mandatory Checkpoint (M-CKPT) linkage for deterministic validation tracking.

| Phase | Stage | Agent | ACV Focus / Objective | P-01 ACV Trigger | Fallback Protocol |
|:---:|:---:|:---:|:---|:---|:---:|
| **P1: INITIATION** | S00-S01 | CRoT/SGS | System Initialization (PCE). | N/A | IH/STD |
| **P2: PRE-EXEC VALIDATION** | S02.1-S04 | GAX | Input/Policy Integrity Check (APCS validation, PVLM, MPAM). | **AI III Prereqs** | RRP |
| | S06 | SGS | Context Verification (ECVM Status Set). | **CA II Fulfillment** | RRP |
| **P3: AUDIT & METRIC CALC** | S08 | SGS | Calculate Post-Execution Utility (TEMM). | TEMM Calculation | RRP |
| | S09 | GAX | Runtime Veto Check (ADTM Status Set). | **AI III ADTM Veto** | RRP |
| | S10 | GAX | Verify Axiom I Threshold (UFRM/CFTM adherence). | **UMA I Threshold Check** | STANDARD |
| **P4: FINALITY & COMMITMENT** | **S11** | GAX | **M-CKPT: Atomic Evaluation of P-01 ACV.** (Requires FASV.) | **FULL ACV P-01 PASS** | **RRP** |
| | S13-S14 | CRoT/SGS | Final Cryptographic Signing and Atomic State Transition. | TRUST COMMITMENT | IH |

---

## 4.0 CANONICAL ARTIFACT ARCHITECTURE (A-CAT)

Artifacts are cataloged by managing Agent (SoC enforcement).

### 4.1 Governance Artifacts (Schemas & Registers)

| Acronym | Type | P-01 Linkage | Example Path | Focus |
|:---:|:---|:---:|:---|:---:|
| **ASM** | Schema | S02-S10 Accumulation | `schema/governance/AxiomaticStateManifest.schema.json` | Canonical input accumulator for ACV (Critical). |
| **FASV** | Schema | S11 Integrity Check | `schema/governance/FinalAxiomaticStateValidation.schema.json` | **Mandatory Validation Schema for P-01 M-CKPT.** |
| ACVD | Config | AI (III Veto Bounds) | `config/GAX/AxiomaticConstraintVectorDefinition.json` | Veto Bounds Logic Definition (S03, S04). |
| PCLD | Logic | RRP Analysis (PCSS) | `config/GAX/PolicyCorrectionLogicDefinition.yaml` | Defines deterministic rules for translating RRP data into PRM. |
| FMR | Registry | S11/S13 Metrics | `registry/CRoT/FinalityMetricRegistry.json` | Chronological index of P-01 status. |

### 4.2 Failure Hierarchy & Triage Protocol

| Level | Codification | P-01 Impact | Remediation Action |
|:---:|:---:|:---:|:---:|
| **IH** | INTEGRITY HALT | Trust or State Commitment Failure (S13/S14 Critical) | Immediate System Halt. Requires mandatory CRoT root reset. |
| **RRP** | ROLLBACK PROTOCOL | Axiomatic or Context Violation (S02-S11 Failures) | Mandatory forensic capture (TEDS/TVCR). Requires GAX-led Policy Correction Analysis (PCSS) using **PRM** and **PCLD**. |

---

## 5.0 SOVEREIGN ACRONYM INDEX (SAI)

| Acronym | Definition | Governing Agent | Role/Axiom ID |
|:---:|:---|:---:|:---:|
| **DSE** | Deterministic State Evolution | CRoT/SGS | Protocol |
| **GAX** | Axiomatics Agent | GAX | Agent (Policy Enforcement) |
| **SGS** | Execution Agent | SGS | Agent (Workflow Orchestration) |
| **CRoT** | Cryptographic Root of Trust | CRoT | Agent (State Commitment) |
| **RRP** | Rollback Protocol | Shared | Fallback (Forensic capture) |
| **P-01** | Finality Calculus Checkpoint | Shared | Checkpoint |
| **UMA (I)** | Utility Maximization | GAX/SGS | Axiom I |
| **CA (II)** | Context Attestation | SGS | Axiom II |
| **AI (III)** | Axiomatic Integrity | GAX | Axiom III |
| **ACV** | Axiomatic Constraint Vector | GAX | AI (III) Constraint |
| **TEMM** | Total Evolved Metric Maximization | SGS | Metric |
| **FASV** | Final Axiomatic State Validation | Shared | Schema (S11 Input) |
| **ASM** | Axiomatic State Manifest | Shared | Schema (Accumulator) |