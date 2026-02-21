CORE:
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["CORE"]
    },
    "nexus": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["NEXUS"]
        },
        "branch": {
          "type": "string",
          "enum": ["NEXUS_BRANCH"]
        },
        "telemetry": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "enum": ["TELEMETRY"]
            },
            "encoding": {
              "type": "string",
              "enum": ["DELTA_ENCODING"]
            }
          },
          "additionalProperties": false
        },
        "logging": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "enum": ["LOGGING"]
            },
            "profiles": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": ["LOGGING_PROFILES"]
                },
                "lazyLoading": {
                  "type": "boolean"
                }
              },
              "additionalProperties": false
            }
          },
          "additionalProperties": false
        },
        "enforcement": {
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
    }
  },
  "additionalProperties": false
}

ADD:
{
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
}

// ...[TRUNCATED]