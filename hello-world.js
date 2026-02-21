**CORE LOGIC UPDATE**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Governance Policy Definition Registry (GPDR)",
  "description": "Mapping GATM policy identifiers to structured enforcement actions and codified retry logic.",
  "type": "object",
  "properties": {
    "schema_version": {
      "type": "string",
      "default": "2.0.0"
    },
    "description": {
      "type": "string",
      "default": "Governance Policy Definition Registry (GPDR)"
    },
    "policy_definition_version": {
      "type": "string",
      "default": "PEDR_v1.1"
    },
    "policies": {
      "type": "object",
      "properties": {
        "P_HALT_AND_REPORT": {
          "$ref": "#/definitions/policy"
        },
        "P_REPORT_AND_DEGRADE": {
          "$ref": "#/definitions/policy"
        },
        "P_ROLLBACK_AND_ALERT": {
          "$ref": "#/definitions/policy"
        },
        "P_TIMEOUT_AND_REVERT": {
          "$ref": "#/definitions/policy"
        },
        "P_RATE_LIMIT_QUEUE": {
          "$ref": "#/definitions/policy"
        },
        "P_AUDIT_REVIEW_BLOCK": {
          "$ref": "#/definitions/policy"
        }
      },
      "additionalProperties": false
    }
  },
  "definitions": {
    "policy": {
      "type": "object",
      "properties": {
        "severity": {
          "type": "string",
          "enum": ["FATAL", "MINOR", "CRITICAL", "HIGH", "ADVISORY", "LOCKDOWN"]
        },
        "scope": {
          "type": "string",
          "enum": ["CORE_EXECUTION", "SERVICE_BOUNDARY", "DATA_PERSISTENCE", "STATE_MANAGEMENT", "INGRESS_CONTROL", "SECURITY_CORE"]
        },
        "actions": {
          "type": "array",
          "items": {
            "oneOf": [
              {"$ref": "#/definitions/action-execution"},
              {"$ref": "#/definitions/action-notification"},
              {"$ref": "#/definitions/action-logging"},
              {"$ref": "#/definitions/action-database"},
              {"$ref": "#/definitions/action-alert"},
              {"$ref": "#/definitions/action-feature-management"},
              {"$ref": "#/definitions/action-state-block"},
              {"$ref": "#/definitions/action-audit"}
            ]
          }
        },
        "retry_config": {
          "type": "object",
          "properties": {
            "strategy": {
              "type": "string",
              "enum": ["NONE", "TENTATIVE_BACKOFF", "IMMEDIATE_FAILOVER", "DELAY_THEN_RETRY", "DELAY_UNTIL_WINDOW_OPENS", "MANUAL_OVERRIDE"]
            },
            "max_attempts": {
              "type": "integer",
              "minimum": 1
            },
            "initial_delay_ms": {
              "type": "integer",
              "minimum": 0
            },
            "delay_seconds": {
              "type": "integer",
              "minimum": 0
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
  }
}
```

**UPDATE LOGIC**

The provided `ADD` logic has been incorporated into the `CORE` logic. The `policies` section has been updated to include the new policies, and the `policy` definition has been updated to include the new actions and retry configurations. The `action` definitions have been updated to include the new action types and properties. The `retry_config` definition has been updated to include the new retry strategies and properties.