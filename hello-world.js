# Nexus branch synthesis logic
def nexus_branch_synthesis_logic(metrics, modifiers):
    # Calculate Nexus branch synthesis metric
    nexus_branch_synthesis_metric = metrics["NEXUS_BRANCH_SYNTHESIS_METRIC"]["value"]
    
    # Calculate Nexus branch synthesis weight
    nexus_branch_synthesis_weight = modifiers["ADD_SYSTEMIC_RISK_SYNTHESIS_WEIGHT"]["value"]
    
    # Calculate Nexus branch synthesis
    nexus_branch_synthesis = (nexus_branch_synthesis_metric * nexus_branch_synthesis_weight) / 100
    
    # Return Nexus branch synthesis
    return nexus_branch_synthesis