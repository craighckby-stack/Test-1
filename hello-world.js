// ...[TRUNCATED]
  "conditions": [
    {
      "id": "CORE_ENABLED",
      "description": "CORE enabled",
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
    },
    {
      "id": "ADD_PROTOCOL_INDEX_MATCH",
      "description": "ADD protocol index match",
      "type": "string",
      "value": "RRP_W_C-A_101",
      "operator": "EQ"
    },
    {
      "id": "ADD_RESOURCE_BUDGET_MATCH",
      "description": "ADD resource budget match",
      "type": "numeric",
      "value": 8500.0,
      "operator": "EQ"
    },
    {
      "id": "ADD_TELEMETRY_STREAM_MATCH",
      "description": "ADD telemetry stream match",
      "type": "string",
      "value": "AgentHealthStream",
      "operator": "EQ"
    },
    {
      "id": "ADD_REQUIRED_OPERATIONAL_METRICS_MATCH",
      "description": "ADD required operational metrics match",
      "type": "string",
      "value": "Agent_Heartbeat_Latency",
      "operator": "EQ"
    }
  ],
  "modifiers": [
    {
      "id": "CORE_WEIGHT",
      "description": "CORE weight",
      "type": "numeric",
      "value": 10,
      "operator": "MUL"
    },
    {
      "id": "ADD_WEIGHT",
      "description": "ADD weight",
      "type": "numeric",
      "value": 10,
      "operator": "MUL"
    },
    {
      "id": "NEXUS_WEIGHT",
      "description": "NEXUS weight",
      "type": "numeric",
      "value": 20,
      "operator": "MUL"
    },
    {
      "id": "SYNTHESIZED_WEIGHT",
      "description": "Synthesized weight",
      "type": "numeric",
      "value": 30,
      "operator": "MUL"
    },
    {
      "id": "ADD_PROTOCOL_INDEX_WEIGHT",
      "description": "ADD protocol index weight",
      "type": "numeric",
      "value": 5,
      "operator": "MUL"
    },
    {
      "id": "ADD_RESOURCE_BUDGET_WEIGHT",
      "description": "ADD resource budget weight",
      "type": "numeric",
      "value": 5,
      "operator": "MUL"
    },
    {
      "id": "ADD_TELEMETRY_STREAM_WEIGHT",
      "description": "ADD telemetry stream weight",
      "type": "numeric",
      "value": 5,
      "operator": "MUL"
    },
    {
      "id": "ADD_REQUIRED_OPERATIONAL_METRICS_WEIGHT",
      "description": "ADD required operational metrics weight",
      "type": "numeric",
      "value": 5,
      "operator": "MUL"
    }
  ]
}