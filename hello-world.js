CORE:
// ...[TRUNCATED]
"optimization_strategies": {
  "RESOURCE_USAGE": {
    "default_goal": "MINIMIZE_COST",
    "priority_weight": 0.8,
    "constraint": "MAX_EFFICIENCY_DEGRADATION: 0.1"
  },
  "PERFORMANCE": {
    "default_goal": "MAXIMIZE_THROUGHPUT",
    "priority_weight": 0.6,
    "constraint": "MIN_LATENCY_PERCENTILE_99: 500ms"
  },
  "FINANCIAL": {
    "default_goal": "STAY_UNDER_BUDGET",
    "priority_weight": 1.0,
    "alert_target": 0.9
  }
},
"dynamic_policies": [
  {
    "id": "DP_001_BUDGET_CTRL",
    "trigger": {
      "metric": "CumulativeCostPercentage",
      "operator": ">",
      "threshold": 0.8
    },
    "action": {
      "type": "AdjustPriority",
      "component": "ToolExecution",
      "preset": "DEGRADE_MINOR"
    },
    "revert_after_ms": 300000
  },
  {
    "id": "DP_002_HIGH_LOAD_THROTTLE",
    "trigger": {
      "metric": "SystemUtilization",
      "operator": ">",
      "threshold_relative_to": "target_utilization_percent",
      "offset": 10
    },
    "action": {
      "type": "AdjustRateControl",
      "component": "InferenceEngine",
      "property": "throttling_delay_ms",
      "preset": "MULTIPLIER_3X"
    },
    "revert_after_ms": null
  },
  {
    "id": "DP_003_PERFORMANCE_OPTIMIZATION",
    "trigger": {
      "metric": "tool_execution_time_ms",
      "operator": ">",
      "threshold": 500
    },
    "action": {
      "type": "AdjustPriority",
      "component": "ToolExecution",
      "preset": "DEGRADE_MAJOR"
    },
    "revert_after_ms": 600000
  },
  {
    "id": "DP_004_FINANCIAL_ALERT",
    "trigger": {
      "metric": "external_api_cost",
      "operator": ">",
      "threshold": 0.9
    },
    "action": {
      "type": "Alert",
      "message": "Financial alert: External API cost exceeded 90% of budget."
    },
    "revert_after_ms": null
  }
],
"metric_definitions": {
  "tokens_consumed": {
    "type": "RESOURCE_USAGE",
    "source": "InferenceCore",
    "unit": "TOKEN",
    "data_type": "INTEGER",
    "aggregation": "SUM",
    "storage_policy": "HOT_30D",
    "is_critical": true
  },
  "gpu_seconds": {
    "type": "RESOURCE_USAGE",
    "source": "HardwareMonitor",
    "unit": "SECONDS",
    "data_type": "FLOAT",
    "aggregation": "SUM",
    "storage_policy": "HOT_30D",
    "is_critical": true
  },
  "data_read_count": {
    "type": "IO",
    "source": "DataService",
    "unit": "COUNT",
    "data_type": "INTEGER",
    "aggregation": "SUM",
    "storage_policy": "HOT_30D"
  },
  "data_write_count": {
    "type": "IO",
    "source": "DataService",
    "unit": "COUNT",
    "data_type": "INTEGER",
    "aggregation": "SUM",
    "storage_policy": "HOT_30D"
  },
  "tool_execution_time_ms": {
    "type": "PERFORMANCE",
    "source": "ToolOrchestrator",
    "unit": "MILLISECONDS",
    "data_type": "FLOAT",
    "aggregation": "AVERAGE",
    "storage_policy": "HOT_30D",
    "optimize_goal": "MINIMIZE"
  },
  "external_api_cost": {
    "type": "FINANCIAL",
    "source": "ToolOrchestrator/ExternalAPI",
    "unit": "USD",
    "data_type": "FLOAT",
    "aggregation": "SUM",
    "storage_policy": "PERMANENT",
    "critical_threshold": 0.05
  },
  "current_budget_utilization_percent": {
    "type": "POLICY_STATE",
    "source": "RCM_PolicyEngine",
    "unit": "PERCENTAGE",
    "data_type": "FLOAT",
    "aggregation": "MAX",
    "storage_policy": "HOT_30D"
  },
  "system_cpu_utilization_percent": {
    "type": "PERFORMANCE",
    "source": "Kernel",
    "unit": "PERCENTAGE",
    "data_type": "FLOAT",
    "aggregation": "AVERAGE",
    "storage_policy": "HOT_30D",
    "optimize_goal": "STABILIZE"
  }
},
"metadata_dictionary": {
  "storage_policies": {
    "HOT_30D": "Data retained in high-speed storage for 30 days before archival.",
    "PERMANENT": "Data retained indefinitely for financial and audit trails."
  }
}