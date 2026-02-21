// Updated CORE
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Core Configuration",
  "description": "Core configuration for the system.",
  "type": "object",
  "properties": {
    "nexus_branch": {
      "type": "string",
      "description": "Nexus branch for ADD."
    },
    "add_logic": {
      "type": "object",
      "description": "ADD logic.",
      "properties": {
        "nexus_branch": {
          "$ref": "#/properties/nexus_branch"
        },
        "trust_protocol": {
          "type": "string",
          "description": "Trust protocol for ADD."
        },
        "verification_settings": {
          "type": "object",
          "description": "Verification settings for ADD.",
          "properties": {
            "key_path": {
              "type": "string",
              "description": "Path to key for ADD."
            },
            "jwk_fetch_enabled": {
              "type": "boolean",
              "description": "Enable JWK fetch for ADD."
            },
            "integrity_policy_ref": {
              "type": "string",
              "description": "Reference to integrity policy for ADD."
            }
          }
        },
        "provisioning": {
          "type": "object",
          "description": "Provisioning settings for ADD.",
          "properties": {
            "endpoint": {
              "type": "string",
              "description": "Endpoint for ADD."
            },
            "manifest_id_template": {
              "type": "string",
              "description": "Template for manifest ID for ADD."
            },
            "expected_hash_field_template": {
              "type": "string",
              "description": "Template for expected hash field for ADD."
            },
            "required_manifests": {
              "type": "array",
              "description": "Required manifests for ADD.",
              "items": {
                "type": "string"
              }
            }
          }
        },
        "failover_strategy": {
          "type": "object",
          "description": "Failover strategy for ADD.",
          "properties": {
            "mode": {
              "type": "string",
              "description": "Mode for failover strategy for ADD."
            },
            "path": {
              "type": "string",
              "description": "Path for failover strategy for ADD."
            }
          }
        }
      }
    }
  }
};

// Updated ADD logic
{
  "type": "object",
  "description": "ADD logic.",
  "properties": {
    "nexus_branch": {
      "$ref": "#/properties/nexus_branch"
    },
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
};

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
};

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