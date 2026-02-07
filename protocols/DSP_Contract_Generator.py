# protocols/DSP_Contract_Generator.py

import json
from typing import Dict, Any, Literal, TypedDict, Union

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
    resource_budgets: Dict[str, BudgetConstraints] # Keys are str(FidelityLevel)

class DSPContract(TypedDict):
    contract_version: str
    mandate_id: str
    required_fidelity_level: FidelityLevel
    sem_constraints: BudgetConstraints
    required_outputs: list[str]

# --- Constants & Triage Logic Configuration ---

DEFAULT_BUDGET: BudgetConstraints = {
    'duration_seconds': 60,
    'cpu_allocation': 0.5,
    'memory_gb': 4.0
}

# Decoupled priority mapping for local execution, anticipating externalization (see scaffold).
# Keys prioritize (Impact, Scope) tuples over general Impact fallbacks.
FIDELITY_KEY_MAP: Dict[Union[tuple[ImpactClassification, ScopeClassification], ImpactClassification], str] = {
    # 1. Specific Direct Mappings (Priority Triage)
    ('critical', 'core'): 'high_critical',
    ('critical', 'integration'): 'critical_integration',
    
    # 2. General Impact Fallbacks (Severity Triage)
    'critical': 'medium_high', 
    'high': 'medium_high',     
    'medium': 'medium_default',
    
    # 3. Default Catch-all
    'low': 'low_default',
    'unclassified': 'low_default'
}

def derive_fidelity_key(impact: ImpactClassification, scope: ScopeClassification) -> str:
    """
    Derives the GTCM configuration key using a prioritized mapping based on 
    MIS classification (Impact and Scope).
    
    This function implements the hardcoded Triage Rules Engine (TRE) logic.
    """
    
    # 1. Check for specific Impact/Scope pairing
    pair_key = (impact, scope)
    if pair_key in FIDELITY_KEY_MAP:
        return FIDELITY_KEY_MAP[pair_key]
        
    # 2. Check for general Impact fallback
    if impact in FIDELITY_KEY_MAP:
        return FIDELITY_KEY_MAP[impact]
    
    # 3. Default Catch-all (Should be covered by map definition, but for safety)
    return 'low_default'

def generate_dsp_contract(mis_payload: MISPayload, gtcm_config: GTCMConfig) -> DSPContract:
    """
    Analyzes the MIS payload against GTCM constraints to generate a DSP Contract (DSP-C).
    The DSP-C dictates the required fidelity, duration, and computational resource allocation
    based on the triage mapping and system configuration.
    """
    
    metadata = mis_payload.get('metadata', {}) or {}
    
    # Robust defaulting for inputs
    change_scope: ScopeClassification = metadata.get('scope', 'minor')
    impact_vector: ImpactClassification = metadata.get('impact_classification', 'low')

    # 1. Complexity Assessment & Key Derivation
    fidelity_key = derive_fidelity_key(impact_vector, change_scope)

    # 2. Derive Fidelity Level (Mapped from GTCM)
    fidelity_map = gtcm_config.get('simulation_fidelity_map', {}) or {}
    # Default to 1 (Minimum) if the specific key is missing in GTCM config
    fidelity_level: FidelityLevel = fidelity_map.get(fidelity_key, 1)

    # 3. Resource and Time Budget Lookup
    budget_key = str(fidelity_level)
    resource_budgets = gtcm_config.get('resource_budgets', {}) or {}
    
    # Default to generic budget if fidelity level not configured
    budget_config: BudgetConstraints = resource_budgets.get(budget_key, DEFAULT_BUDGET)
    
    dsp_contract: DSPContract = {
        "contract_version": "2.1", 
        "mandate_id": mis_payload.get('id', 'GEN-MIS-N/A'),
        "required_fidelity_level": fidelity_level,
        "sem_constraints": budget_config,
        "required_outputs": ["SimulationArtifacts", "CertificationLog", "V&V_Metrics"] 
    }
    
    return dsp_contract

if __name__ == '__main__':
    # Example integration test placeholder
    
    TEST_GTCM_CONFIG: GTCMConfig = {
        "simulation_fidelity_map": {
            "high_critical": 5,
            "critical_integration": 4,
            "medium_high": 3,
            "medium_default": 2,
            "low_default": 1
        },
        "resource_budgets": {
            "5": {'duration_seconds': 300, 'cpu_allocation': 8.0, 'memory_gb': 64.0},
            "4": {'duration_seconds': 180, 'cpu_allocation': 4.0, 'memory_gb': 32.0},
            "3": {'duration_seconds': 120, 'cpu_allocation': 2.0, 'memory_gb': 16.0},
            "2": {'duration_seconds': 60, 'cpu_allocation': 1.0, 'memory_gb': 8.0},
            "1": DEFAULT_BUDGET
        }
    }
    
    mis_core_critical: MISPayload = {
        'id': 'MND-C001',
        'metadata': {
            'scope': 'core',
            'impact_classification': 'critical'
        }
    }

    contract = generate_dsp_contract(mis_core_critical, TEST_GTCM_CONFIG)
    print(json.dumps(contract, indent=4))
