# Governance Manifest Integrity Protocol (GMIP) V2.0
# Successor to MVAP V1.0

## 1.0 MANDATE: ATTESTED STATE SYNCHRONIZATION AND AUDIT INTEGRITY

The GMIP mandates the creation of an auditable, non-repudiable state machine for all mutations to Governance Asset Control Registry (GACR) critical manifests (PVLM, MPAM, ECVM, CFTM). This protocol ensures that foundational governance definitions utilized by the GSEP-C Veto Gates are cryptographically sealed, guaranteeing integrity and preventing repudiation of policy state transitions.

## 2.0 CORE ASSET: MANIFEST ROOT HASH ($ M_H $)

Instead of a simple integer version $ V_N $, the definitive identifier for a manifest state $ M $ must be its Content Root Hash, $ M_H $. This $ M_H $ is the deterministic Merkle root generated from the canonical serialization of the manifest content, defined by the Manifest Canonicalization Standard (MCS).

*   **Immutability:** Any change, no matter how minor, results in a new, unique $ M_H $.
*   **Tracing:** The hash of the previous active manifest, $ M_{H, N-1} $, must be included in the metadata of the new manifest $ M_{H, N} $, forming a verifiable Manifest Hash Chain (MHC).

## 3.0 GMIP MANIFEST LIFECYCLE FLOW

All manifest updates must transition through three formalized states before achieving activation:

### 3.1 State 1: PROPOSAL ($ M'_H $, Pending)
1.  **Initiation:** An authorized governance entity (e.g., GAX, SGS) generates the proposed manifest $ M'$.
2.  **Pre-Validation:** $ M'$ undergoes structural and policy validity checks against GICM standards. $ M'$ is assigned its provisional $ M'_H $ based on MCS.

### 3.2 State 2: CERTIFICATION ($ M_{H} $, Attested)
3.  **CRoT Attestation:** CRoT certifies the content $ M'$ by cryptographically signing its hash $ M'_H $ using the designated Asset Signing Key (ASK) chain. This produces the **Manifest Attestation Signature (MAS)**.
4.  **Immutability Commit:** The fully attested manifest $ \{M', MAS\} $ is immediately logged to the Non-Repudiable Audit Log System (NRALS) and linked via the MHC. This guarantees immediate external auditability.

### 3.3 State 3: ACTIVATION ($ M_{H} $, Active)
5.  **Deployment Eligibility:** Only manifests possessing a valid, NRALS-committed MAS are eligible for loading.
6.  **GSEP-C Load:** The newly active $ M_{H} $ must be exposed at GSEP-C S0 (ANCHOR INIT) as the current governance standard for policy enforcement.

## 4.0 INTEGRITY REQUIREMENTS

*   **MCS Requirement:** The algorithm and serialization standards used to generate $ M_H $ must be universally defined and immutable (see `config/ManifestCanonicalizationStandard.json`).
*   **Rollback Mechanism:** Previous attested states $ M_{H, N-1} $ and corresponding MAS must remain instantly accessible to support mandated Rollback and Recovery Procedures (RRP/SIH).