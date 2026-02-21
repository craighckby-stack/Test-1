CORE:
{
  "name": "DynamicTrustScoringEngine_V1",
  "description": "Dynamic Trust Scoring Engine",
  "version": "1.0",
  "baseScoreRange": [0, 1000],
  "rules": [
    {
      "id": "TRUST_SCORE_BASELINE",
      "description": "Base trust score",
      "type": "numeric",
      "value": 500,
      "operator": "EQ"
    },
    {
      "id": "THREAT_LEVEL_MODIFIER",
      "description": "Threat level modifier",
      "type": "numeric",
      "value": 0,
      "operator": "EQ",
      "conditions": [
        {
          "id": "HIGH_ADVERSARY_DETECTED",
          "description": "High adversary detected",
          "type": "boolean",
          "value": true,
          "operator": "EQ"
        },
        {
          "id": "LOW_RESOURCE_MODE",
          "description": "Low resource mode",
          "type": "boolean",
          "value": true,
          "operator": "EQ"
        }
      ],
      "modifiers": [
        {
          "id": "HIGH_ADVERSARY_DETECTED",
          "description": "High adversary detected modifier",
          "type": "numeric",
          "value": -200,
          "operator": "SUB"
        },
        {
          "id": "LOW_RESOURCE_MODE",
          "description": "Low resource mode modifier",
          "type": "numeric",
          "value": -100,
          "operator": "SUB"
        }
      ]
    },
    {
      "id": "TEMPORAL_DEGRADATION",
      "description": "Temporal degradation",
      "type": "numeric",
      "value": 0,
      "operator": "EQ",
      "conditions": [
        {
          "id": "UNVERIFIED_ANCHOR_DEGRADATION",
          "description": "Unverified anchor degradation",
          "type": "numeric",
          "value": 10,
          "operator": "EQ",
          "interval": "HOUR"
        }
      ],
      "modifiers": [
        {
          "id": "MAX_DEGRADATION_SCORE",
          "description": "Max degradation score",
          "type": "numeric",
          "value": 300,
          "operator": "MAX"
        }
      ]
    },
    {
      "id": "ANOMALY_DETECTION",
      "description": "Anomaly detection",
      "type": "numeric",
      "value": 0,
      "operator": "EQ",
      "conditions": [
        {
          "id": "ANOMALY_DETECTED",
          "description": "Anomaly detected",
          "type": "boolean",
          "value": true,
          "operator": "EQ"
        }
      ],
      "modifiers": [
        {
          "id": "ANOMALY_DETECTION_WEIGHT",
          "description": "Anomaly detection weight",
          "type": "numeric",
          "value": 0.5,
          "operator": "MUL"
        }
      ]
    }
  ],
  "anomalyDetection": {
    "enabled": true,
    "confidenceThreshold": 90,
    "dynamicWeightAdjustment": true
  },
  "temporalDegradation": {
    "unverifiedAnchorDegradationScorePerHour": 10,
    "maxDegradationScore": 300
  },
  "nexusBranch": {
    "name": "Nexus Branch",
    "description": "Nexus branch configuration",
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
      }
    ]
  }
}