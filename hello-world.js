CORE:
// ...[TRUNCATED]
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
    },
    "schema_ref": {
      "type": "string",
      "description": "Reference to the schema used for validation.",
      "default": ""
    },
    "base_type": {
      "type": "string",
      "description": "Base type of the artifact.",
      "default": ""
    },
    "indexing_strategy_id": {
      "type": "string",
      "description": "ID of the indexing strategy used.",
      "default": ""
    },
    "target_indexes": {
      "type": "array",
      "description": "Target indexes for the artifact.",
      "items": {
        "type": "string"
      }
    },
    "transformation_hooks": {
      "type": "array",
      "description": "Transformation hooks to apply.",
      "items": {
        "type": "string"
      }
    },
    "debt_prioritization_config": {
      "type": "object",
      "description": "Configuration for debt prioritization.",
      "properties": {
        "impact_weight": {
          "type": "number",
          "description": "Weight of impact in debt prioritization.",
          "default": 0.0
        },
        "complexity_penalty": {
          "type": "number",
          "description": "Penalty for complexity in debt prioritization.",
          "default": 0.0
        },
        "risk_threshold": {
          "type": "number",
          "description": "Risk threshold for debt prioritization.",
          "default": 0.0
        },
        "min_priority_to_inject": {
          "type": "number",
          "description": "Minimum priority to inject in debt prioritization.",
          "default": 0.0
        }
      },
      "required": [
        "impact_weight",
        "complexity_penalty",
        "risk_threshold",
        "min_priority_to_inject"
      ]
    },
    "ingestion_pipeline": {
      "type": "string",
      "description": "Ingestion pipeline to use.",
      "default": ""
    },
    "operational_metadata": {
      "type": "object",
      "description": "Operational metadata for the artifact.",
      "properties": {
        "artifact_type": {
          "type": "string",
          "description": "Type of the artifact.",
          "enum": ["STRUCTURED", "TIMESERIES", "PRIMITIVE"]
        },
        "description": {
          "type": "string",
          "description": "Description of the artifact.",
          "default": ""
        },
        "min_calculated_score": {
          "type": "number",
          "description": "Minimum calculated score required for a proposal to be forwarded to GSEP.",
          "default": 0.05
        }
      },
      "required": [
        "artifact_type",
        "description",
        "min_calculated_score"
      ]
    },
    "derivation_details": {
      "type": "object",
      "description": "Derivation details for the artifact.",
      "properties": {
        "schema_ref": {
          "type": "string",
          "description": "Reference to the schema used for derivation.",
          "default": ""
        },
        "base_type": {
          "type": "string",
          "description": "Base type of the artifact.",
          "default": ""
        },
        "indexing_strategy_id": {
          "type": "string",
          "description": "ID of the indexing strategy used.",
          "default": ""
        },
        "target_indexes": {
          "type": "array",
          "description": "Target indexes for the artifact.",
          "items": {
            "type": "string"
          }
        },
        "transformation_hooks": {
          "type": "array",
          "description": "Transformation hooks to apply.",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "schema_ref",
        "base_type",
        "indexing_strategy_id",
        "target_indexes",
        "transformation_hooks"
      ]
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
    "approval_gates"
  ]
}

ADD:
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "http://agi.corp/acvd_profile_map_v1.json",
  "title": "ACVD Deployment Profile Map Schema",
  "description": "Validates the structure and constraints of the ACVD profile map.",
  "type": "object",
  "properties": {
    "schemaVersion": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+$"
    },
    "profiles": {
      "type": "object",
      "patternProperties": {
        "^[a-zA-Z]+[a-zA-Z0-9]*$": {
          "type": "object",
          "properties": {
            "inherits": {
              "type": "string"
            },
            "targetInfrastructure": {
              "type": "string"
            },
            "verificationStrategy": {
              "type": "string",
              "enum": [
                "smoke_test",
                "integration_test_suite",
                "full_e2e_regression"
              ]
            },
            "approvalGates": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "deploymentStrategy": {
              "type": "string",
              "enum": [
                "RollingUpdate",
                "Canary5Percent",
                "BlueGreen"
              ]
            }
          },
          "required": [
            "targetInfrastructure",
            "verificationStrategy"
          ]
        }
      },
      "minProperties": 1
    }
  },
  "required": [
    "schemaVersion",
    "profiles"
  ]
}

Updated CORE:
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "http://agi.corp/acvd_schema_v1.json",
  "title": "ACVD Schema",
  "description": "Validates the structure and constraints of the ACVD schema.",
  "type": "object",
  "properties": {
    "schemaVersion": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+$"
    },
    "ingestion_pipeline": {
      "type": "string",
      "description": "Ingestion pipeline to use.",
      "default": ""
    },
    "operational_metadata": {
      "type": "object",
      "description": "Operational metadata for the artifact.",
      "properties": {
        "artifact_type": {
          "type": "string",
          "description": "Type of the artifact.",
          "enum": ["STRUCTURED", "TIMESERIES", "PRIMITIVE"]
        },
        "description": {
          "type": "string",
          "description": "Description of the artifact.",
          "default": ""
        },
        "min_calculated_score": {
          "type": "number",
          "description": "Minimum calculated score required for a proposal to be forwarded to GSEP.",
          "default": 0.05
        }
      },
      "required": [
        "artifact_type",
        "description",
        "min_calculated_score"
      ]
    },
    "derivation_details": {
      "type": "object",
      "description": "Derivation details for the artifact.",
      "properties": {
        "schema_ref": {
          "type": "string",
          "description": "Reference to the schema used for derivation.",
          "default": ""
        },
        "base_type": {
          "type": "string",
          "description": "Base type of the artifact.",
          "default": ""
        },
        "indexing_strategy_id": {
          "type": "string",
          "description": "ID of the indexing strategy used.",
          "default": ""
        },
        "target_indexes": {
          "type": "array",
          "description": "Target indexes for the artifact.",
          "items": {
            "type": "string"
          }
        },
        "transformation_hooks": {
          "type": "array",
          "description": "Transformation hooks to apply.",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "schema_ref",
        "base_type",
        "indexing_strategy_id",
        "target_indexes",
        "transformation_hooks"
      ]
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
    },
    "schema_ref": {
      "type": "string",
      "description": "Reference to the schema used for validation.",
      "default": ""
    },
    "base_type": {
      "type": "string",
      "description": "Base type of the artifact.",
      "default": ""
    },
    "indexing_strategy_id": {
      "type": "string",
      "description": "ID of the indexing strategy used.",
      "default": ""
    },
    "target_indexes": {
      "type": "array",
      "description": "Target indexes for the artifact.",
      "items": {
        "type": "string"
      }
    },
    "transformation_hooks": {
      "type": "array",
      "description": "Transformation hooks to apply.",
      "items": {
        "type": "string"
      }
    },
    "debt_prioritization_config": {
      "type": "object",
      "description": "Configuration for debt prioritization.",
      "properties": {
        "impact_weight": {
          "type": "number",
          "description": "Weight of impact in debt prioritization.",
          "default": 0.0
        },
        "complexity_penalty": {
          "type": "number",
          "description": "Penalty for complexity in debt prioritization.",
          "default": 0.0
        },
        "risk_threshold": {
          "type": "number",
          "description": "Risk threshold for debt prioritization.",
          "default": 0.0
        },
        "min_priority_to_inject": {
          "type": "number",
          "description": "Minimum priority to inject in debt prioritization.",
          "default": 0.0
        }
      },
      "required": [
        "impact_weight",
        "complexity_penalty",
        "risk_threshold",
        "min_priority_to_inject"
      ]
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
    "approval_gates"
  ]
}