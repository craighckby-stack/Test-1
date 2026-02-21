CORE:
{
  "type": "object",
  "properties": {
    "policy_id": {
      "type": "string"
    },
    "schema_version": {
      "type": "string"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "policy_name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "owner_entity": {
          "type": "string"
        },
        "status": {
          "type": "string"
        },
        "revision_date": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "baseline_integrity": {
      "type": "object",
      "properties": {
        "artifact_name": {
          "type": "string"
        },
        "verification_settings": {
          "type": "object",
          "properties": {
            "algorithm": {
              "type": "string"
            },
            "expected_hash": {
              "type": "string"
            },
            "attestation_requirement": {
              "type": "string"
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    },
    "trusted_dependencies": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "module_id": {
            "type": "string"
          },
          "version_lock": {
            "type": "string"
          },
          "scope": {
            "type": "string"
          },
          "mandatory": {
            "type": "boolean"
          },
          "integrity_check": {
            "type": "object",
            "properties": {
              "algorithm": {
                "type": "string"
              },
              "value": {
                "type": "string"
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      }
    },
    "operational_assurance": {
      "type": "object",
      "properties": {
        "core_metrics": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "metric_name": {
                "type": "string"
              },
              "target_threshold": {
                "type": "number"
              },
              "deviation_tolerance": {
                "type": "string"
              }
            },
            "additionalProperties": false
          }
        },
        "enforcement_action": {
          "type": "object",
          "properties": {
            "level": {
              "type": "string"
            },
            "action": {
              "type": "string"
            },
            "report_channel": {
              "type": "string"
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    },
    "modeling_governance": {
      "type": "object",
      "properties": {
        "data_source_policy_id": {
          "type": "string"
        },
        "runtime_governance": {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string"
            },
            "resource_limits": {
              "type": "object",
              "properties": {
                "max_cpu_ms": {
                  "type": "integer"
                },
                "max_memory_mb": {
                  "type": "integer"
                },
                "execution_timeout_s": {
                  "type": "integer"
                }
              },
              "additionalProperties": false
            },
            "environment_context": {
              "type": "object",
              "properties": {
                "isolation_level": {
                  "type": "string"
                },
                "processor_unit_id": {
                  "type": "string"
                }
              },
              "additionalProperties": false
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}

ADD:
{
  "policy_id": "SBCM-941B",
  "schema_version": "v5.0.0-AGI",
  "metadata": {
    "policy_name": "Sovereign AGI Baseline Modeling Policy",
    "description": "Establishes integrity, dependency validation, and strict resource governance for core autonomous evolution cycles.",
    "owner_entity": "Sovereign Core Registry v94.1",
    "status": "ACTIVE_ENFORCED",
    "revision_date": "2024-05-15T10:00:00Z"
  },
  "baseline_integrity": {
    "artifact_name": "Certified Evolution Execution Protocol (CEEP)",
    "verification_settings": {
      "algorithm": "SHA-512",
      "expected_hash": "d8c4e0b5f6a9c2b1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c61234567890abcdefedcba9876543210fedcba9876543210",
      "attestation_requirement": "TRUST_ROOT_CERTIFIED"
    }
  },
  "trusted_dependencies": [
    {
      "module_id": "ModelSynthesizer_v2.1",
      "version_lock": "~2.1.0",
      "scope": "runtime",
      "mandatory": true,
      "integrity_check": {
        "algorithm": "SHA-384",
        "value": "678e90f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d7e8f9a0b1c2d3e4f5a6b7c8d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5"
      }
    }
  ],
  "operational_assurance": {
    "core_metrics": [
      {
        "metric_name": "ModelConfidenceScore",
        "target_threshold": 0.9999,
        "deviation_tolerance": 0.00001
      },
      {
        "metric_name": "EvolutionCycleLatency_ms",
        "target_threshold": 500,
        "deviation_tolerance": "MAX_ABS_50"
      }
    ],
    "enforcement_action": {
      "level": "CRITICAL",
      "action": "HALT_EXECUTION_AND_ISOLATE",
      "report_channel": "SBCM_CRITICAL_ALERT"
    }
  },
  "modeling_governance": {
    "data_source_policy_id": "DTEM-74A",
    "runtime_governance": {
      "mode": "ephemeral_sandboxed",
      "resource_limits": {
        "max_cpu_ms": 1500,
        "max_memory_mb": 512,
        "execution_timeout_s": 30
      },
      "environment_context": {
        "isolation_level": "L4_SEALED",
        "processor_unit_id": "PU-941A-Core-01"
      }
    }
  }
}

Updated CORE logic:
The updated CORE logic now includes the properties from the ADD logic, specifically the policy_id, schema_version, metadata, baseline_integrity, trusted_dependencies, operational_assurance, and modeling_governance. The additionalProperties property is set to false for all objects to ensure that only the specified properties are allowed.