# Policy Configuration Trust Management (PCTM) V99.0 Standard Definition

## 1.0 Executive Mandate

The PCTM is the foundational protocol securing the integrity, provenance, and lifecycle of all Axiom Governance Configuration Assets (AGCA), specifically PVLM, ADTM, and CFTM. It guarantees that governance policy rules are attested and traceable, preventing governance supply chain risks.

## 2.0 Core Trust Requirements

### 2.1 Semantic Attestation Layer (SAL) Definition

All AGCA policy content must adhere to the SAL V1.1 standard.
1.  **Version Field:** The configuration asset MUST include the field `"policy_axiom_version"`, tracked via MAJOR.MINOR.PATCH semantic versioning.
2.  **Version Policy:** Any update affecting a policy rule payload (e.g., rule changes, veto condition modifications) requires a MINOR version bump. Structural or architectural changes to the asset format require a MAJOR bump.

### 2.2 Configuration Integrity & Provenance (CIP)

Before execution at GSEP-C Stage S0, every AGCA must satisfy the following cryptographic requirements:
1.  **Cryptographic Signing:** The asset must be cryptographically signed by an authorized Governance Key Manifest (GKM).
2.  **Metadata Inclusion:** The configuration metadata MUST include the verified signature and the reference ID of the signing GKM.
3.  **Hash Verification:** A mandatory SHA-256 hash of the configuration payload (`configuration_data` block) MUST be present for immediate integrity checks.

## 3.0 Mandatory AGCA Structure (AGCA-SCHEMA V1)

All AGCA files MUST strictly conform to the `schema/AGCA_PCTM_V1.json` definition. Non-conforming assets will fail validation immediately.

### 3.1 Certified Metadata Block Requirements

The mandatory metadata block for all AGCA assets is validated against the following structure fields:

| Field Name | Type | Constraint | Purpose |
| :--- | :--- | :--- | :--- |
| `pctm_standard_id` | String | Static: "V99.0" | Protocol version identification. |
| `policy_axiom_version` | String | Required (X.Y.Z) | Semantic Attestation Layer version of the policy payload. |
| `owner_agent` | String | Required | Originating governance agent (e.g., GAX, SVT). |
| `last_modified_utc` | String | ISO 8601 | Timestamp of last authorized modification. |
| `hash_sha256` | String | 64-char Hex | Integrity hash of the `configuration_data` payload. |
| `gkm_signature` | String | Required | Cryptographic signature applied by the GKM. |
| `configuration_data` | Object | Required | The actual policy definition payload. |

## 4.0 GSEP-C Integration

During GSEP-C Stage S0 (ANCHOR INIT), the Configuration Integrity Validation (CIV) module utilizes the defined `AGCA-SCHEMA V1` to perform rapid schema adherence checks, hash verification, and signature authentication against the CRoT approved GKM list. Trust failures in Stage S0 trigger a TERMINAL (SIH) halt.