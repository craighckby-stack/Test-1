CORE:
// ...[TRUNCATED]
"rules": [
  {
    "id": "TRUST_SCORE_NEXUS",
    "description": "Nexus trust score",
    "type": "numeric",
    "value": 0,
    "operator": "EQ",
    "conditions": [
      {
        "id": "NEXUS_BASLINE_ID",
        "description": "Nexus baseline ID",
        "type": "string",
        "value": "GARC-2024Q3-001",
        "operator": "EQ"
      },
      {
        "id": "STORAGE_PROTOCOL",
        "description": "Storage protocol",
        "type": "string",
        "value": "COLD_VAULT_IMMUTABLE_STORAGE_V3",
        "operator": "EQ"
      }
    ],
    "modifiers": [
      {
        "id": "NEXUS_BASLINE_ID_MATCH",
        "description": "Nexus baseline ID match modifier",
        "type": "numeric",
        "value": 100,
        "operator": "ADD"
      },
      {
        "id": "STORAGE_PROTOCOL_MATCH",
        "description": "Storage protocol match modifier",
        "type": "numeric",
        "value": 50,
        "operator": "ADD"
      }
    ]
  },
  {
    "id": "TRUST_SCORE_VERIFICATION_TARGETS",
    "description": "Verification targets trust score",
    "type": "numeric",
    "value": 0,
    "operator": "EQ",
    "conditions": [
      {
        "id": "OS_KERNEL_HASH_MATCH",
        "description": "OS kernel hash match",
        "type": "boolean",
        "value": true,
        "operator": "EQ"
      },
      {
        "id": "GAX_AUTH_POLICY_MANIFEST_MATCH",
        "description": "GAX authorization policy manifest match",
        "type": "boolean",
        "value": true,
        "operator": "EQ"
      },
      {
        "id": "CRoT_TRUST_ANCHORS_MATCH",
        "description": "CRoT trust anchors match",
        "type": "boolean",
        "value": true,
        "operator": "EQ"
      }
    ],
    "modifiers": [
      {
        "id": "OS_KERNEL_HASH_MATCH_MODIFIER",
        "description": "OS kernel hash match modifier",
        "type": "numeric",
        "value": 20,
        "operator": "ADD"
      },
      {
        "id": "GAX_AUTH_POLICY_MANIFEST_MATCH_MODIFIER",
        "description": "GAX authorization policy manifest match modifier",
        "type": "numeric",
        "value": 30,
        "operator": "ADD"
      },
      {
        "id": "CRoT_TRUST_ANCHORS_MATCH_MODIFIER",
        "description": "CRoT trust anchors match modifier",
        "type": "numeric",
        "value": 40,
        "operator": "ADD"
      }
    ]
  },
  {
    "id": "ADD_LOGIC",
    "description": "ADD logic",
    "type": "numeric",
    "value": 0,
    "operator": "EQ",
    "conditions": [
      {
        "id": "ADD_ENABLED",
        "description": "ADD enabled",
        "type": "boolean",
        "value": true,
        "operator": "EQ"
      },
      {
        "id": "CPU_UTILIZATION_RATIO",
        "description": "CPU utilization ratio",
        "type": "numeric",
        "value": 0.85,
        "operator": "LTE"
      },
      {
        "id": "MEMORY_FOOTPRINT_CHANGE",
        "description": "Memory footprint change",
        "type": "numeric",
        "value": 0.10,
        "operator": "LTE"
      }
    ],
    "modifiers": [
      {
        "id": "ADD_WEIGHT",
        "description": "ADD weight",
        "type": "numeric",
        "value": 10,
        "operator": "MUL"
      }
    ]
  },
  {
    "id": "ADD_LOGIC_SYNTHESIZED",
    "description": "Synthesized ADD logic",
    "type": "numeric",
    "value": 0,
    "operator": "EQ",
    "conditions": [
      {
        "id": "ADD_ENABLED",
        "description": "ADD enabled",
        "type": "boolean",
        "value": true,
        "operator": "EQ"
      },
      {
        "id": "CPU_UTILIZATION_RATIO",
        "description": "CPU utilization ratio",
        "type": "numeric",
        "value": 0.85,
        "operator": "LTE"
      },
      {
        "id": "MEMORY_FOOTPRINT_CHANGE",
        "description": "Memory footprint change",
        "type": "numeric",
        "value": 0.10,
        "operator": "LTE"
      },
      {
        "id": "MANDATE_ID_MATCH",
        "description": "Mandate ID match",
        "type": "string",
        "value": "SGS-EFF-KRNL-202409-001",
        "operator": "EQ"
      },
      {
        "id": "COMPLIANCE_STATUS",
        "description": "Compliance status",
        "type": "enum",
        "value": "COMPLIANT",
        "operator": "EQ"
      },
      {
        "id": "EVALUATED_METRICS",
        "description": "Evaluated metrics",
        "type": "array",
        "value": [
          {
            "metric_key": "Kernel_Ops/Sec_Certified_MSR",
            "achieved_value": 1000,
            "baseline_value": 500,
            "delta": 100
          }
        ],
        "operator": "EQ"
      },
      {
        "id": "CONSTRAINT_VIOLATIONS",
        "description": "Constraint violations",
        "type": "array",
        "value": [
          {
            "constraint_id": "SGS-EFF-KRNL-202409-001",
            "violated": false,
            "actual_value": 1000,
            "limit_value": 500
          }
        ],
        "operator": "EQ"
      }
    ],
    "modifiers": [
      {
        "id": "ADD_WEIGHT_SYNTHESIZED",
        "description": "Synthesized ADD weight",
        "type": "numeric",
        "value": 20,
        "operator": "MUL"
      }
    ]
  }
]
}