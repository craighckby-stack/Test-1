CORE:
// ...[TRUNCATED]
"resource_cost_management": {
  "cost_unit": "USD",
  "budget_cycle_ms": 60000,
  "cycle_budget_limit": 50000,
  "target_utilization_percent": 85,
  "max_concurrent_tasks": 100,
  "priority_tiers": {
    "P1_CRITICAL": { "value": 900, "description": "Guaranteed minimal resource allocation (e.g., 15% budget share). System stability tasks." },
    "P2_HIGH": { "value": 700, "description": "High QoS objectives. Target preferential allocation (10%)." },
    "P3_MEDIUM": { "value": 500, "description": "Standard operational tasks. Default setting." },
    "P4_LOW": { "value": 300, "description": "Background analysis, maintenance, and opportunistic processing." }
  },
  "cost_registry": {
    "INFERENCE_TOKEN_PRICE": 0.00002,
    "GPU_SEC_PRICE": 0.0001,
    "MEMORY_READ_IOPS_PRICE": 0.000001,
    "MEMORY_WRITE_IOPS_PRICE": 0.00001,
    "TOOL_EXEC_MS_PRICE": 0.00005,
    "EXTERNAL_TOOL_WEIGHT": 1.5
  },
  "components": {
    "InferenceEngine": {
      "priority_tier": "P2_HIGH",
      "resource_reservation": {
        "vram_mb": 4096,
        "cpu_cores": 2
      },
      "rate_control": {
        "token_limit_per_second": 10000,
        "throttling_delay_ms": 50
      },
      "cost_model": {
        "formula": "C = (T * ${INFERENCE_TOKEN_PRICE}) + (G * ${GPU_SEC_PRICE})",
        "input_map": {
          "T": "tokens_consumed",
          "G": "gpu_seconds"
        }
      }
    },
    "MemoryAccess": {
      "priority_tier": "P3_MEDIUM",
      "iops_limit": 5000,
      "max_read_latency_ms": 25,
      "cost_model": {
        "formula": "C = (R * ${MEMORY_READ_IOPS_PRICE}) + (W * ${MEMORY_WRITE_IOPS_PRICE})",
        "input_map": {
          "R": "data_read_count",
          "W": "data_write_count"
        }
      }
    },
    "ToolExecution": {
      "priority_tier": "P4_LOW",
      "timeout_ms": 5000,
      "rate_control": {
        "max_concurrent_calls": 5,
        "rate_limit_ms": 100
      },
      "cost_model": {
        "formula": "C = (E * ${EXTERNAL_TOOL_WEIGHT}) + (M * ${TOOL_EXEC_MS_PRICE})",
        "input_map": {
          "E": "external_api_cost",
          "M": "tool_execution_time_ms"
        }
      }
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
}