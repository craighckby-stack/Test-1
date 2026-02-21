CORE:
// ...[TRUNCATED]
          },
          "remediation_plan_ref": "VRRP-2C"
        }
      ]
    },
    {
      "policy_id": "GCP_104",
      "policy_name": "Governance Emergency Interlock Definition",
      "policy_target_asset": "GEIDM",
      "constraints": [
        {
          "constraint_id": "GCM_2_4",
          "priority": {
            "risk_level": "CRITICAL",
            "severity_score": 100
          },
          "trigger_condition": {
            "asset_id": "GEIDM",
            "violation_vector": "NEG_V_AUTHORIZATION"
          },
          "remediation_plan_ref": "VRRP-2D"
        }
      ]
    }
  ],
  "vrrm_configuration": {
    "type": "VRRM_CONFIGURATION",
    "source": "assets/VRRM-V3.0",
    "unit": "CONFIGURATION",
    "data_type": "JSON",
    "aggregation": "MAX",
    "storage_policy": "PERMANENT",
    "optimize_goal": "MAXIMIZE"
  },
  "ahmid_veto_triggers": {
    "type": "OPTIMIZATION_GOAL",
    "source": "assets/GAX/AHMID_VETO_TRIGGERS.json",
    "unit": "TRIGGER",
    "data_type": "BOOLEAN",
    "aggregation": "MAX",
    "storage_policy": "PERMANENT",
    "optimize_goal": "MAXIMIZE"
  },
  "action_mapping_ref": "assets/GACR/HARM_Severity_Matrix.json",
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
  "success_rate_op": {
    "type": "QUALITY",
    "source": "ToolOrchestrator",
    "unit": "PERCENTAGE",
    "data_type": "FLOAT",
    "aggregation": "AVERAGE",
    "storage_policy": "HOT_30D",
    "optimize_goal": "MAXIMIZE"
  },
  "remediation_profiles": {
    "type": "VRRM_REMEDIATION_PLANS",
    "source": "assets/VRRP-V1.0",
    "unit": "PROFILE",
    "data_type": "JSON",
    "aggregation": "MAX",
    "storage_policy": "PERMANENT",
    "optimize_goal": "MAXIMIZE"
  },
  "add_configuration": {
    "schema_id": "GEIDM_V1.0",
    "description": "Governance Emergency Interlock Definition Manifest. Defines cryptographic requirements for HIL-T authorization, mandatory during SIH recovery.",
    "attestation_policy": {
      "minimum_signer_threshold": 3,
      "required_key_type": ["Secp256k1", "Ed25519"],
      "authorization_window_seconds": 300
    },
    "allowed_hac_identities": [
      {"identity": "HIL_OVR-A01", "cryptographic_root_hash": "sha256:...", "required_factors": ["MF1_HardwareToken", "MF2_GeoFenced" ]}
    ]
  },
  "add_specification": {
    "spec_id": "CALS_INDEX_V1.0",
    "log_specification_reference": "CALS_V1.0",
    "schema_definition_and_indexing": {
      "transaction_hash": {"type": "SHA256", "required": true, "indexing_priority": "PrimaryPartitionKey"},
      "timestamp_utc": {"type": "ISO8601", "required": true, "indexing_priority": "CompositeSortKey"},
      "sgs_pipeline_stage_id": {"type": "STRING", "required": true, "indexing_priority": "SecondaryIndex"},
      "triggering_input_digest": {"type": "SHA256", "required": true, "indexing_priority": "SecondaryIndex"},
      "ga_x_finality_result": {"type": "BOOLEAN_ENUM", "required": true, "indexing_priority": "TernaryIndex"}
    },
    "query_optimization_targets": [
      {"target_use_case": "Chronological_Replay", "fields": ["sgs_pipeline_stage_id", "timestamp_utc"]},
      {"target_use_case": "Tamper_Check_High_Velocity", "fields": ["transaction_hash", "gac_manifest_hash_at_time"]}
    ],
    "indexing_engine_id": "VectorDB/Quantum_Index_Engine_V5"
  }
}