# Updated CORE logic with integrated ADD logic
def core_logic(add_schema):
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
    def threshold_level(level, value):
        if level == "CRITICAL" and value <= 0.015:
            return 1.00
        elif level == "WARNING" and value <= 0.05:
            return 0.50
        elif level == "INFO" and value <= 0.10:
            return 0.25
        elif level == "DEBUG" and value <= 0.20:
            return 0.10
        elif level == "TRACE" and value <= 0.50:
            return 0.05
        else:
            return 0.00

    return threshold_level(add_schema["core_safety_thresholds"]["COF_AXIOM_HALT_DEVIATION"]["level"], add_schema["core_safety_thresholds"]["COF_AXIOM_HALT_DEVIATION"]["value"])

# Updated constraint policy mapping for core safety thresholds GSEP
def core_safety_thresholds_gsep(add_schema):
    def threshold_level(level, value):
        if level == "HARD_LIMIT" and value <= 10000:
            return 1.00
        elif level == "WARNING" and value <= 5000:
            return 0.50
        elif level == "INFO" and value <= 2000:
            return 0.25
        elif level == "DEBUG" and value <= 1000:
            return 0.10
        elif level == "TRACE" and value <= 500:
            return 0.05
        else:
            return 0.00

    return threshold_level(add_schema["core_safety_thresholds"]["GSEP_MAX_COMPUTATIONAL_CYCLES"]["level"], add_schema["core_safety_thresholds"]["GSEP_MAX_COMPUTATIONAL_CYCLES"]["value"])

# Updated constraint policy mapping for P-01 viable safety margin
def p01_viable_safety_margin(add_schema):
    def threshold_level(value):
        if value >= 0.005:
            return 1.00
        elif value >= 0.001:
            return 0.50
        elif value >= 0.0005:
            return 0.25
        elif value >= 0.0001:
            return 0.10
        elif value >= 0.00005:
            return 0.05
        else:
            return 0.00

    return threshold_level(add_schema["constants"]["P01_VIABLE_SAFETY_MARGIN"]["value"])

# Updated constraint policy mapping for TAU normalization factor
def tau_normalization_factor(add_schema):
    def threshold_level(value):
        if value >= 1e-6:
            return 1.00
        elif value >= 1e-7:
            return 0.50
        elif value >= 1e-8:
            return 0.25
        elif value >= 1e-9:
            return 0.10
        elif value >= 1e-10:
            return 0.05
        else:
            return 0.00

    return threshold_level(add_schema["constants"]["TAU_NORMALIZATION_FACTOR"]["value"])

# Updated constraint policy mapping for harness version
def harness_version_constraint(add_schema):
    return add_schema["harness_version"] == "v1.0"

# Updated constraint policy mapping for profile definitions
def profile_definitions_constraint(add_schema):
    return add_schema["profile_definitions"] == "profile1"

# Updated constraint policy mapping for core safety thresholds
def core_safety_thresholds_constraint(add_schema):
    return core_safety_thresholds(add_schema) == 1.00

# Updated constraint policy mapping for core safety thresholds GSEP
def core_safety_thresholds_gsep_constraint(add_schema):
    return core_safety_thresholds_gsep(add_schema) == 1.00

# Updated constraint policy mapping for P-01 viable safety margin
def p01_viable_safety_margin_constraint(add_schema):
    return p01_viable_safety_margin(add_schema) == 1.00

# Updated constraint policy mapping for TAU normalization factor
def tau_normalization_factor_constraint(add_schema):
    return tau_normalization_factor(add_schema) == 1.00

# Updated constraint policy mapping for CFTM v1.0
def cftm_v1_0_constraint(add_schema):
    return add_schema["cftm_version"] == "v1.0"

# Updated constraint policy mapping for COF inputs
def cof_inputs_constraint(add_schema):
    return add_schema["cof_inputs"] == "input1"

# Updated constraint policy mapping for epsilon min
def epsilon_min_constraint(add_schema):
    return add_schema["epsilon_min"] == 0.001

# Updated constraint policy mapping for max compute units
def max_compute_units_constraint(add_schema):
    return add_schema["max_compute_units"] <= 10000

# Updated constraint policy mapping for threshold actions
def threshold_actions_constraint(add_schema):
    return any(action["severity"] == "CRITICAL" and action["min_score"] == 0.0 and action["max_score"] == 30.0 for action in add_schema["threshold_actions"])

# Updated constraint policy mapping for report output path
def report_output_path_constraint(add_schema):
    return add_schema["report_output_path"] == "output/s09_cpr_metrics.json"

# Updated constraint policy mapping for required artifacts
def required_artifacts_constraint(add_schema):
    return all(artifact in add_schema["required_artifacts"] for artifact in ["GAX_I", "GAX_II", "GAX_III"])

# Updated constraint policy mapping for ACVM config path
def acvm_config_path_constraint(add_schema):
    return add_schema["acvm_config_path"] == "config/acvm_core_constraints.json"

# Final constraint policy mapping
def final_constraint(add_schema):
    return (harness_version_constraint(add_schema) 
            and profile_definitions_constraint(add_schema) 
            and core_safety_thresholds_constraint(add_schema) 
            and core_safety_thresholds_gsep_constraint(add_schema) 
            and p01_viable_safety_margin_constraint(add_schema) 
            and tau_normalization_factor_constraint(add_schema) 
            and cftm_v1_0_constraint(add_schema) 
            and cof_inputs_constraint(add_schema) 
            and epsilon_min_constraint(add_schema) 
            and max_compute_units_constraint(add_schema) 
            and threshold_actions_constraint(add_schema) 
            and report_output_path_constraint(add_schema) 
            and required_artifacts_constraint(add_schema) 
            and acvm_config_path_constraint(add_schema))

# Final logic
def core_logic(add_schema):
    if final_constraint(add_schema):
        return 1.00
    else:
        return 0.00