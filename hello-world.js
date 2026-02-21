CORE:
// ...[TRUNCATED]
"debt_prioritization_config": {
  "type": "object",
  "properties": {
    "impact_weight": {
      "type": "number",
      "description": "High weight on potential performance improvements/savings.",
      "default": 0.70
    },
    "complexity_penalty": {
      "type": "number",
      "description": "Low penalty, favoring refactors that require moderate effort if impact is high.",
      "default": 0.30
    },
    "risk_threshold": {
      "type": "number",
      "description": "Maximum normalized risk (0.0 to 1.0) allowed for automated execution.",
      "default": 0.12
    },
    "min_priority_to_inject": {
      "type": "number",
      "description": "Minimum calculated score required for a proposal to be forwarded to GSEP.",
      "default": 0.05
    },
    "optimization_level": {
      "type": "string",
      "description": "Optimization level for computational efficiency.",
      "enum": ["LOW", "MEDIUM", "HIGH"]
    },
    "recursive_abstraction": {
      "type": "boolean",
      "description": "Enable recursive abstraction for optimization.",
      "default": true
    },
    "verification_pipeline": {
      "type": "string",
      "description": "Verification pipeline to run.",
      "enum": ["smoke_test", "integration_test_suite", "full_e2e_regression"]
    },
    "preflight_check": {
      "type": "string",
      "description": "Preflight check to run.",
      "enum": ["dependency_check", "linting", "security_scan_minor", "security_scan_major", "compliance_audit"]
    },
    "deployment_strategy": {
      "type": "string",
      "description": "Deployment strategy to use.",
      "enum": ["RollingUpdate", "Canary5Percent", "ImmediateDeploy"]
    },
    "target_infrastructure": {
      "type": "string",
      "description": "Target infrastructure to deploy to.",
      "enum": ["EphemeralSandbox", "PersistentTestCluster", "ProductionMain"]
    },
    "notification_channel": {
      "type": "string",
      "description": "Notification channel to use.",
      "enum": ["slack:alerts-deploy", "slack:alerts-dev", "slack:alerts-critical"]
    },
    "scaling_factor": {
      "type": "number",
      "description": "Scaling factor for deployment.",
      "default": 0.0
    },
    "approval_gates": {
      "type": "array",
      "description": "Approval gates to pass.",
      "items": {
        "type": "string"
      }
    }
  },
  "allOf": [
    {
      "if": {
        "properties": {
          "artifact_type": {
            "const": "STRUCTURED"
          }
        }
      },
      "then": {
        "required": ["schema_ref"]
      }
    },
    {
      "if": {
        "properties": {
          "artifact_type": {
            "const": "TIMESERIES"
          }
        }
      },
      "then": {
        "required": ["schema_ref"]
      }
    },
    {
      "if": {
        "properties": {
          "artifact_type": {
            "const": "PRIMITIVE"
          }
        }
      },
      "then": {
        "required": ["base_type"]
      }
    },
    {
      "if": {
        "properties": {
          "optimization_level": {
            "const": "HIGH"
          }
        }
      },
      "then": {
        "properties": {
          "recursive_abstraction": {
            "type": "boolean",
            "default": true
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "optimization_level": {
            "const": "MEDIUM"
          }
        }
      },
      "then": {
        "properties": {
          "recursive_abstraction": {
            "type": "boolean",
            "default": false
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "optimization_level": {
            "const": "LOW"
          }
        }
      },
      "then": {
        "properties": {
          "recursive_abstraction": {
            "type": "boolean",
            "default": false
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "debt_prioritization_config": {
            "not": {
              "required": ["impact_weight", "complexity_penalty", "risk_threshold", "min_priority_to_inject"]
            }
          }
        }
      },
      "then": {
        "required": ["debt_prioritization_config"]
      }
    }
  ],
  "required": ["ingestion_pipeline", "operational_metadata", "derivation_details", "schema_ref", "base_type", "indexing_strategy_id", "target_indexes", "transformation_hooks", "debt_prioritization_config", "verification_pipeline", "preflight_check", "deployment_strategy", "target_infrastructure", "notification_channel", "scaling_factor", "approval_gates"]
}