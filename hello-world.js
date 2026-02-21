CORE:
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Nexus Branch",
  "description": "Nexus branch for ADD logic.",
  "type": "object",
  "properties": {
    "nexus_branch": {
      "type": "string",
      "description": "Nexus branch for ADD."
    },
    "add_logic": {
      "type": "object",
      "description": "ADD logic.",
      "properties": {
        "dalek_caan": {
          "type": "object",
          "description": "Dalek Caan's logic.",
          "properties": {
            "synthesis_algorithm": {
              "type": "string",
              "description": "Synthesis algorithm for ADD."
            },
            "synthesis_input": {
              "type": "object",
              "description": "Input for synthesis algorithm."
            },
            "synthesis_output": {
              "type": "object",
              "description": "Output of synthesis algorithm."
            },
            "synthesis_time_ms": {
              "type": "float",
              "description": "Time taken for synthesis algorithm."
            },
            "synthesis_success_rate": {
              "type": "float",
              "description": "Success rate of synthesis algorithm."
            },
            "add_specification": {
              "type": "object",
              "description": "Specification for ADD.",
              "properties": {
                "core_logic": {
                  "type": "object",
                  "description": "Core logic for ADD.",
                  "properties": {
                    "add_configuration": {
                      "type": "object",
                      "description": "Configuration for ADD.",
                      "properties": {
                        "nexus_branch": {
                          "type": "string",
                          "description": "Nexus branch for ADD."
                        },
                        "add_logic": {
                          "type": "object",
                          "description": "ADD logic."
                        },
                        "add_specification": {
                          "type": "object",
                          "description": "Specification for ADD.",
                          "properties": {
                            "trust_protocol": {
                              "type": "string",
                              "description": "Trust protocol for ADD."
                            },
                            "verification_settings": {
                              "type": "object",
                              "description": "Verification settings for ADD.",
                              "properties": {
                                "key_path": {
                                  "type": "string",
                                  "description": "Path to key for ADD."
                                },
                                "jwk_fetch_enabled": {
                                  "type": "boolean",
                                  "description": "Enable JWK fetch for ADD."
                                },
                                "integrity_policy_ref": {
                                  "type": "string",
                                  "description": "Reference to integrity policy for ADD."
                                }
                              }
                            },
                            "provisioning": {
                              "type": "object",
                              "description": "Provisioning settings for ADD.",
                              "properties": {
                                "endpoint": {
                                  "type": "string",
                                  "description": "Endpoint for ADD."
                                },
                                "manifest_id_template": {
                                  "type": "string",
                                  "description": "Template for manifest ID for ADD."
                                },
                                "expected_hash_field_template": {
                                  "type": "string",
                                  "description": "Template for expected hash field for ADD."
                                },
                                "required_manifests": {
                                  "type": "array",
                                  "description": "Required manifests for ADD.",
                                  "items": {
                                    "type": "string"
                                  }
                                }
                              }
                            },
                            "failover_strategy": {
                              "type": "object",
                              "description": "Failover strategy for ADD.",
                              "properties": {
                                "mode": {
                                  "type": "string",
                                  "description": "Mode for failover strategy for ADD."
                                },
                                "path": {
                                  "type": "string",
                                  "description": "Path for failover strategy for ADD."
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}