from typing import TypedDict, Final

# --- Typed Definitions for CBM Limits ---
class CBMLimits(TypedDict, total=True):
    """
    Defines the strict structure and expected types for the Computational Boundedness Limits.
    """
    # General Complexity Metrics (float 0.0 to 1.0)
    complexity_budget: float       
    
    # Structural Size Limits (bytes/int)
    max_size_bytes: int            

    # Execution Flow Limits (Static Estimates - int)
    max_estimated_depth: int       
    max_required_tokens: int       


# --------------------------------------------------------------------------
# L2_COMPUTATIONAL_BOUNDEDNESS_LIMITS
# Defines the maximum static/estimated resources an SST (Self-Stabilizing Task) 
# can require before CBM vetoes. These limits are calibrated based on target 
# hardware and safety requirements (S-02 risk mitigation).
# --------------------------------------------------------------------------

CBM_DEFAULT_LIMITS: Final[CBMLimits] = {
    # General Complexity Metrics
    "complexity_budget": 0.85,       # Maximum normalized complexity_score allowed (0.0 to 1.0)
    
    # Structural Size Limits
    "max_size_bytes": 1048576,       # 1MB (2^20) Maximum raw byte size of the SST manifest

    # Execution Flow Limits (Static Estimates)
    "max_estimated_depth": 7,        # Maximum estimated recursive or logical execution depth
    "max_required_tokens": 50000,    # Estimated maximum number of high-level instruction tokens
}