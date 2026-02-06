import json
import os
from typing import Dict, Any, Tuple

# Protocol Constants
class CAPRStatus:
    SEALED = "SEALED"
    
class CAPRError:
    MISSING_ANCHOR = "P-M02: MISSING_SEALED_ANCHOR"
    HASH_MISMATCH = "P-C04: BEHAVIORAL_HASH_MISMATCH"
    DOUBLE_SEAL = "P-G01: ERR_DOUBLE_SEAL_VIOLATION"
    POLICY_CORRUPTION = "P-M02: CAPR_POLICY_MAP_CORRUPTION"
    COMPLIANT = "POLICY_COMPLIANT"


class CryptographicAttestationPolicyRegistrar:
    """Manages the lifecycle and cryptographic verification of sealed behavioral models/code (GAX I Compliant).
    
    Works pre-G0 and throughout G2 to ensure the executable model corresponds to the 
    GAX I mandated cryptographic hash registered during the G0 phase.
    """
    
    def __init__(self, policy_map_path: str = "protocol/attestation_policy_map.json"):
        self.policy_map_path = policy_map_path
        self.policy_map: Dict[str, Any] = self._load_policy_map()

    def _load_policy_map(self) -> Dict[str, Any]:
        """Loads the sealed attestation policy map (artifact of G0)."""
        if not os.path.exists(self.policy_map_path):
            return {}
            
        try:
            with open(self.policy_map_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            # Trigger FSMU if policy map cannot be loaded/parsed.
            raise Exception(f"{CAPRError.POLICY_CORRUPTION}: JSON error during load: {e}")
        except Exception as e:
            raise Exception(f"{CAPRError.POLICY_CORRUPTION}: File system error: {e}")

    def _save_policy_map(self) -> None:
        """Persists the policy map to disk (Crucial for G0 state retention)."""
        os.makedirs(os.path.dirname(self.policy_map_path) or '.', exist_ok=True)
        try:
            with open(self.policy_map_path, 'w') as f:
                json.dump(self.policy_map, f, indent=4)
        except Exception as e:
            # High severity error: State persistence failed.
            raise IOError(f"P-E01: Failed to persist CAPR state to {self.policy_map_path}: {e}")

    def verify_execution_hash(self, model_id: str, current_hash: str) -> Tuple[bool, str]:
        """Checks if the currently loaded hash matches the sealed GAX I hash."""
        
        policy_data = self.policy_map.get(model_id)
        
        if not policy_data or policy_data.get('status') != CAPRStatus.SEALED:
            # Missing required attestation anchor
            return False, CAPRError.MISSING_ANCHOR
        
        expected_hash = policy_data.get('hash')
        
        if expected_hash is None or expected_hash != current_hash:
            # Directly violates GAX I (Determinism) and triggers P-C04.
            return False, CAPRError.HASH_MISMATCH
        
        return True, CAPRError.COMPLIANT

    def register_seal(self, model_id: str, hash_value: str) -> Tuple[bool, str]:
        """Registers a final, cryptographically verified hash during G0 phase. (Utilized by EMSU/IKLM)."""
        
        if model_id in self.policy_map and self.policy_map[model_id].get('status') == CAPRStatus.SEALED:
            # Log attempted double-seal violation
            return False, CAPRError.DOUBLE_SEAL

        self.policy_map[model_id] = {
            'hash': hash_value, 
            'status': CAPRStatus.SEALED
        }
        
        # Immediate persistence of critical G0 state
        try:
            self._save_policy_map()
        except Exception as e:
            return False, f"ERR_PERSISTENCE_FAIL: {str(e)}"
            
        return True, "REGISTRATION_COMPLETE"
