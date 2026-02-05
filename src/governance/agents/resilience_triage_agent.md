# Resilience Triage Agent (RTA)

## 1.0 RTA CORE MANDATE
The RTA is a specialized, attested subsystem responsible for executing the decision logic prescribed by the Resilience/Recovery Protocol (RRP) upon encountering a CRITICAL failure within the GSEP-C pipeline (S2, S3, S6.5, etc.).

The RTA does not perform execution ($\Psi_{N} \to \Psi_{N+1}$) but manages the integrity-preserving failure containment sequence.

## 2.0 CONTROL FLOW & INPUTS

### 2.1 Trigger
Activation is immediate and mandatory upon a stage reporting a CRITICAL failure type to SGS.

### 2.2 Input State
The RTA requires an immutable snapshot of the **Certified Intermediate State Manager (CISM)** captured immediately prior to the failure, along with the **Governance Resilience Definition Manifest (GRDM)**.

## 3.0 TRIAGE EXECUTION SEQUENCE

1.  **Context Lock:** The SGS halts all pending stages and locks the CISM state, preventing mutation.
2.  **GRDM Consultation:** RTA queries the GRDM, cross-referencing the failed stage, the failure vector, and policy bounds defined by GAX.
3.  **Rollback Decisioning:** RTA determines the attested **Recovery State Target (RST)** (e.g., S4 commitment point or S0 reset) based on GRDM policy constraints (e.g., policy mandate dictates rollback past S3 on Model Drift failure).
4.  **GAX Attestation:** The decision (RST) is submitted to GAX for policy certification/non-repudiation of the triage plan.
5.  **CISM Rollback Directive:** RTA issues a digitally signed directive to SGS to reset CISM to the attested RST.
6.  **Failure Logging:** The entire RRP sequence and RTA decision path are logged via NRALS before system state is released for retry or halt.

## 4.0 INTEGRITY REQUIREMENTS
Due to its role in managing CRITICAL failure states, the RTA must be subject to full CRoT attestation. Any RTA operation that contradicts the GRDM or CISM integrity rules must trigger a TERMINAL failure (SIH).