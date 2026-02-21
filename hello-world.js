// Updated CORE code
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "description": "Configuration parameters for integration with the external Key Management System (KMS) for keys compliant with crit_crypto_policy.",
  "properties": {
    "kms_version": {
      "type": "string",
      "description": "Version of the KMS."
    },
    "kms_provider_type": {
      "type": "string",
      "description": "Type of the KMS provider."
    },
    "default_kms_endpoint": {
      "type": "string",
      "description": "Default endpoint for the KMS."
    },
    "key_types_config": {
      "type": "array",
      "description": "Configuration for key types.",
      "items": {
        "type": "object",
        "properties": {
          "use": {
            "type": "string",
            "description": "Use of the key."
          },
          "purpose": {
            "type": "string",
            "description": "Purpose of the key."
          },
          "algorithm_match": {
            "type": "string",
            "description": "Algorithm match for the key."
          },
          "kms_identifier": {
            "type": "string",
            "description": "Identifier for the KMS."
          },
          "rotation_policy": {
            "type": "object",
            "description": "Rotation policy for the key.",
            "properties": {
              "enabled": {
                "type": "boolean",
                "description": "Enabled status of the rotation policy."
              },
              "period_days": {
                "type": "integer",
                "description": "Period in days for the rotation policy."
              },
              "automated_retirement_delay_days": {
                "type": "integer",
                "description": "Automated retirement delay in days for the rotation policy."
              }
            }
          }
        }
      }
    },
    "add_logic": {
      "$ref": "#/properties/add_logic"
    },
    "auditing_config": {
      "$ref": "#/properties/auditing_config"
    }
  },
  "required": [
    "kms_version",
    "kms_provider_type",
    "default_kms_endpoint",
    "key_types_config",
    "add_logic",
    "auditing_config"
  ]
}

// Updated ADD logic
{
  "type": "object",
  "description": "ADD logic.",
  "properties": {
    "nexus_branch": {
      "type": "string",
      "description": "Name of the Nexus branch."
    },
    "trust_protocol": {
      "$ref": "#/properties/trust_protocol"
    },
    "verification_settings": {
      "$ref": "#/properties/verification_settings"
    },
    "provisioning": {
      "$ref": "#/properties/provisioning"
    },
    "failover_strategy": {
      "$ref": "#/properties/failover_strategy"
    }
  }
}

// Updated ADD specification
{
  "type": "object",
  "description": "Specification for ADD.",
  "properties": {
    "trust_protocol": {
      "$ref": "#/properties/add_logic/properties/trust_protocol"
    },
    "verification_settings": {
      "$ref": "#/properties/add_logic/properties/verification_settings"
    },
    "provisioning": {
      "$ref": "#/properties/add_logic/properties/provisioning"
    },
    "failover_strategy": {
      "$ref": "#/properties/add_logic/properties/failover_strategy"
    }
  }
}

// Updated ADD
{
  "kms_version": "1.0",
  "description": "Configuration parameters for integration with the external Key Management System (KMS) for keys compliant with crit_crypto_policy.",
  "kms_provider_type": "Hybrid_Cloud",
  "default_kms_endpoint": "https://kms.crit.system.local",
  "key_types_config": [
    {
      "use": "SIGNATURE",
      "purpose": "JWT_Signing",
      "algorithm_match": "ES384",
      "kms_identifier": "alias/crit-production-signing-p384",
      "rotation_policy": {
        "enabled": true,
        "period_days": 90,
        "automated_retirement_delay_days": 7
      }
    },
    {
      "use": "ENCRYPTION",
      "purpose": "Symmetric_Content_Encryption",
      "algorithm_match": "A256GCM",
      "kms_identifier": "alias/crit-production-aes256",
      "rotation_policy": {
        "enabled": true,
        "period_days": 180
      }
    }
  ],
  "add_logic": {
    "nexus_branch": "nexus-branch-name",
    "trust_protocol": "trust-protocol-name",
    "verification_settings": {
      "key_path": "key-path-name",
      "jwk_fetch_enabled": true,
      "integrity_policy_ref": "integrity-policy-ref-name"
    },
    "provisioning": {
      "endpoint": "endpoint-name",
      "manifest_id_template": "manifest-id-template-name",
      "expected_hash_field_template": "expected-hash-field-template-name",
      "required_manifests": ["manifest-1", "manifest-2"]
    },
    "failover_strategy": {
      "mode": "mode-name",
      "path": "path-name"
    }
  },
  "auditing_config": {
    "logging_destination": "CloudTrail",
    "minimum_audit_level": "CRITICAL"
  }
}

ADD:
{
  "provider_id": "CRoT_MASTER_ENDPOINT_V1",
  "description": "Configuration for Core Root of Trust (CRoT) Hash Retrieval Service.",
  "service_type": "REMOTE_ATTESTATION",
  "endpoints": {
    "primary": {
      "url": "https://trust.agi-core/v95/hashes",
      "protocol": "HTTPS/JWT",
      "timeout_ms": 3000
    },
    "fallback": {
      "url": "tcp://secure.local_tee:4444",
      "protocol": "TEE_CHANNEL",
      "timeout_ms": 500
    }
  },
  "security_parameters": {
    "signature_algorithm": "ECC_P521",
    "verification_key_id": "KID-AGI-V95-ROOT",
    "certificate_expiry_threshold_days": 15
  },
  "data_format": "MANIFEST_HASH_LIST"
}