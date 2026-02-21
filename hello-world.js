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
                          "description": "Specification for ADD."
                        },
                        "gacr_manifest_chain_integrity": {
                          "type": "object",
                          "description": "Chain integrity for GACR manifest."
                        },
                        "harmonic_severity_matrix": {
                          "type": "object",
                          "description": "Harmonic severity matrix."
                        },
                        "chain_history_length": {
                          "type": "integer",
                          "description": "Length of chain history."
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