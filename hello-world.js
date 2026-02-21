CORE:
// ...[TRUNCATED]
"description": "Defines data lifecycle and security constraints.",
              "properties": {
                "sensitivity_level": {
                  "type": "string",
                  "enum": ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "PII", "REGULATED"],
                  "description": "Classification level for access control and logging."
                },
                "retention_days": {
                  "type": "integer",
                  "minimum": 0,
                  "description": "Data retention period in days (0 for permanent/indefinite retention)."
                },
                "purge_logic_ref": {
                  "type": "string",
                  "description": "Optional reference to a specific rule set for purge execution."
                },
                "optimization_level": {
                  "type": "string",
                  "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                  "description": "Configuration for maximum computational efficiency."
                },
                "recursive_abstraction": {
                  "type": "boolean",
                  "description": "Enables recursive abstraction for complex data structures."
                }
              }
            },
            "operational_metadata": {
              "type": "object",
              "properties": {
                "criticality_level": {
                  "type": "string",
                  "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                  "default": "MEDIUM",
                  "description": "Priority level for ingestion pipelines and monitoring SLAs."
                },
                "freshness_ttl_hours": {
                  "type": "integer",
                  "minimum": 1,
                  "description": "Maximum allowed delay between generation and consumption."
                },
                "unit_of_measure": {
                  "type": "string",
                  "description": "Standard unit for quantitative data (e.g., 'USD', 'milliseconds', 'count')."
                }
              }
            },
            "derivation_details": {
              "type": "object",
              "description": "Details for artifacts derived from other sources or calculations.",
              "properties": {
                "calculation_reference": {
                  "type": "string",
                  "description": "Module path or function reference used for calculation (if source_system is CALCULATED)."
                },
                "input_dependencies": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "List of required artifact keys (source_data_key) to produce this artifact."
                }
              }
            },
            "schema_ref": {
              "type": "string",
              "description": "Required reference to the external JSON Schema file defining structure (if STRUCTURED/TIMESERIES)."
            },
            "base_type": {
              "type": "string",
              "enum": ["string", "integer", "float", "boolean", "timestamp", "any"],
              "description": "The primitive type specification (if PRIMITIVE)."
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
            }
          ]
        }
      },
      "additionalProperties": false
    }
  }
}