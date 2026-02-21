// Updated CORE code
{
  "id": "CORE",
  "description": "CORE",
  "type": "object",
  "value": {
    "metrics": [
      {
        "id": "CORE_REQUIRED_METRICS_MATCH",
        "description": "CORE required metrics match",
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
      },
      {
        "id": "NEXUS_BRANCH_SYNTHESIS_METRIC",
        "description": "Nexus branch synthesis metric",
        "type": "string",
        "value": "Nexus_Branch_Synthesis",
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
      },
      {
        "id": "NEXUS_BRANCH_SYNTHESIS",
        "description": "Nexus branch synthesis",
        "type": "numeric",
        "value": 0,
        "operator": "ADD"
      },
      {
        "id": "NEXUS_BRANCH_SYNTHESIS_WEIGHT",
        "description": "Nexus branch synthesis weight",
        "type": "numeric",
        "value": 10,
        "operator": "MUL"
      }
    ]
  },
  "operator": "EQ"
}