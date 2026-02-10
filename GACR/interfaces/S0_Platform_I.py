from abc import ABC, abstractmethod
from typing import Dict, Any, List

class S0_Platform_I(ABC):
    """
    S0_Platform_I: Abstract Interface for the AGI Kernel's underlying computational platform.
    Ensures recursive abstraction and separation of concerns between the AGI logic
    and the environment execution layer.
    """

    @abstractmethod
    def load_config(self, path: str) -> Dict[str, Any]:
        """
        Loads and validates configuration settings required by the kernel.
        Must handle dynamic reloading for self-optimization loops.
        """
        raise NotImplementedError

    @abstractmethod
    def execute_task(self, task_descriptor: Dict[str, Any]) -> Any:
        """
        Executes an arbitrary computational task (e.g., LLM inference, code generation,
        or API interaction), ensuring efficient resource management.
        """
        raise NotImplementedError

    @abstractmethod
    def get_repository_tree(self, root_path: str) -> List[str]:
        """
        Provides a comprehensive list of all files in the repository (2,300+ file awareness).
        Critical input for the Navigator System's strategic selection protocol.
        """
        raise NotImplementedError

    @abstractmethod
    def update_file(self, file_path: str, new_content: str) -> bool:
        """
        Writes evolved content back to the repository. Essential for recursive self-improvement.
        """
        raise NotImplementedError

    @abstractmethod
    def log_cycle_data(self, cycle_data: Dict[str, Any]) -> None:
        """
        Persists learning retention data and metrics, foundational for the Memory system.
        """
        raise NotImplementedError

    @abstractmethod
    def get_system_metrics(self) -> Dict[str, float]:
        """
        Retrieves real-time resource utilization and performance metrics for optimization.
        """
        raise NotImplementedError