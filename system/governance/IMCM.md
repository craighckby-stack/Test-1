## INTER-AGENT MANDATE COMPLIANCE MANIFEST (IMCM) V94.3

**Purpose:** The IMCM establishes the non-negotiable operational mandates and jurisdictional boundaries (Separation of Duties, SoD) for the SGS, GAX, and CRoT agents. It is cryptographically attested by CRoT and is used by the Pre-Flight Mandate Validator (PFMV) to reject non-compliant state proposals prior to GSEP-C Stage 1 (S1).

**Integration Point:** Pre-S1 validation, enforced by PFMV (Section 4.3).

**Mandate Structure (JSON Schema required for CRoT attestation):

```json
{
  "version": "V94.3",
  "CRoT_Signature": "[CRoT Attestation Hash]",
  "mandates": [
    {
      "agent": "SGS",
      "scope": "EXECUTION_MANAGEMENT",
      "prohibitions": [
        "Direct modification of PVLM/CFTM",
        "Bypassing S10/S0 CRoT attestations"
      ],
      "required_signatures": ["GAX_Policy_Acceptance", "CRoT_Audit"]
    },
    {
      "agent": "GAX",
      "scope": "POLICY_ENFORCEMENT",
      "prohibitions": [
        "Manipulation of intermediate state (CISM) data",
        "Initiation of S11 atomic execution"
      ],
      "required_signatures": ["SGS_Commitment"]
    },
    {
      "agent": "CRoT",
      "scope": "CRYPTO_INTEGRITY",
      "prohibitions": [
        "Unauthorized alteration of governance binary (GVDM)",
        "Veto authority on CEEP modeling (S5)"
      ]
    }
  ]
}
```

**Rationale for PFMV (Pre-Flight Mandate Validator):** To ensure that incoming state proposals (e.g., from an external or derivative agent) do not violate the core SoD contract of the Triumvirate (Section 1.0). If a proposal attempts to force an agent outside its IMCM defined scope, it is immediately discarded, conserving GSEP-C critical resources.