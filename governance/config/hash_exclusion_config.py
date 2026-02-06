from typing import Dict, List, Any
import copy

# --- System Configuration ---

# Define paths within structured payloads that should be *excluded* from canonicalization and hashing.
# Exclusion is necessary for transient fields added between GSEP stages (e.g., timestamps, run IDs).
# Paths should be defined using dot notation (e.g., 'metadata.timestamp').
HASH_EXCLUSION_CONFIG: Dict[str, List[str]] = {
    # M-02 is the primary payload handled by PayloadManifestHashLock
    "M-02": [
        "system_metadata.timestamp_staged",
        "system_metadata.stage3_reviewer_id",
        "transient_runtime_id"
    ],
    "P-01": [
        "analysis_runtime.cpu_utilization",
        "analysis_runtime.run_duration_ms"
    ]
}

# ----------------------------

class HashExclusionUtility:
    """Provides utilities to clean/filter dictionaries based on globally defined exclusion rules.
    Ensures stable canonicalization for cryptographic hashing, even when transient data is present.
    """

    @staticmethod
    def get_exclusions(payload_type: str) -> List[str]:
        """Retrieves the list of canonicalization exclusions for a given payload type."""
        return HASH_EXCLUSION_CONFIG.get(payload_type, [])

    @staticmethod
    def _delete_path(data: Dict[str, Any], path: str):
        """Internal helper to traverse a dictionary using dot notation and delete a nested key."""
        keys = path.split('.')
        current = data
        for i, key in enumerate(keys):
            if not isinstance(current, dict) or key not in current:
                return 
            
            if i == len(keys) - 1:
                del current[key]
                return
                
            current = current.get(key)

    @staticmethod
    def apply_exclusions(data: Dict[str, Any], payload_type: str) -> Dict[str, Any]:
        """Deep copies the data and removes excluded fields before canonicalization, 
        ensuring the original data structure is unaffected.
        """
        # Always operate on a deep copy to preserve the original payload state.
        cleaned_data = copy.deepcopy(data)
        
        exclusions = HashExclusionUtility.get_exclusions(payload_type)
        
        for path in exclusions:
            HashExclusionUtility._delete_path(cleaned_data, path)
            
        return cleaned_data
