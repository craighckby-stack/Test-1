# SOVEREIGN ARCHITECTURAL GOVERNANCE (SAG) SPECIFICATION V96.1 (CANONICAL AXIS LOCK)

*Refinement of V96.0. This revision formally consolidates the artifact catalog into a single, canonical index (Section 4.0) for tool efficiency and enhanced cross-referencing. It also clarifies the initialization dependencies and mandates the structural validation of all Axiomatic Constraint inputs via the new `CIVS` layer.* 

---

## 1.0 GOVERNANCE AGENTS & SEPARATION OF DUTIES (SoD)

Decentralized accountability ensuring system integrity and P-01 fulfillment.

| ID | Designation | Core Mandate | P-01 Validation Focus | Artifact Control Plane |
|:---:|:---|:---|:---:|:---:|
| **GAX** | Axiomatics Agent | Policy Finality, Constraint Enforcement, Utility Maximization. | UMA (I) & AI (III). | Policy Definitions, Constraint Logic, Thresholds. |
| **SGS** | Execution Agent | Workflow Orchestration, Environment Attestation, Flow Control. | CA (II) & Execution Integrity (TEMM calculation). | Execution, Flow, Auditing Schemas. |
| **CRoT** | Root of Trust | Cryptographic Integrity, State Commitment, Chronological Indexing. | Trust Anchoring & State Finality (S13 Commit). | Cryptography, Immutable State Indexing, State Schema. |

---

## 2.0 P-01 FINALITY CALCULUS & ACV CONSTRAINTS

Non-Repudiable State Finality requires the system transition ($\\Psi_{N} \to \\Psi_{N+1}$) only upon satisfaction of the Axiomatic Constraint Vector (ACV), defined as the **P-01 PASS** condition.

### 2.1 Axiomatic Constraint Vector (ACV) Formula

Finality requires simultaneous satisfaction:
$$
\text{P-01 PASS} \iff (\text{UMA}) \land (\text{CA}) \land (\text{AI})
$$

| Axiom | Name | Governing Formula / Condition | P-01 Stage (M-CKPT) |
|:---:|:---|:---|:---:|
| **I (UMA)** | Utility Maximization | $\\text{TEMM} \ge \\text{UFRM} + \\text{CFTM}$ | S08, S10 |
| **II (CA)** | Context Attestation | $\\text{ECVM} = \\text{True}$ | S06 |
| **III (AI)** | Axiomatic Integrity | $\\neg (\\text{PVLM} \lor \\text{MPAM} \lor \\text{ADTM})$ | S03, S04, S09 |

### 2.2 Canonical Constraint Input Map (C-PIM)

Definitive listing of variables constituting the ACV. These inputs are aggregated into the **Axiomatic State Manifest (ASM)** (See 4.0) prior to S11 evaluation.

| Acronym | ACV Group | Agent (Custodian) | Scope Reference | Configuration Source (File Link) |
|:---:|:---:|:---:|:---|:---:|
| **TEMM** | I (Metric) | SGS | Certified Target Utility Metric ($S_{01}$). | N/A (Runtime Calculated) |
| **UFRM** | I (Threshold) | GAX | Required Baseline Utility Metric ($S_{02}$). | `config/GAX/UtilityFunctionRegistry.yaml` |
| **CFTM** | I (Margin) | GAX | Minimum Required Utility Margin ($\epsilon$). | `config/GAX/FinalityThresholdConfig.yaml` |
| **ECVM** | II (Status) | SGS | Verified Environmental Status (Boolean). | Uses `schema/governance/GatingIntegrityCheckManifest.schema.json` |
| **PVLM** | III (Veto) | GAX | Policy Prohibition Veto Status (Boolean). | `config/GAX/AxiomaticConstraintVectorDefinition.json` |
| **MPAM** | III (Veto) | GAX | Stability Bounds Veto Status (Boolean). | `config/GAX/AxiomaticConstraintVectorDefinition.json` |
| **ADTM** | III (Veto) | GAX | Runtime Anomaly Veto Status (Boolean). | N/A (Runtime Generated) |

---

## 3.0 CERTIFIED STATE EVOLUTION PIPELINE (GSEP-C)

The mandatory 15-stage protocol ensuring Deterministic State Evolution (DSE) compliance, utilizing the P-01 Mandatory Checkpoint (M-CKPT) linkage for real-time validation tracking.

### 3.1 GSEP-C Flow Protocol & Checkpoints

