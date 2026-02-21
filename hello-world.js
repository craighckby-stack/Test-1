// CORE
{
  "$id": "#/definitions/CORE",
  "type": "object",
  "properties": {
    "ingestion_pipeline": {
      "type": "string",
      "description": "Ingestion pipeline used for artifact deployment."
    },
    "operational_metadata": {
      "type": "object",
      "description": "Operational metadata used for artifact deployment.",
      "properties": {
        "deployment_id": {
          "type": "string",
          "description": "Deployment ID for artifact deployment."
        },
        "deployment_name": {
          "type": "string",
          "description": "Deployment name for artifact deployment."
        }
      }
    },
    "derivation_details": {
      "type": "object",
      "description": "Derivation details used for artifact deployment.",
      "properties": {
        "derivation_id": {
          "type": "string",
          "description": "Derivation ID for artifact deployment."
        },
        "derivation_name": {
          "type": "string",
          "description": "Derivation name for artifact deployment."
        }
      }
    },
    "schema_ref": {
      "type": "string",
      "description": "Schema reference used for artifact deployment."
    },
    "base_type": {
      "type": "string",
      "description": "Base type used for artifact deployment."
    },
    "indexing_strategy_id": {
      "type": "string",
      "description": "Indexing strategy ID used for artifact deployment."
    },
    "target_indexes": {
      "type": "array",
      "description": "Target indexes used for artifact deployment.",
      "items": {
        "type": "string"
      }
    },
    "transformation_hooks": {
      "type": "array",
      "description": "Transformation hooks used for artifact deployment.",
      "items": {
        "type": "string"
      }
    },
    "debt_prioritization_config": {
      "type": "object",
      "description": "Debt prioritization configuration used for artifact deployment.",
      "properties": {
        "debt_threshold": {
          "type": "number",
          "description": "Debt threshold used for artifact deployment."
        },
        "debt_priority": {
          "type": "string",
          "description": "Debt priority used for artifact deployment."
        }
      }
    },
    "verification_pipeline": {
      "type": "string",
      "description": "Verification pipeline used for artifact deployment."
    },
    "preflight_check": {
      "type": "boolean",
      "description": "Preflight check used for artifact deployment."
    },
    "deployment_strategy": {
      "type": "string",
      "description": "Deployment strategy used for artifact deployment."
    },
    "target_infrastructure": {
      "type": "string",
      "description": "Target infrastructure used for artifact deployment."
    },
    "notification_channel": {
      "type": "string",
      "description": "Notification channel used for artifact deployment."
    },
    "scaling_factor": {
      "type": "number",
      "description": "Scaling factor used for artifact deployment."
    },
    "approval_gates": {
      "type": "array",
      "description": "Approval gates used for artifact deployment.",
      "items": {
        "type": "string"
      }
    },
    "optimization_config": {
      "type": "object",
      "description": "Optimization configuration used for artifact deployment.",
      "properties": {
        "optimization_level": {
          "type": "string",
          "description": "Optimization level used for artifact deployment.",
          "enum": [
            "LOW",
            "MEDIUM",
            "HIGH"
          ]
        }
      }
    },
    "rules": {
      "type": "array",
      "description": "Rules used for artifact deployment.",
      "items": {
        "$ref": "#/definitions/RULE"
      }
    }
  },
  "required": [
    "ingestion_pipeline",
    "operational_metadata",
    "derivation_details",
    "schema_ref",
    "base_type",
    "indexing_strategy_id",
    "target_indexes",
    "transformation_hooks",
    "debt_prioritization_config",
    "verification_pipeline",
    "preflight_check",
    "deployment_strategy",
    "target_infrastructure",
    "notification_channel",
    "scaling_factor",
    "approval_gates",
    "optimization_config",
    "rules"
  ]
}

// definitions
{
  "$id": "#/definitions/RULE",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Rule ID used for artifact deployment."
    },
    "name": {
      "type": "string",
      "description": "Rule name used for artifact deployment."
    },
    "priority": {
      "type": "number",
      "description": "Rule priority used for artifact deployment."
    },
    "condition_type": {
      "type": "string",
      "description": "Condition type used for artifact deployment."
    },
    "artifact_key": {
      "type": "string",
      "description": "Artifact key used for artifact deployment."
    },
    "expected_value": {
      "type": "boolean",
      "description": "Expected value used for artifact deployment."
    },
    "trace_log_key": {
      "type": "string",
      "description": "Trace log key used for artifact deployment."
    },
    "severity": {
      "type": "string",
      "description": "Severity used for artifact deployment."
    },
    "artifact_name": {
      "type": "string",
      "description": "Artifact name used for artifact deployment."
    },
    "threshold_key": {
      "type": "string",
      "description": "Threshold key used for artifact deployment."
    },
    "default_threshold": {
      "type": "number",
      "description": "Default threshold used for artifact deployment."
    }
  }
}