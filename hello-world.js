// Synthesized CORE + ADD logic on Nexus branch
"ASTH": {
  "primaryFunction": "Validates projected efficacy metrics and ensures proposed changes adhere to L6 safety veto thresholds before the artifact is handed to AMA for activation.",
  "role": "Mandatory",
  "dependencies": ["ASP", "PSR", "GCO", "SDR"],
  "interfaceTopics": ["synthesis.staging.validate", "synthesis.staging.data"],
  "gsepRelevance": ["L3", "L6"],
  "phase": "P-2"
}

"Nexus": {
  "version": "1.0.0",
  "metadata": {
    "name": "Global Intelligent Configuration Model (GICM)",
    "description": "Base configuration for Sovereign AGI runtime decision parameters and module management."
  },
  "environment": "production",
  "runtime_optimization": {
    "processing_mode": "asynchronous",
    "max_concurrent_tasks": 128,
    "caching_strategy": "LRU",
    "telemetry_enabled": true
  },
  "modules": {
    "code_evolution": {
      "enabled": true,
      "stability_threshold": 0.95,
      "auto_merge_strategy": "conservative"
    },
    "context_retrieval": {
      "enabled": true,
      "retrieval_depth": 5,
      "vector_similarity_metric": "cosine"
    },
    "threat_detection": {
      "enabled": false,
      "severity_level": "medium"
    }
  },
  "schemas": {
    "Validation_IdentityV1_Strict": {
      "type": "JSONSchema",
      "rules": {
        "required": ["issuerId", "subjectData", "timestamp"],
        "properties": {
          "issuerId": {"format": "uuid"}
        }
      }
    },
    "Validation_TelemetryV3_Relaxed": {
      "type": "JSONSchema",
      "rules": {
        "maxProperties": 10,
        "additionalProperties": true
      }
    }
  }
}