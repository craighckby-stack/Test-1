# Resilience Triage Agent (RTA) Specification

## 1.0 SYSTEM ROLE & ASSURANCE
The RTA is an immutable, attested decision-making subsystem operating within the Integrity Preservation Layer. Its exclusive mandate is to interpret and enforce the Governance Resilience Definition Manifest (GRDM) policy constraints following a CRITICAL failure state within the primary Sovereign Execution Pipeline (GSEP).

The RTA's primary function is non-execution ($\Psi_{N} \nRightarrow \Psi_{N+1}$), focusing strictly on issuing digitally signed directives for failure containment and systemic state restoration.

## 2.0 INPUTS, OUTPUTS, & ACTIVATION

### 2.1 Activation Trigger
Mandatory and synchronous activation occurs upon the Sovereign Governance System (SGS) receiving a verified `STATUS: CRITICAL_FAILURE` signal from any core pipeline stage (S2-S9).

### 2.2 Input Artifacts
1.  **Certified Intermediate State Manager (CISM) Snapshot (Immutable):** The atomic state $S_{CISM}$ captured immediately preceding the failure event.
2.  **Governance Resilience Definition Manifest (GRDM):** The actively certified version of policy constraints detailing recovery strategies mapped against failure vectors.
3.  **Failure Vector Report (FVR):** Detailed diagnostics specifying the failed stage, failure type taxonomy, and severity classification.

### 2.3 Output Artifact
**Signed Recovery Directive (SRD):** A cryptographically signed instruction artifact containing the attested Recovery State Target (RST) and necessary state transition metadata for SGS rollback execution.

## 3.0 TRANSACTIONAL TRIAGE SEQUENCE

The RTA must execute the following steps as a fast, isolated transaction to maintain integrity invariants:

1.  **State Isolation & Lock:** SGS isolates and globally locks the CISM write access. RTA retrieves the immutable $S_{CISM}$ snapshot.
2.  **Policy Query Resolution:** RTA queries the GRDM using the FVR (Stage ID, Failure Type) to determine the pre-mandated recovery policy path.
3.  **RST Calculation:** RTA calculates the exact Attested Recovery State Target ($RST_{T}$), ensuring compliance with the GRDM, often targeting the most recent safe commitment boundary.
4.  **Non-Repudiation Attestation (GAX):** RTA submits the calculated $RST_{T}$ to the Governance Attestation X-unit (GAX) to certify policy compliance, resulting in a cryptographically certified signature ($\Sigma_{RST}$).
5.  **SRD Generation & Issue:** The RTA packages the $RST_{T}$ and $\Sigma_{RST}$ into the Signed Recovery Directive (SRD) and issues it to the SGS Recovery Module.
6.  **Immutable Logging:** Before releasing the system lock, the RTA ensures that the entire recovery transaction (Inputs, $RST_{T}$, SRD contents) is logged permanently via the Non-Repudiable Attested Log System (NRALS).

## 4.0 INTEGRITY AND SELF-GOVERNANCE
The RTA component, its dependency chain, and policy execution environment must be subject to continuous CRoT validation. Any attempt by the RTA to generate an SRD that violates the GRDM, fails GAX attestation, or attempts to modify the locked CISM state, shall immediately trigger an Integrity Hard Halt (SIH).