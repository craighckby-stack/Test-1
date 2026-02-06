from abc import ABC, abstractmethod
from typing import Dict, Any, List

class AbstractSystemActionExecutor(ABC):
    """
    Defines the standard contract for executing enforcement actions across the system.
    Concrete implementations (e.g., K8sExecutor, BareMetalExecutor) must inherit this class.
    """

    @abstractmethod
    def isolate_process(self, action: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Isolates the identified faulty process/entity (network, resource, access restrictions)."""
        pass

    @abstractmethod
    def trigger_root_audit(self, action: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Initiates a deep, low-level audit based on violation context."""
        pass

    @abstractmethod
    def notify_human(self, action: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Sends alerts to human operators (via pager, email, slack)."""
        pass

    @abstractmethod
    def throttle_quota(self, action: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Limits resource usage for the identified entity."""
        pass

    @abstractmethod
    def revert_state(self, action: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Attempts rollback to a known good state or snapshot."""
        pass

    @abstractmethod
    def retry_processing(self, action: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Reschedules the current task or workload for retry after potential fix."""
        pass

# NOTE: A concrete implementation (e.g., DefaultActionExecutor) would implement these methods,
# utilizing system APIs, monitoring agents, and communication services.