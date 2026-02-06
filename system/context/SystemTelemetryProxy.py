from typing import Protocol, TypedDict, Any

# --- Strict Definitions for Telemetry Payloads ---

class ResourceForecast(TypedDict):
    """Predicted resource utilization for the upcoming evolution cycle."""
    cpu_load_baseline: float      # Projected CPU usage (0.0 to 1.0)
    memory_headroom_gb: float     # Available RAM headroom in GB
    io_latency_p95_ms: float      # Projected 95th percentile I/O latency in milliseconds
    disk_utilization_ratio: float # Projected storage saturation

class OperationalConstraints(TypedDict):
    """Current explicit operational and environmental constraints."""
    max_concurrency: int          # Maximum parallel operations allowed
    active_version_id: str        # The ID of the currently executing AGI version
    security_mode: str            # Current security posture (e.g., 'PERMISSIVE', 'LOCKED')
    storage_read_only: bool       # Indicates if persistent storage modification is currently disallowed

class SystemPerformanceIndicators(TypedDict):
    """Real-time performance metrics and health status."""
    error_rate_p1m: float         # Percentage of operational errors in the past minute
    thermal_status_celsius: float # Current key component thermal reading
    queue_depth_max: int          # Maximum length across all pending task queues
    uptime_seconds: int

# --- The Telemetry Proxy Protocol ---

class SystemTelemetryProxy(Protocol):
    """
    Contract interface for fetching real-time and projected system operational 
    context (SCR inputs), essential for grounding CEM decisions in tangible system 
    constraints. Implementations must adhere to this contract and ensure all data 
    structures conform to the defined TypedDicts.
    """

    def get_resource_forecast(self) -> ResourceForecast:
        """
        Provides strictly typed projected resource utilization metrics necessary 
        for preemptive capacity planning and risk assessment.
        """
        ...

    def get_operational_constraints(self) -> OperationalConstraints:
        """
        Fetches current explicit, mandatory operational constraints and environmental 
        settings that must govern execution planning.
        """
        ...
    
    def get_performance_indicators(self) -> SystemPerformanceIndicators:
        """
        Retrieves current real-time system performance health metrics crucial for 
        assessing operational stability and identifying immediate failure risks.
        """
        ...
