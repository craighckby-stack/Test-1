// Updated CORE logic
{
  "type": "object",
  "description": "CORE logic.",
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
    },
    "kms_version": {
      "type": "string",
      "description": "Version of the Key Management System (KMS)."
    },
    "kms_provider_type": {
      "type": "string",
      "description": "Type of the Key Management System (KMS) provider."
    },
    "default_kms_endpoint": {
      "type": "string",
      "description": "Default endpoint of the Key Management System (KMS)."
    },
    "key_types_config": {
      "type": "array",
      "description": "Configuration for key types.",
      "items": {
        "$ref": "#/properties/key_types_config"
      }
    },
    "add_logic": {
      "$ref": "#/properties/add_logic"
    },
    "auditing_config": {
      "$ref": "#/properties/auditing_config"
    }
  }
}

// Updated CORE specification
{
  "type": "object",
  "description": "Specification for CORE.",
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
    },
    "kms_version": {
      "$ref": "#/properties/kms_version"
    },
    "kms_provider_type": {
      "$ref": "#/properties/kms_provider_type"
    },
    "default_kms_endpoint": {
      "$ref": "#/properties/default_kms_endpoint"
    },
    "key_types_config": {
      "$ref": "#/properties/key_types_config"
    },
    "add_logic": {
      "$ref": "#/properties/add_logic"
    },
    "auditing_config": {
      "$ref": "#/properties/auditing_config"
    }
  }
}

// Updated CORE
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
  },
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