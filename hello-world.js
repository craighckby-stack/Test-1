CORE:
// ...[TRUNCATED]
l": {
            "const": "LOW"
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
    },
    {
      "if": {
        "properties": {
          "verification_pipeline": {
            "type": "string"
          }
        }
      },
      "then": {
        "properties": {
          "verification_pipeline": {
            "type": "string",
            "description": "Verification pipeline used for artifact validation.",
            "default": ""
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "preflight_check": {
            "type": "string"
          }
        }
      },
      "then": {
        "properties": {
          "preflight_check": {
            "type": "string",
            "description": "Preflight check used for artifact validation.",
            "default": ""
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "deployment_strategy": {
            "type": "string"
          }
        }
      },
      "then": {
        "properties": {
          "deployment_strategy": {
            "type": "string",
            "description": "Deployment strategy used for artifact deployment.",
            "default": ""
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "target_infrastructure": {
            "type": "string"
          }
        }
      },
      "then": {
        "properties": {
          "target_infrastructure": {
            "type": "string",
            "description": "Target infrastructure for artifact deployment.",
            "default": ""
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "notification_channel": {
            "type": "string"
          }
        }
      },
      "then": {
        "properties": {
          "notification_channel": {
            "type": "string",
            "description": "Notification channel used for artifact deployment.",
            "default": ""
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "scaling_factor": {
            "type": "number"
          }
        }
      },
      "then": {
        "properties": {
          "scaling_factor": {
            "type": "number",
            "description": "Scaling factor used for artifact deployment.",
            "default": 1.0
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "approval_gates": {
            "type": "object"
          }
        }
      },
      "then": {
        "properties": {
          "approval_gates": {
            "type": "object",
            "description": "Approval gates used for artifact deployment.",
            "properties": {
              "approval_gates": {
                "type": "array",
                "description": "List of approval gates.",
                "items": {
                  "type": "string"
                }
              }
            },
            "required": [
              "approval_gates"
            ]
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "optimization_config": {
            "type": "object"
          }
        }
      },
      "then": {
        "properties": {
          "optimization_config": {
            "type": "object",
            "description": "Optimization configuration for maximum computational efficiency.",
            "properties": {
              "optimization_level": {
                "type": "string",
                "description": "Optimization level.",
                "enum": [
                  "LOW",
                  "MEDIUM",
                  "HIGH"
                ]
              }
            },
            "required": [
              "optimization_level"
            ]
          }
        }
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
    "approval_gates",
    "optimization_config"
  ]
}