| Phase | Stage | Agent | P-01 M-CKPT (ACV Linkage) | Fallback | Key Process / Focus |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **P1: INITIATION** | S00 | CRoT | N/A | IH | Initialization (GSM, SIPM anchoring). |
| | S01 | SGS | N/A | STANDARD | Protocol Consistency Engine (PCE) Check. |
| | S02 | SGS | Context II Prereqs (GICM) | RRP | GICM Gate: Verify Environmental Readiness. |
| **P2: CONSTRAINT** | **S02.1** | GAX | **Prereq Validation (CIVS)** | RRP | *NEW:* Input structure validation (ACVD, UFRM, CFTM) (See 4.0). |
| | S03 | GAX | **AI III: PVLM Veto** (Updates ASM) | RRP | Policy Prohibition Check (Uses `ACVD`). |
| | S04 | GAX | **AI III: MPAM Veto** (Updates ASM) | RRP | Stability Bounds Check (Uses `ACVD`). |
| | S05 | CRoT | N/A | RRP | Data Lineage & Source Trust Gate (CDSM Attestation). |
| | S06 | SGS | **CA II Fulfillment (ECVM)** (Updates ASM) | RRP | Context Verification Status Check. |
| **P3: AUDIT** | S07 | SGS | N/A | STANDARD | Certified Execution Sandbox Preparation (CPES). |
| | S08 | GAX/SGS | **UMA I: TEMM Calculation** (Updates ASM) | RRP | Calculate Post-Execution Utility Metric ($S_{01}$). |
| | S09 | GAX | **AI III: ADTM Veto** (Updates ASM) | RRP | Runtime Anomaly Veto Check. |
| | S10 | SGS | **UMA I: Threshold Validation** (Updates ASM) | STANDARD | Verify UFRM/CFTM adherence against TEMM. |
| **P4: FINALITY** | **S11** | GAX | **FULL ACV P-01 PASS** (Validates ASM) | RRP | Mandatory Evaluation of (I) $\land$ (II) $\land$ (III). |
| | S12 | SGS | N/A | STANDARD | STES Packaging: Serialization (DCSM/TVCR). |
| | S13 | CRoT | TRUST COMMITMENT | IH | Final Cryptographic Signing (CSTL, GSM update). |
| | S14 | SGS | TRUST EXECUTION | IH | Atomic State Transition (DSE Execution via ADMS). |

### 3.2 Failure Hierarchy & Triage Protocol

| Level | Codification | P-01 Impact | Remediation Action |
|:---:|:---:|:---:|:---:|
| **IH** | INTEGRITY HALT | Trust or State Commitment Failure (S13/S14 Critical) | Immediate System Halt. Requires mandatory CRoT root reset protocol. |
| **RRP** | ROLLBACK PROTOCOL | Axiomatic or Context Violation (S02-S11 Veto/Failures) | Mandatory forensic capture (TEDS/TVCR). Requires GAX-led Policy Correction Analysis (PCSS) before re-entry. |
| **STANDARD** | LOCAL FAILURE | Localized Flow Violation (S01, S07, S12) | Localized Rework/Reprocessing or graceful component exit. |

---

## 4.0 CANONICAL ARTIFACT AND CONFIGURATION INDEX (A-CAT)

Consolidated mapping of all operational artifacts, categorized by governing agent and functional type (Schema, Configuration, or Protocol Logic). Used for efficient dependency mapping.

| Agent | Acronym | Category | P-01 Linkage | File Path | Description / Focus |
|:---:|:---:|:---:|:---:|:---|:---:|
| GAX | ACVD | Config | AI (III Veto Bounds) | `config/GAX/AxiomaticConstraintVectorDefinition.json` | Veto Bounds Logic Definition (S03, S04). |
| GAX | CFTM Config | Config | UMA I Margin | `config/GAX/FinalityThresholdConfig.yaml` | Minimum Required Utility Margin ($\epsilon$). |
| GAX | PCSS | Schema | RRP Standard | `schema/GAX/PolicyCorrectionSchema.json` | GAX Remediation standard for RRP reporting. |
| GAX | UFRM Config | Config | UMA I Threshold | `config/GAX/UtilityFunctionRegistry.yaml` | Required Baseline Utility Metric ($S_{02}$). |
| CRoT | GSM Schema | Schema | S00 State Root | `schema/governance/Governance_State_Manifest.schema.json` | Core Governance State Root Structure definition. |
| CRoT | SIPM | Config | S00/S13 Logic | `config/CRoT/StateIndexingProtocolManifest.json` | CRoT Epoch Indexing Logic. |
| SGS | **ADMS** | Config | S14 Execution | `config/SGS/AtomicDeploymentManifestSchema.json` | S14 Execution Model configuration. |
| SGS | **ASM** | **Schema** | **S02-S10 Accumulation** | `schema/governance/AxiomaticStateManifest.schema.json` | Canonical input accumulator for ACV (Critical). |
| SGS | DCSM | Schema | S12 Packaging | `schema/governance/DSE_Commitment_Summary_Manifest.schema.json` | State summary schema prior to CRoT commit. |
| SGS | GICM | Schema | CA Prereq (S02) | `schema/governance/GatingIntegrityCheckManifest.schema.json` | Environmental Prerequisite Validation standard. |
| SGS | P01 Result | Schema | S11 FINALITY Output | `schema/governance/P01_Finality_Result.schema.json` | Final output structure (Success/Failure status). |
| SGS | RIMP | Config | N/A | `protocol/SGS/RuntimeIntegrityMonitorProtocol.json` | Runtime assurance during Audit phase (S07-S10). |
| SGS | TEDS | Schema | RRP Forensic | `schema/governance/Traceability_Event_Definition_Schema.schema.json` | Mandatory forensic capture format. |
| SGS/CRoT | TVCR | Registry | RRP Forensic | `registry/TraceVetoContextRegistry.json` | Permanent Forensic Record Storage. |
| GAX | **CIVS** | **Schema** | **S02.1 Validation** | `schema/GAX/ConstraintInputValidationSchema.json` | *NEW:* Schema for validating GAX input configuration structures (ACVD, UFRM, CFTM).