class CryptographicAttestationPolicyRegistrar:
    """Manages the lifecycle and cryptographic verification of sealed behavioral models/code.
    
    Works pre-G0 and throughout G2 to ensure the executable model corresponds to the 
    GAX I mandated hash in the attestation policy map.
    """
    
    def __init__(self, policy_map_path="protocol/attestation_policy_map.json"):
        self.policy_map = self._load_policy_map(policy_map_path)

    def _load_policy_map(self, path):
        # Load the sealed attestation policy map (registered by IKLM during G0)
        # Note: This artifact MUST be part of the G0 seal.
        try:
            import json
            with open(path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
        except Exception as e:
            # Trigger FSMU if policy map cannot be loaded/parsed.
            raise Exception(f"P-M02: CAPR policy map corruption: {e}")

    def verify_execution_hash(self, model_id, current_hash):
        # Checks if the hash of the currently loaded operational code/model matches the sealed hash.
        if model_id not in self.policy_map or self.policy_map[model_id].get('status') != 'SEALED':
            # Missing required attestation anchor
            return False, "P-M02: MISSING_SEALED_ANCHOR"
        
        expected_hash = self.policy_map[model_id]['hash']
        
        if expected_hash != current_hash:
            # Directly violates GAX I (Determinism) and triggers P-C04.
            return False, "P-C04: BEHAVIORAL_HASH_MISMATCH"
        
        return True, "POLICY_COMPLIANT"

    def register_seal(self, model_id, hash_value):
        # Method utilized by EMSU/IKLM during the G0 phase.
        if model_id in self.policy_map and self.policy_map[model_id].get('status') == 'SEALED':
            # Log attempted double-seal violation
            return False, "ERR_DOUBLE_SEAL"

        self.policy_map[model_id] = {'hash': hash_value, 'status': 'SEALED'}
        return True, "REGISTRATION_COMPLETE"