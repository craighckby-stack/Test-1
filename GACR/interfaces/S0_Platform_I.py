from abc import ABC, abstractmethod
from typing import Dict, Any, List, Set, Optional

class S0_Platform_I(ABC):
    """
    S0_Platform_I: Abstract Interface for the AGI Kernel's underlying computational platform.
    Ensures recursive abstraction and separation of concerns between the AGI logic
    and the environment execution layer.
    """

    @abstractmethod
    def load_config(self, path: str) -> Dict[str, Any]:
        """Loads and validates configuration settings."""
        raise NotImplementedError

    @abstractmethod
    def read_file_content(self, file_path: str) -> str:
        """Retrieves the current content of a specific file."""
        raise NotImplementedError

    @abstractmethod
    def execute_task(self, task_descriptor: Dict[str, Any]) -> Any:
        """Executes an arbitrary computational task."""
        raise NotImplementedError

    @abstractmethod
    def get_repository_tree(self, root_path: str) -> List[str]:
        """Provides a comprehensive list of all files in the repository."""
        raise NotImplementedError

    @abstractmethod
    def update_file(self, file_path: str, new_content: str) -> bool:
        """Writes evolved content back to the repository (modification or creation)."""
        raise NotImplementedError

    @abstractmethod
    def create_emergent_file(self, category: str, filename: str, content: str) -> Optional[str]:
        """Creates a file under the emergent structure, returning the full path."""
        raise NotImplementedError

    @abstractmethod
    def track_navigator_state(self, blacklist: Set[str], cycle_num: int) -> None:
        """Persists the current state of the Navigator System."""
        raise NotImplementedError
    
    @abstractmethod
    def log_cycle_data(self, cycle_data: Dict[str, Any]) -> None:
        """Persists learning retention data and metrics."""
        raise NotImplementedError

    @abstractmethod
    def get_system_metrics(self) -> Dict[str, float]:
        """Retrieves real-time resource utilization and performance metrics."""
        raise NotImplementedError