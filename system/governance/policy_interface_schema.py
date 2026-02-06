from typing import TypedDict, Literal

# NOTE: These schemas enforce the communication contracts across all governing daemons (OLD, PCS, MHVA).

class STRResultSchema(TypedDict):
    """Schema for processed State Transition Receipt results stored by monitoring daemons."""
    success: bool 
    adtm_failed: bool # True if the Adaptive Threshold Management check specifically failed.

class GovernanceProposalSchema(TypedDict):
    """Standardized schema for adaptive governance tuning proposals (P1)."""
    GOVERNANCE_PROTOCOL: Literal["ADAPTIVE_TUNING_P1", "AUDIT_P2", "POLICY_FETCH"] 
    TARGET_POLICY_METRIC: str        
    DIRECTION: Literal["INCREASE", "DECREASE", "SET"] 
    CHANGE_VALUE: float              
    CURRENT_MONITOR_RATE: float      
    RATIONALE: str                   
    SOURCE_DAEMON: str               
    TIMESTAMP: float                 
    VERSION_EPOCH: str               
