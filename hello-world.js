{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "GMCI_V97_2_SCHEMA",
  "title": "Governance Manifest Chain Indexer (GMCI)",
  "description": "Defines the mandatory structure for indexing, attesting, and verifying the active chain of GACR manifests on the host system. Crucial for low-latency CRoT signature verification during GSEP-C stages S0, S2, S7, and S9.",
  "type": "object",
  "properties": {
    "assetId": {
      "description": "The GACR ID (e.g., PVLM, HETM) this index file corresponds to.",
      "type": "string"
    },
    "activeVersion": {
      "description": "The semantic version string of the manifest currently active in memory.",
      "type": "string",
      "pattern": "^v\\d+\\.\\d+\\.\\d+$"
    },
    "manifestPath": {
      "description": "Local filesystem path to the actively loaded, CRoT-signed manifest file.",
      "type": "string"
    },
    "loadTimestamp": {
      "description": "Unix timestamp of when the active manifest was validated and loaded via CDVP.",
      "type": "integer"
    },
    "chainHistory": {
      "description": "A cryptographically linked list of previous verified versions, enabling rapid rollback and audit tracing.",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "version": {
            "type": "string"
          },
          "hashSHA256": {
            "description": "Hash of the file content, verified by CRoT.",
            "type": "string"
          },
          "signatureCRoT": {
            "description": "The CRoT agent's cryptographic signature over the manifest hash.",
            "type": "string"
          },
          "previousLinkHash": {
            "description": "Hash of the preceding item in the chainHistory array (used for integrity chaining).",
            "type": "string"
          }
        },
        "required": ["version", "hashSHA256", "signatureCRoT", "previousLinkHash"]
      }
    }
  },
  "required": ["assetId", "activeVersion", "manifestPath", "loadTimestamp", "chainHistory"]
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
  },
  "gacr_manifest_load_time_ms": {
    "type": "performance",
    "direction": "minimize",
    "target_value": 100,
    "weight_base": 0.3
  },
  "gacr_manifest_validation_time_ms": {
    "type": "performance",
    "direction": "minimize",
    "target_value": 50,
    "weight_base": 0.2
  },
  "gacr_manifest_chain_integrity": {
    "type": "quality",
    "direction": "maximize",
    "target_value": 1,
    "weight_base": 0.1
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
  "gacr_manifest_optimization": {
    "description": "Prioritizes GACR manifest loading and validation efficiency.",
    "metric_multipliers": {
      "gacr_manifest_load_time_ms": 1.5,
      "gacr_manifest_validation_time_ms": 1.2,
      "gacr_manifest_chain_integrity": 1.1
    }
  },
  "default_profile": "standard_operational"
},
"normalization": {
  "strategy": "TARGET_DEVIATION",
  "parameters": {
    "max_deviation_score": 0.2
  }
},
"metadata_dictionary": {
  "storage_policies": {
    "HOT_30D": "Data retained in high-speed storage for 30 days before archival.",
    "PERMANENT": "Data retained indefinitely for financial and audit trails."
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
}
}