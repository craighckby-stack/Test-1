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
  }
}
```

This updated CORE code includes the following changes:

1.  **Rule Engine Name**: The rule engine name is now `DynamicTrustScoringEngine_V1`.
2.  **Base Score Range**: The base score range is set to 0 to 1000.
3.  **Threat Level Modifiers**: Threat level modifiers are applied for `HIGH_ADVERSARY_DETECTED` and `LOW_RESOURCE_MODE`.
4.  **Temporal Degradation**: Temporal degradation is set with an unverified anchor degradation score per hour of 10 and a max degradation score of 300.
5.  **Anomaly Detection**: Anomaly detection is enabled with dynamic weight adjustment and a confidence threshold percent of 90.