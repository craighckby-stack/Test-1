from typing import Dict, List, Any
import time
import logging

logger = logging.getLogger(__name__)

class SourceTrustHistoryLedger:
    """
    STHL: Manages and updates dynamic trust scores for all known telemetry providers.
    Scores (0.0 to 1.0) are adjusted based on historical performance, divergence from consensus,
    integrity failures, and latency. TCRM uses these scores to apply dynamic weighting.
    """
    def __init__(self, persistence_layer: Any = None, decay_rate: float = 0.99):
        # persistence_layer could be a database API, key-value store, etc.
        self.persistence = persistence_layer
        self.decay_rate = decay_rate
        self.trust_cache: Dict[str, Dict] = {}

    def get_current_trust_score(self, source_id: str) -> float:
        """
        Retrieves the current normalized trust score. Applies temporal decay.
        """
        if source_id not in self.trust_cache:
            # Fetch initial state, assuming a default neutral score if not found in persistence
            # In a real system, this would load from self.persistence
            initial_data = {'score': 0.5, 'last_update': time.time()}
            self.trust_cache[source_id] = initial_data
            
        data = self.trust_cache[source_id]
        
        # Apply temporal decay
        elapsed = time.time() - data['last_update']
        decay_factor = self.decay_rate ** (elapsed / 3600) # Decay per hour
        current_score = data['score'] * decay_factor
        
        # Ensure bounds
        return max(current_score, 0.1)

    def update_score_on_reconciliation(self, source_id: str, success: bool, divergence_metric: float, consensus_median: float):
        """
        Adjusts the score based on the overall outcome of a TCRM reconciliation cycle.
        A full implementation requires individual deviation checks, but this stub uses overall outcome.
        """
        current_score = self.get_current_trust_score(source_id)
        adjustment = 0.0
        
        # Positive adjustment for consensus success (scaled inversely by overall divergence metric)
        if success:
            adjustment = (1.0 - min(1.0, divergence_metric * 10)) * 0.01 
        else:
            # Significant penalty for contributing to or failing during a consensus break
            adjustment = -0.05 

        new_score = max(0.0, min(1.0, current_score + adjustment))
        self.trust_cache[source_id] = {'score': new_score, 'last_update': time.time()}
        logger.debug(f"STHL updated score for {source_id}: {current_score:.3f} -> {new_score:.3f}")

    def record_integrity_failure(self, source_id: str):
        """
        Penalty for failing basic validation (e.g., schema, cryptographic hash check).
        """
        current_score = self.get_current_trust_score(source_id)
        penalty = 0.2 
        new_score = max(0.0, current_score - penalty)
        self.trust_cache[source_id] = {'score': new_score, 'last_update': time.time()}
