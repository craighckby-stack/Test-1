from typing import Dict, Union, Final

# Type alias for clarity
CBM_Limits = Dict[str, Union[int, float]]

# --------------------------------------------------------------------------
# L2_COMPUTATIONAL_BOUNDEDNESS_LIMITS
# Defines the maximum static/estimated resources an SST can require before CBM vetoes.
# These limits are calibrated based on target hardware and safety requirements (S-02 risk mitigation).
# --------------------------------------------------------------------------

CBM_DEFAULT_LIMITS: Final[CBM_Limits] = {
    # General Complexity Metrics
    "complexity_budget": 0.85,       # Maximum normalized complexity_score allowed (0.0 to 1.0)
    
    # Structural Size Limits
    "max_size_bytes": 1048576,       # 1MB Maximum raw byte size of the SST manifest

    # Execution Flow Limits (Static Estimates)
    "max_estimated_depth": 7,        # Maximum estimated recursive or logical execution depth
    "max_required_tokens": 50000,    # Estimated maximum number of high-level instruction tokens
}

