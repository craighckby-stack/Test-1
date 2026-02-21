{
  "schema_version": "COMPUTE_V3.0",
  "metadata": {
    "definition": "Defines structured cost, performance, and scaling properties for available compute classes, optimized for autonomous AGI resource allocation.",
    "priority_tiers": {
      "1": "Critical/Foundational (L1)",
      "2": "High Performance/Operational (L2)",
      "3": "Standard/Burst/Utility (L3)"
    }
  },
  "compute_classes": {
    "CPU_STD_BURST": {
      "architecture_type": "CPU",
      "description": "Standard CPU Cluster, burstable low-latency batch processing (L3 Tier). Ideal for low-load utilities.",
      "priority_tier": 3,
      "scalability_model": "Elastic_Burst",
      "performance_metrics": {
        "theoretical_peak_gigaflops": 500,
        "max_concurrent_tasks": 500,
        "expected_p95_latency_ms": 150
      },
      "cost_metrics": {
        "base_usd_per_second": 0.00001,
        "cost_per_million_input_tokens_usd": 0.02,
        "storage_gb_per_sec_cost": 0.0000005,
        "efficiency_score": 0.4
      },
      "hardware_specifications": {
        "hardware_tag": "CPU_Standard"
      }
    },
    "GPU_MID_ACCEL": {
      "architecture_type": "GPU",
      "description": "Mid-tier GPU Acceleration (A100 equivalent). Optimized for L2 operational models.",
      "priority_tier": 2,
      "scalability_model": "Managed_Scale",
      "performance_metrics": {
        "theoretical_peak_gigaflops": 80000,
        "max_concurrent_tasks": 3000,
        "expected_p95_latency_ms": 50
      },
      "cost_metrics": {
        "base_usd_per_second": 0.00015,
        "cost_per_million_input_tokens_usd": 0.05,
        "storage_gb_per_sec_cost": 0.0000015,
        "efficiency_score": 0.7
      },
      "hardware_specifications": {
        "hardware_tag": "GPU_High_Mem"
      }
    },
    "TPU_HI_DEDICATED": {
      "architecture_type": "TPU",
      "description": "Dedicated High Parallelism TPU Array (L1 Tier). Best for core foundational models and training.",
      "priority_tier": 1,
      "scalability_model": "Dedicated_Fixed",
      "performance_metrics": {
        "theoretical_peak_gigaflops": 250000,
        "max_concurrent_tasks": 15000,
        "expected_p95_latency_ms": 20
      },
      "cost_metrics": {
        "base_usd_per_second": 0.00050,
        "cost_per_million_input_tokens_usd": 0.0333,
        "storage_gb_per_sec_cost": 0.0000025,
        "efficiency_score": 0.95
      },
      "hardware_specifications": {
        "hardware_tag": "TPU_Dedicated"
      }
    }
  },
  "input_preprocessing": {
    "enabled": true,
    "scaling_method": "MinMaxScaler",
    "normalization_range": [0, 1]
  },
  "alerting_config": {
    "enabled": true,
    "reference_metric": "PredictedNormalizedCost",
    "thresholds": {
      "warning": 0.85,
      "critical": 0.98,
      "kill_switch": 1.10
    }
  },
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
            "R": "read_count",
            "W": "write_count"
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
            "E": "external_cost",
            "M": "execution_time_ms"
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
    ]
  }
}