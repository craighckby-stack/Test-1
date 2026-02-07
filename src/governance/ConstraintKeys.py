from enum import StrEnum

class ConstraintKey(StrEnum):
    """Standardized keys for S-04 governance constraint components and total metric.
    
    These keys align with the structure required by the S-04 metric computation 
    and the SCOR._constraint_vector.
    """
    
    # --- Core Constraint Components ---
    # These map directly to input vectors used in metric aggregation.
    COUPLING_PENALTY = "CPL_PNT"
    RESOURCE_DEBT = "RSC_DBT"
    POLICY_DEVIATION = "PLC_DEV"
    
    # --- System Metrics (Aggregate) ---
    S04_TOTAL = "S-04"