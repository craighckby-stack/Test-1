{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "http://sovereign-agi.io/governance/pesm_v95.3.json",
  "title": "Policy Evolution Schema Manifest (PESM)",
  "description": "Defines the mandatory structural constraints for all GACR policy assets (PVLM, CFTM, SBCM, etc.) during PEUP updates.",
  "type": "object",
  "required": ["metadata", "policy_version", "schema_enforcement_date"],
  "properties": {
    "metadata": {
      "type": "object",
      "required": ["asset_id", "agent_owner"],
      "properties": {
        "asset_id": {"type": "string", "description": "Canonical ID (e.g., PVLM, CFTM)"},
        "agent_owner": {"type": "string", "enum": ["GAX", "SGS"], "description": "The Triumvirate component responsible for policy enforcement."}
      }
    },
    "policy_version": {
      "type": "string",
      "pattern": "^v\\d+\\.\\d+$"
    },
    "schema_enforcement_date": {
      "type": "string",
      "format": "date-time"
    },
    "schema_definition": {
      "type": "object",
      "description": "The actual JSON schema enforcing structural validity of the target GACR asset.",
      "properties": {
        "aggregation": {"type": "string", "enum": ["MAX", "MIN", "AVERAGE"], "description": "Aggregation method for data."},
        "storage_policy": {"type": "string", "enum": ["PERMANENT", "HOT_30D"], "description": "Storage policy for data."},
        "optimize_goal": {"type": "string", "enum": ["MAXIMIZE", "MINIMIZE"], "description": "Optimization goal for data."},
        "type": {"type": "string", "enum": ["QUALITY", "PERFORMANCE", "HARMONIC_SEVERITY", "RESOURCE_USAGE", "VRRM_REMEDIATION_PLANS", "ADD_LOGIC"], "description": "Type of data."},
        "source": {"type": "string", "description": "Source of data."},
        "unit": {"type": "string", "description": "Unit of measurement for data."},
        "data_type": {"type": "string", "enum": ["FLOAT", "INTEGER", "JSON"], "description": "Data type of measurement for data."},
        "chain_history_length": {"type": "integer", "description": "Length of chain history."},
        "manifest_load_time_ms": {"type": "float", "description": "Time taken to load manifest."},
        "manifest_validation_time_ms": {"type": "float", "description": "Time taken to validate manifest."},
        "success_rate_op": {"type": "float", "description": "Success rate of operation."},
        "remediation_profiles": {"type": "json", "description": "Remediation profiles."},
        "add_configuration": {"type": "object", "description": "Configuration for ADD."},
        "add_specification": {"type": "object", "description": "Specification for ADD."},
        "gacr_manifest_chain_integrity": {"type": "object", "description": "Chain integrity for GACR manifest."},
        "harmonic_severity_matrix": {"type": "object", "description": "Harmonic severity matrix."},
        "chain_history_length": {"type": "integer", "description": "Length of chain history."}
      }
    }
  },
  "additionalProperties": false
}