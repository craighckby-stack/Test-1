# Apply Nexus branch synthesis based on ADD governance validation
if (add_schema["governance_validation"]["weight_sum_check"]["tolerance_mode"] == "STRICT" and \
   add_schema["governance_validation"]["score_range_global"]["min"] == 0.0 and \
   add_schema["governance_validation"]["score_range_global"]["max"] == 100.0):
    nexus_branch_synthesis += (nexus_branch_synthesis_metric * nexus_branch_synthesis_weight * 
                              (0.02))

# Apply Nexus branch synthesis based on ADD aggregation defaults
if (add_schema["aggregation_defaults"]["algorithm"] == "WeightedNormalizedMeanV3" and \
   add_schema["aggregation_defaults"]["normalization"]["min_output"] == 0.0 and \
   add_schema["aggregation_defaults"]["normalization"]["max_output"] == 100.0):
    nexus_branch_synthesis += (nexus_branch_synthesis_metric * nexus_branch_synthesis_weight * 
                              (0.03))

# Apply Nexus branch synthesis based on ADD threshold actions
if (len(add_schema["threshold_actions"]) > 1 and \
   any(action["severity"] == "CRITICAL" and action["min_score"] == 0.0 and action["max_score"] == 30.0 for action in add_schema["threshold_actions"])):
    nexus_branch_synthesis += (nexus_branch_synthesis_metric * nexus_branch_synthesis_weight * 
                              (0.04))

# Apply Nexus branch synthesis based on ADD threshold actions and governance validation
if (len(add_schema["threshold_actions"]) > 1 and \
   any(action["severity"] == "CRITICAL" and action["min_score"] == 0.0 and action["max_score"] == 30.0 for action in add_schema["threshold_actions"]) and \
   add_schema["governance_validation"]["weight_sum_check"]["tolerance_mode"] == "STRICT" and \
   add_schema["governance_validation"]["score_range_global"]["min"] == 0.0 and \
   add_schema["governance_validation"]["score_range_global"]["max"] == 100.0):
    nexus_branch_synthesis += (nexus_branch_synthesis_metric * nexus_branch_synthesis_weight * 
                              (0.06))