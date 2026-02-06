from enum import Enum

class ConstraintKey(Enum):
    """Enumerates standardized keys for S-04 constraint components and total metric."""
    
    # Constraint components (must match keys used in SCOR._constraint_vector)
    COUPLING_PENALTY = "CPL_PNT"
    RESOURCE_DEBT = "RSC_DBT"
    POLICY_DEVIATION = "PLC_DEV"
    
    # Standard S-Metric Key
    S04_TOTAL = "S-04"