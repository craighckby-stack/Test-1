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
  },
  "QUALITY": {
    "default_goal": "MAXIMIZE_SUCCESS_RATE",
    "priority_weight": 0.4,
    "constraint": "MIN_SUCCESS_RATE: 0.9"
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
  },
  {
    "id": "DP_005_QUALITY_OPTIMIZATION",
    "trigger": {
      "metric": "success_rate_op",
      "operator": "<",
      "threshold": 0.95
    },
    "action": {
      "type": "AdjustPriority",
      "component": "ToolExecution",
      "preset": "DEGRADE_MINOR"
    },
    "revert_after_ms": 300000
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
  },
  "latency_ms": {
    "type": "PERFORMANCE",
    "source": "ToolOrchestrator",
    "unit": "MILLISECONDS",
    "data_type": "FLOAT",
    "aggregation": "AVERAGE",
    "storage_policy": "HOT_30D",
    "optimize_goal": "MINIMIZE"
  },
  "token_ratio_input_output": {
    "type": "RESOURCE_USAGE",
    "source": "InferenceCore",
    "unit": "RATIO",
    "data_type": "FLOAT",
    "aggregation": "AVERAGE",
    "storage_policy": "HOT_30D",
    "optimize_goal": "MAXIMIZE"
  },
  "memory_footprint_mb": {
    "type": "RESOURCE_USAGE",
    "source": "InferenceCore",
    "unit": "MEGABYTES",
    "data_type": "FLOAT",
    "aggregation": "AVERAGE",
    "storage_policy": "HOT_30D",
    "optimize_goal": "MINIMIZE"
  },
  "success_rate_op": {
    "type": "QUALITY",
    "source": "ToolOrchestrator",
    "unit": "PERCENTAGE",
    "data_type": "FLOAT",
    "aggregation": "AVERAGE",
    "storage_policy": "HOT_30D",
    "optimize_goal": "MAXIMIZE"
  }
},
"metadata_dictionary": {
  "storage_policies": {
    "HOT_30D": "Data retained in high-speed storage for 30 days before archival.",
    "PERMANENT": "Data retained indefinitely for financial and audit trails."
  }
},
"normalization": {
  "strategy": "TARGET_DEVIATION",
  "parameters": {
    "max_deviation_score": 0.2
  }
},
"profiles": {
  "standard_operational": {
    "description": "General task execution profile.",
    "metric_multipliers": {}
  },
  "deep_planning": {
    "description": "Prioritizes token and output quality over minor latency dips.",
    "metric_multipliers": {
      "latency_ms": 0.5,
      "token_ratio_input_output": 1.5,
      "success_rate_op": 1.2
    }
  },
  "critical_runtime": {
    "description": "High weight on hard performance metrics (latency, success rate).",
    "metric_multipliers": {
      "latency_ms": 1.8,
      "success_rate_op": 1.5,
      "memory_footprint_mb": 0.9
    }
  },
  "default_profile": "standard_operational"
},
"metrics": {
  "latency_ms": {
    "type": "performance",
    "direction": "minimize",
    "target_value": 150,
    "weight_base": 0.45
  },
  "token_ratio_input_output": {
    "type": "resource_usage",
    "direction": "maximize",
    "target_value": 0.35,
    "weight_base": 0.25
  },
  "memory_footprint_mb": {
    "type": "resource_usage",
    "direction": "minimize",
    "target_value": 1024,
    "weight_base": 0.15
  },
  "success_rate_op": {
    "type": "quality",
    "direction": "maximize",
    "target_value": 0.99,
    "weight_base": 0.15
  }
}