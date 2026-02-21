CORE:
// ...[TRUNCATED]
"components": {
  "type": "object",
  "properties": {
    "registry_id": {
      "type": "string"
    },
    "schema_version": {
      "type": "string"
    },
    "last_updated_ts": {
      "type": "string"
    },
    "processing_units": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "unit_id": {
            "type": "string"
          },
          "unit_type": {
            "type": "string"
          },
          "security": {
            "type": "object",
            "properties": {
              "level": {
                "type": "integer"
              },
              "mode": {
                "type": "string"
              }
            },
            "additionalProperties": false
          },
          "resources": {
            "type": "object",
            "properties": {
              "total_cores": {
                "type": "integer"
              },
              "allocated_cores": {
                "type": "integer"
              },
              "utilization_rate": {
                "type": "number"
              }
            },
            "additionalProperties": false
          },
          "allocated_tasks": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
},
"component": {
  "type": "object"
},
"additionalProperties": false
},
"router_version": {
  "type": "string"
},
"sinks": {
  "type": "object",
  "properties": {
    "AUDIT_LOG_STREAM": {
      "type": "object",
      "properties": {
        "endpoint": {
          "type": "string"
        },
        "protocol": {
          "type": "string"
        },
        "batch_size": {
          "type": "integer"
        },
        "max_latency_ms": {
          "type": "integer"
        }
      },
      "additionalProperties": false
    },
    "SECURITY_EVENTS": {
      "type": "object",
      "properties": {
        "endpoint": {
          "type": "string"
        },
        "protocol": {
          "type": "string"
        },
        "encryption": {
          "type": "string"
        },
        "rate_limit_per_s": {
          "type": "integer"
        }
      },
      "additionalProperties": false
    },
    "TELEMETRY_DATALAKE": {
      "type": "object",
      "properties": {
        "endpoint": {
          "type": "string"
        },
        "topic": {
          "type": "string"
        },
        "retention_days": {
          "type": "integer"
        },
        "compression": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
},
"fallback_storage": {
  "type": "object",
  "properties": {
    "LOCAL_DISK": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string"
        },
        "max_disk_usage_gb": {
          "type": "integer"
        },
        "upload_on_recovery": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
},
"policy_id": {
  "type": "string"
},
"schema_version": {
  "type": "string"
},
"description": {
  "type": "string"
},
"priority_tiers": {
  "type": "object",
  "properties": {
    "P0_CRITICAL": {
      "type": "object",
      "properties": {
        "security_minimum": {
          "type": "integer"
        },
        "utilization_threshold_max": {
          "type": "number"
        },
        "unit_type_preference": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "failure_mode": {
          "type": "string",
          "enum": ["WAIT", "FALLBACK_P2"]
        }
      },
      "additionalProperties": false
    },
    "P1_NORMAL": {
      "type": "object",
      "properties": {
        "security_minimum": {
          "type": "integer"
        },
        "utilization_threshold_max": {
          "type": "number"
        },
        "unit_type_preference": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "failure_mode": {
          "type": "string",
          "enum": ["WAIT", "FALLBACK_P2"]
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
},
"default_fallback": {
  "type": "object",
  "properties": {
    "strategy": {
      "type": "string",
      "enum": ["LEAST_UTILIZED_ANY_TYPE"]
    },
    "min_security": {
      "type": "integer"
    }
  },
  "additionalProperties": false
}
},
"additionalProperties": false
}