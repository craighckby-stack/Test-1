import json
from typing import Dict, Any, Optional

class ConfigurationManager:
    """Utility for standardized reading and writing of system configuration files (e.g., JSON/YAML)."""
    
    def __init__(self, config_path: str):
        self.config_path = config_path
        self._config: Optional[Dict[str, Any]] = None

    def get_config(self) -> Dict[str, Any]:
        """Reads and returns the configuration from the file path."""
        if self._config is not None:
            return self._config
        
        try:
            with open(self.config_path, 'r') as f:
                self._config = json.load(f)
                return self._config
        except FileNotFoundError:
            print(f"[ERROR] Configuration file not found at {self.config_path}. Returning empty config.")
            return {}
        except json.JSONDecodeError:
            print(f"[ERROR] Invalid JSON format in {self.config_path}. Returning empty config.")
            return {}

    def save_config(self, new_config: Dict[str, Any]):
        """Writes the updated configuration back to the file path."""
        try:
            with open(self.config_path, 'w') as f:
                json.dump(new_config, f, indent=4)
            self._config = new_config # Update internal cache
        except IOError as e:
            print(f"[ERROR] Could not write configuration to {self.config_path}: {e}")

    def get_stage_config(self, stage_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves configuration specific to a stage."""
        config = self.get_config()
        return config.get('stages', {}).get(stage_id)
