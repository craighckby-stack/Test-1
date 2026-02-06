from typing import Dict, Any, Protocol

class SystemTelemetryProxy(Protocol):
    """
    Contract interface for fetching real-time and projected system operational 
    context (SCR inputs), essential for grounding CEM decisions in tangible system 
    constraints. Implementations must adhere to this contract.

    A concrete implementation (e.g., using actual system monitoring APIs) 
    or a mock must be provided where this proxy is utilized.
    """

    def get_resource_forecast(self) -> Dict[str, float]:
        """
        Provides projected resource utilization metrics for the next evolution cycle.
        Expected keys: 'cpu_load_baseline', 'memory_headroom', 'i/o_latency_p95'.
        """
        ...

    def get_constraint_status(self) -> Dict[str, Any]:
        """
        Fetches current explicit operational constraints active in the system.
        Expected keys: 'MAX_CONCURRENCY', 'ACTIVE_VERSION_ID', 'SECURITY_MODE'.
        """
        ...
