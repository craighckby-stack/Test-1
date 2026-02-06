from pydantic import BaseModel, Field, conint, conlist
from typing import Dict, List, Optional

class StageConfig(BaseModel):
    """Configuration for a specific autonomous stage."""
    workers: conint(ge=1, le=16) = Field(..., description="Number of parallel workers for this stage.")
    strategy: str = Field(..., description="The deployment or execution strategy (e.g., 'A/B testing', 'sequential').")
    timeout_ms: int = 5000

class SystemConfig(BaseModel):
    """The main system configuration schema, enforcing structure and validation."""
    environment: str = Field("development", description="Current operating environment (e.g., development, staging, production).")
    logging_level: str = Field("INFO", description="Standard logging level (DEBUG, INFO, WARNING, ERROR).")
    database_url: str = Field("sqlite:///./data.db", description="Connection string for the primary database.")
    
    stages: Dict[str, StageConfig] = Field(default_factory=dict, description="Configuration dictionary for specific processing stages.")
    
    enabled_features: conlist(str, min_length=0) = Field(default_factory=list, description="List of feature flags currently enabled.")

    class Config:
        extra = 'ignore' # Allow unspecified fields without crashing the application during load
