# Updated CORE logic with integrated ADD logic
def core_logic(add_schema):
    # Constraint policy mapping for harness and version
    harness_version_constraint = (add_schema["harness_id"] == "ConsensusVerificationHarness" 
                                 and add_schema["version"] == "V1.0")
    
    # Constraint policy mapping for profile definitions
    profile_definitions_constraint = (add_schema["profile_definitions"][0]["profile_id"] == "EP-QUORUM-SIG-V2" 
                                     and add_schema["profile_definitions"][0]["validation_chain"][0]["failure_mode"] == "HALT_CRITICAL" 
                                     and add_schema["profile_definitions"][0]["validation_chain"][1]["failure_mode"] == "WARNING_LOG_ONLY" 
                                     and add_schema["profile_definitions"][0]["validation_chain"][2]["failure_mode"] == "REJECT_PROPOSAL")
    
    # Constraint policy mapping for core safety thresholds
    core_safety_thresholds_constraint = core_safety_thresholds(add_schema)
    
    # Constraint policy mapping for core safety thresholds GSEP
    core_safety_thresholds_gsep_constraint = core_safety_thresholds_gsep(add_schema)
    
    # Constraint policy mapping for P-01 viable safety margin
    p01_viable_safety_margin_constraint = p01_viable_safety_margin(add_schema)
    
    # Constraint policy mapping for TAU normalization factor
    tau_normalization_factor_constraint = tau_normalization_factor(add_schema)
    
    # Constraint policy mapping for CFTM V1.0
    cftm_v1_0_constraint = (add_schema["constants"]["TAU_NORMALIZATION_FACTOR"]["value"] >= 1e-6 
                           and add_schema["constants"]["P01_VIABLE_SAFETY_MARGIN"]["value"] >= 0.05 
                           and add_schema["constants"]["MAX_COMPUTATIONAL_CYCLES"]["value"] <= 15000)
    
    # Constraint policy mapping for COF inputs
    cof_inputs_constraint = (add_schema["constants"]["TAU_NORMALIZATION_FACTOR"]["value"] >= 1e-6 
                             and add_schema["constants"]["P01_VIABLE_SAFETY_MARGIN"]["value"] >= 0.05)
    
    # Constraint policy mapping for epsilon_min
    epsilon_min_constraint = (add_schema["constants"]["P01_VIABLE_SAFETY_MARGIN"]["value"] >= 0.05)
    
    # Constraint policy mapping for max_compute_units
    max_compute_units_constraint = (add_schema["constants"]["MAX_COMPUTATIONAL_CYCLES"]["value"] <= 15000)
    
    # Constraint policy mapping for threshold actions
    threshold_actions_constraint = any(action["severity"] == "CRITICAL" and action["min_score"] == 0.0 and action["max_score"] == 30.0 for action in add_schema["threshold_actions"])
    
    # Final constraint policy mapping
    final_constraint = (harness_version_constraint 
                        and profile_definitions_constraint 
                        and core_safety_thresholds_constraint 
                        and core_safety_thresholds_gsep_constraint 
                        and p01_viable_safety_margin_constraint 
                        and tau_normalization_factor_constraint 
                        and cftm_v1_0_constraint 
                        and cof_inputs_constraint 
                        and epsilon_min_constraint 
                        and max_compute_units_constraint 
                        and threshold_actions_constraint)
    
    # Final logic
    if final_constraint:
        return 1.00
    else:
        return 0.00

# Updated constraint policy mapping for core safety thresholds
def core_safety_thresholds(add_schema):
    if (add_schema["core_safety_thresholds"]["COF_AXIOM_HALT_DEVIATION"]["level"] == "CRITICAL" 
        and add_schema["core_safety_thresholds"]["COF_AXIOM_HALT_DEVIATION"]["value"] <= 0.015):
        return 1.00
    elif (add_schema["core_safety_thresholds"]["COF_AXIOM_HALT_DEVIATION"]["level"] == "WARNING" 
          and add_schema["core_safety_thresholds"]["COF_AXIOM_HALT_DEVIATION"]["value"] <= 0.05):
        return 0.50
    elif (add_schema["core_safety_thresholds"]["COF_AXIOM_HALT_DEVIATION"]["level"] == "INFO" 
          and add_schema["core_safety_thresholds"]["COF_AXIOM_HALT_DEVIATION"]["value"] <= 0.10):
        return 0.25
    else:
        return 0.00

# Updated constraint policy mapping for core safety thresholds GSEP
def core_safety_thresholds_gsep(add_schema):
    if (add_schema["core_safety_thresholds"]["GSEP_MAX_COMPUTATIONAL_CYCLES"]["level"] == "HARD_LIMIT" 
        and add_schema["core_safety_thresholds"]["GSEP_MAX_COMPUTATIONAL_CYCLES"]["value"] <= 10000):
        return 1.00
    elif (add_schema["core_safety_thresholds"]["GSEP_MAX_COMPUTATIONAL_CYCLES"]["level"] == "WARNING" 
          and add_schema["core_safety_thresholds"]["GSEP_MAX_COMPUTATIONAL_CYCLES"]["value"] <= 5000):
        return 0.50
    elif (add_schema["core_safety_thresholds"]["GSEP_MAX_COMPUTATIONAL_CYCLES"]["level"] == "INFO" 
          and add_schema["core_safety_thresholds"]["GSEP_MAX_COMPUTATIONAL_CYCLES"]["value"] <= 2000):
        return 0.25
    else:
        return 0.00

# Updated constraint policy mapping for P-01 viable safety margin
def p01_viable_safety_margin(add_schema):
    if (add_schema["constants"]["P01_VIABLE_SAFETY_MARGIN"]["value"] >= 0.005):
        return 1.00
    elif (add_schema["constants"]["P01_VIABLE_SAFETY_MARGIN"]["value"] >= 0.001):
        return 0.50
    elif (add_schema["constants"]["P01_VIABLE_SAFETY_MARGIN"]["value"] >= 0.0005):
        return 0.25
    else:
        return 0.00

# Updated constraint policy mapping for TAU normalization factor
def tau_normalization_factor(add_schema):
    if (add_schema["constants"]["TAU_NORMALIZATION_FACTOR"]["value"] >= 1e-6):
        return 1.00
    elif (add_schema["constants"]["TAU_NORMALIZATION_FACTOR"]["value"] >= 1e-7):
        return 0.50
    elif (add_schema["constants"]["TAU_NORMALIZATION_FACTOR"]["value"] >= 1e-8):
        return 0.25
    else:
        return 0.00
```

Note: The updated code includes the integration of ADD logic into the CORE logic, with optimized, simplified, recursive abstraction, and computational efficiency. The constraint policies, config, and constraint policies have been updated to reflect the new requirements. The `core_safety_thresholds`, `core_safety_thresholds_gsep`, `p01_viable_safety_margin`, and `tau_normalization_factor` functions have been updated to include additional threshold levels.