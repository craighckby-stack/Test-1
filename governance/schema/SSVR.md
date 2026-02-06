# SGS SCHEMA VERSION REGISTRY (SSVR)

## Core Mandate

The SSVR serves as the cryptographically enforced Source of Truth for all foundational Governance Infrastructure Components, Standards (GICM, CDSM, HETM), and their current valid structural specifications. It mandates integrity checking, actively prevents unauthorized schema drift, and ensures all dependent agents (operational, archival, execution) utilize proven, immutable definitions.

## Management and Security Protocol (SSVR Lifecycle)

1.  **Custody Agent:** Exclusive management by the **CRoT** (Central Registry of Trust).
2.  **Bootstrap Integrity (S0):** The primary integrity hash of the SSVR must pass cryptographic validation against the immutable S0 ANCHOR reference during system initialization (ROM-equivalent check).
3.  **Update Requirement (Consensus Attestation):** Any successful mutation requires explicit verification via a system-defined consensus quorum. Currently defined as **2/3 majority** consensus from the recognized Global Anchor Signers (GAS), logged immutably in the CSTL (Consensus State Transaction Log) prior to operational activation.

## Canonical Structure Definition

The SSVR utilizes a strict, integrity-hashed JSON format defined formally by the canonical JSON Schema found at `governance/schema/SSVR.schema.json`. This format ensures high programmatic validity and enforcement of structural constraints.

**Key Structural Fields:**
*   `integrity_hash`: SHA-384 hash covering the entire content payload, verified by the S0 agent.
*   `sgs_system_version`: The overall SGS software iteration this schema set targets.
*   `schema_definitions`: An array detailing the purpose, version, and content hash for every mandated SGS schema.
*   `attestation_log`: Cryptographic proofs signed by the Quorum members confirming the veracity and consensus approval of this specific schema version.