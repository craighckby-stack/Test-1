# Policy Configuration Trust Management (PCTM) V98.3

## 1.0 Executive Mandate

The PCTM is a foundational protocol designed to secure the integrity, provenance, and lifecycle of all Axiom Governance Configuration Assets (AGCA), specifically PVLM, ADTM, and CFTM. Its purpose is to guarantee that the policy rules themselves are attested and traceable, preventing supply chain attacks on the governance core.

## 2.0 Core Requirements

### 2.1 Semantic Attestation Layer (SAL)

All AGCA files must adhere to the SAL standard, which mandates Semantic Versioning (`MAJOR.MINOR.PATCH`) specifically dedicated to policy axioms. Any change to a veto condition (e.g., PVLM rule update) requires a MINOR version bump; structural changes require a MAJOR bump. The AGCA file must contain a dedicated version field: `"pctm_version": "X.Y.Z"`.

### 2.2 Pre-Deployment Cryptographic Signing

Before loading at GSEP-C Stage S0, every AGCA must be cryptographically signed by an authorized Governance Key Manifest (GKM). The signature and the GKM reference MUST be included in the AGCA metadata. CRoT validates this signature against the approved GKM list during S0.

### 2.3 Required File Structure

All AGCA files must include the following certified metadata block:

```json
{
  "pctm_version": "V98.3.2",
  "owner_agent": "GAX",
  "last_modified": "YYYY-MM-DDTHH:MM:SSZ",
  "hash_sha256": "[File Content Hash]",
  "crt_attestation_signature": "[GKM Signed Signature]",
  "configuration_data": { ... }
}
```

## 3.0 Integration into GSEP-C

During Stage S0 (ANCHOR INIT), the PCTM state is verified, confirming the active version of all loaded AGCA aligns with the latest approved SAL state and that cryptographic integrity (2.2) is maintained. A failure in PCTM validation leads to a TERMINAL (SIH) halt, as the foundational axioms cannot be trusted.