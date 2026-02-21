{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Operational Telemetry Configuration",
  "type": "object",
  "properties": {
    "ingestion_pipeline": {
      "type": "object",
      "properties": {
        "certification_level": {
          "type": "string",
          "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
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
    },
    "indexing_strategy_id": {
      "type": "string",
      "description": "Maps Certified Operational Telemetry fields to specific index targets and queues based on governance level, ensuring efficient data routing."
    },
    "target_indexes": {
      "type": "object",
      "properties": {
        "L2_Certified": {
          "type": "object",
          "properties": {
            "default_index": {
              "type": "string",
              "description": "Default index for L2 Certified data."
            },
            "retention_days": {
              "type": "integer",
              "description": "Retention period for L2 Certified data."
            },
            "required_fields_for_indexing": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "List of required fields for indexing L2 Certified data."
            },
            "metric_field_mapping": {
              "type": "object",
              "properties": {
                "latency.*": {
                  "type": "string",
                  "description": "Mapping for latency metrics."
                },
                "error.count": {
                  "type": "string",
                  "description": "Mapping for error count metrics."
                }
              }
            }
          }
        },
        "L1_Validated": {
          "type": "object",
          "properties": {
            "default_index": {
              "type": "string",
              "description": "Default index for L1 Validated data."
            },
            "retention_days": {
              "type": "integer",
              "description": "Retention period for L1 Validated data."
            },
            "metric_field_mapping": {
              "type": "object",
              "properties": {
                "debug.*": {
                  "type": "string",
                  "description": "Mapping for debug metrics."
                }
              }
            }
          }
        }
      }
    },
    "transformation_hooks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "trigger_field": {
            "type": "string",
            "description": "Field to trigger transformation hook."
          },
          "action": {
            "type": "string",
            "description": "Action to perform when trigger field is met."
          },
          "queue_name": {
            "type": "string",
            "description": "Queue to route data to when trigger field is met."
          }
        }
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
    }
  ],
  "required": ["ingestion_pipeline", "operational_metadata", "derivation_details", "schema_ref", "base_type", "indexing_strategy_id", "target_indexes", "transformation_hooks"]
}