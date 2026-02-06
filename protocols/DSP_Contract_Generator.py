# protocols/DSP_Contract_Generator.py

import json
from typing import Dict, Any, Literal, TypedDict

# --- Standardized Type Definitions for System Clarity ---

FidelityLevel = Literal[1, 2, 3, 4, 5]
ScopeClassification = Literal['core', 'peripheral', 'minor', 'integration']
ImpactClassification = Literal['critical', 'high', 'medium', 'low', 'unclassified']

class MISPayloadMetadata(TypedDict):
    scope: ScopeClassification
    impact_classification: ImpactClassification

class MISPayload(TypedDict):
    id: str
    metadata: MISPayloadMetadata

class BudgetConstraints(TypedDict):
    duration_seconds: int
    cpu_allocation: float
    memory_gb: float

class GTCMConfig(TypedDict):
    simulation_fidelity_map: Dict[str, FidelityLevel]
    resource_budgets: Dict[str, BudgetConstraints]

class DSPContract(TypedDict):
    contract_version: str
    mandate_id: str
    required_fidelity_level: FidelityLevel
    sem_constraints: BudgetConstraints
    required_outputs: list[str]

# --- Constants ---

DEFAULT_BUDGET: BudgetConstraints = {
    'duration_seconds': 60,
    'cpu_allocation': 0.5,
    'memory_gb': 4.0
}

# NOTE: In production, the core mapping logic is externalized (see scaffold proposal)
# This function acts as a centralized access point for the required fidelity key.
def derive_fidelity_key(impact: ImpactClassification, scope: ScopeClassification) -> str:
    """Determines the configuration key based on MIS classification parameters."""
    # 1. Highest Priority Critical Core Change
    if impact == 'critical' and scope == 'core':
        return 'high_critical'
    # 2. Medium/High Impact changes
    elif impact in ['high', 'critical']:
        return 'medium_high'
    # 3. Default structural changes
    elif impact == 'medium':
        return 'medium_default'
    # 4. Low Impact/Catch-all
    else:
        return 'low_default'


def generate_dsp_contract(mis_payload: MISPayload, gtcm_config: GTCMConfig) -> DSPContract:
    """Analyzes the MIS payload against GTCM constraints to generate a DSP Contract (DSP-C).
       The DSP-C dictates the required fidelity, duration, and computational resource allocation.
    """
    
    metadata = mis_payload.get('metadata', {})
    
    # 1. Complexity Assessment
    # Use robust defaults to prevent dictionary access errors
    change_scope: ScopeClassification = metadata.get('scope', 'minor')
    impact_vector: ImpactClassification = metadata.get('impact_classification', 'low')

    fidelity_key = derive_fidelity_key(impact_vector, change_scope)

    # 2. Derive Fidelity Level (Mapped from GTCM)
    fidelity_map = gtcm_config.get('simulation_fidelity_map', {})
    # Default to 1 (Minimum) if the key is missing in configuration
    fidelity_level: FidelityLevel = fidelity_map.get(fidelity_key, 1)

    # 3. Resource and Time Budget Lookup
    budget_key = str(fidelity_level) # Ensure lookup uses string key
    resource_budgets = gtcm_config.get('resource_budgets', {})
    
    budget_config: BudgetConstraints = resource_budgets.get(budget_key, DEFAULT_BUDGET)
    
    dsp_contract: DSPContract = {
        "contract_version": "2.0",
        "mandate_id": mis_payload.get('id', 'GEN-MIS-N/A'),
        "required_fidelity_level": fidelity_level,
        "sem_constraints": budget_config,
        "required_outputs": ["S-01", "S-02", "HMC_certified", "V&V_log"]
    }
    
    return dsp_contract

if __name__ == '__main__':
    # Example integration test placeholder
    pass