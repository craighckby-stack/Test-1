CORE:
{
  "asset_id": "VRRM-V3.0",
  "asset_type": "VRRM_CONFIGURATION",
  "schema_version": "3.0",
  "status": "AWAITING_REVIEW",
  "veto_policies": [
    {
      "policy_id": "GCP_101",
      "policy_name": "Axiomatic Safety Veto",
      "policy_target_asset": "PVLM",
      "constraints": [
        {
          "constraint_id": "GCM_2_1",
          "priority": {
            "risk_level": "CRITICAL",
            "severity_score": 100
          },
          "trigger_condition": {
            "asset_id": "PVLM",
            "violation_vector": "NEG_V_POLICY"
          },
          "remediation_plan_ref": "VRRP-2A"
        }
      ]
    },
    {
      "policy_id": "GCP_102",
      "policy_name": "Stability Degradation Veto",
      "policy_target_asset": "MPAM",
      "constraints": [
        {
          "constraint_id": "GCM_2_2",
          "priority": {
            "risk_level": "HIGH",
            "severity_score": 90
          },
          "trigger_condition": {
            "asset_id": "MPAM",
            "violation_vector": "NEG_V_STABILITY"
          },
          "remediation_plan_ref": "VRRP-2B"
        }
      ]
    },
    {
      "policy_id": "GCP_103",
      "policy_name": "Adaptive Behavior Monitoring",
      "policy_target_asset": "ADTM",
      "constraints": [
        {
          "constraint_id": "GCM_2_3",
          "priority": {
            "risk_level": "MODERATE",
            "severity_score": 80
          },
          "trigger_condition": {
            "asset_id": "ADTM",
            "violation_vector": "NEG_V_BEHAVIOR"
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
  }
}