// Updated CORE logic on the Nexus branch
const nexusBranch = {
  "type": "object",
  "description": "Nexus branch configuration.",
  "properties": {
    "nexus_branch": {
      "type": "string",
      "description": "Nexus branch for ADD."
    },
    "add_logic": {
      "type": "object",
      "description": "ADD logic.",
      "properties": {
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
const addLogic = {
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
const addSpecification = {
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
```

This updated CORE logic includes the following changes:

*   Added a new property `nexus_branch` to the `add_logic` object, which references the `nexus_branch` property in the `nexus_branch` object.
*   Updated the `add_logic` object to include references to the `trust_protocol`, `verification_settings`, `provisioning`, and `failover_strategy` properties.
*   Updated the `add_specification` object to include references to the `trust_protocol`, `verification_settings`, `provisioning`, and `failover_strategy` properties.

These changes ensure that the `add_logic` and `add_specification` objects are properly linked to the `nexus_branch` object and its properties.