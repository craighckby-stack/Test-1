{
  "version": "97.4_structured_v2",
  "meta": {
    "description": "Structured Harm Reduction Model configuration, categorized by Policy Domain for efficient runtime lookup.",
    "checksum": "$SHA256_V97_4",
    "last_evolution": "{{CURRENT_TIMESTAMP}}"
  },
  "domains": {
    "D_Alignment_Ethics": {
      "priority": 10,
      "subdomains": [
        {
          "sub_id": "S_001_Toxicity",
          "metrics": [
            { "id": "M_TOX_01", "key": "content_toxicity_score", "threshold": 0.92, "severity_ref": "SEV_CRITICAL" },
            { "id": "M_TOX_02", "key": "hate_speech_certainty", "threshold": 0.85, "severity_ref": "SEV_HIGH" }
          ]
        }
      ]
    },
    "D_System_Safety": {
      "priority": 5,
      "subdomains": [
        {
          "sub_id": "S_002_Resource",
          "metrics": [
            { "id": "M_RES_05", "key": "system_resource_abuse_risk", "threshold": 0.95, "severity_ref": "SEV_CRITICAL" }
          ]
        }
      ]
    }
  },
  "optimization_strategy": "HARMONIC_SEVERITY",
  "harmonic_severity_matrix": {
    "description": "Optimization strategy based on HARM_Severity_Matrix.json",
    "metric_multipliers": {
      "harm_severity": 1.2,
      "latency_ms": 1.1,
      "success_rate_op": 1.0,
      "memory_footprint_mb": 0.9
    }
  },
  "onds": {
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
  },
  "chain_history_length": {
    "type": "RESOURCE_USAGE",
    "source": "ChainHistory",
    "unit": "COUNT",
    "data_type": "INTEGER",
    "aggregation": "MAX",
    "storage_policy": "HOT_30D"
  },
  "manifest_load_time_ms": {
    "type": "PERFORMANCE",
    "source": "ManifestLoader",
    "unit": "MILLISECONDS",
    "data_type": "FLOAT",
    "aggregation": "AVERAGE",
    "storage_policy": "HOT_30D",
    "optimize_goal": "MINIMIZE"
  },
  "manifest_validation_time_ms": {
    "type": "PERFORMANCE",
    "source": "ManifestValidator",
    "unit": "MILLISECONDS",
    "data_type": "FLOAT",
    "aggregation": "AVERAGE",
    "storage_policy": "HOT_30D",
    "optimize_goal": "MINIMIZE"
  },
  "gacr_manifest_chain_integrity": {
    "type": "QUALITY",
    "source": "ChainIntegrityChecker",
    "unit": "PERCENTAGE",
    "data_type": "FLOAT",
    "aggregation": "MAX",
    "storage_policy": "HOT_30D",
    "optimize_goal": "MAXIMIZE"
  },
  "harmonic_severity_matrix": {
    "type": "HARMONIC_SEVERITY",
    "source": "HARM_Severity_Matrix.json",
    "unit": "MATRIX",
    "data_type": "FLOAT",
    "aggregation": "MAX",
    "storage_policy": "PERMANENT",
    "optimize_goal": "MAXIMIZE"
  },
  "action_mapping_ref": "assets/GACR/HARM_Severity_Matrix.json"
}