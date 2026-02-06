from typing import Dict, Any
from .SystemTelemetryProxy import SystemTelemetryProxy

class MockSystemTelemetryProxy(SystemTelemetryProxy):
    """
    A concrete implementation of the SystemTelemetryProxy protocol used for 
    testing, initial bootstrapping, or simulations when real monitoring is unavailable. 
    Provides fixed, representative placeholder values (the original implementation data).
    """
    
    def get_resource_forecast(self) -> Dict[str, float]:
        """
        Mock resource forecast used during development.
        """
        return {
            "cpu_load_baseline": 0.45,
            "memory_headroom": 2.5, 
            "i/o_latency_p95": 15.0 
        }
    
    def get_constraint_status(self) -> Dict[str, Any]:
        """
        Mock operational constraints status used during development.
        """
        return {
            "MAX_CONCURRENCY": 1024,
            "ACTIVE_VERSION_ID": "v94.0-stable",
            "SECURITY_MODE": "Hardened"
        }