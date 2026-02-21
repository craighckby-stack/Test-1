{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["ENFORCEMENT"]
    },
    "streams": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["ENFORCEMENT_STREAMS"]
        },
        "lazyLoading": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "jit-compiler": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["JIT_COMPILER"]
        },
        "performanceCritical": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "action-execution": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["EXECUTION"]
        },
        "command": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "action-notification": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["NOTIFICATION"]
        },
        "channel": {
          "type": "string",
          "enum": ["GOV", "OPS", "SEC"]
        },
        "level": {
          "type": "string",
          "enum": ["HIGH", "MEDIUM", "LOW"]
        }
      },
      "additionalProperties": false
    },
    "action-logging": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["LOGGING"]
        },
        "level": {
          "type": "string",
          "enum": ["WARNING"]
        }
      },
      "additionalProperties": false
    },
    "action-database": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["DATABASE"]
        },
        "command": {
          "type": "string",
          "enum": ["ROLLBACK"]
        }
      },
      "additionalProperties": false
    },
    "action-alert": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["ALERT"]
        },
        "level": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    },
    "action-feature-management": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["FEATURE_MANAGEMENT"]
        },
        "command": {
          "type": "string",
          "enum": ["DISABLE"]
        },
        "feature_id": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "action-state-block": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["STATE_BLOCK"]
        },
        "transition": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "action-audit": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["AUDIT"]
        },
        "command": {
          "type": "string",
          "enum": ["INITIATE_LOGGING"]
        }
      },
      "additionalProperties": false
    },
    "action-add": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["ADD"]
        },
        "data": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "enum": ["NEXUS_COMPONENT"]
            },
            "component": {
              "type": "object"
            }
          },
          "additionalProperties": false
        }
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
    }
  },
  "additionalProperties": false
}