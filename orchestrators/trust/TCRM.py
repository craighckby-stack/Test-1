import logging
from typing import List, Dict, Any, Tuple
import numpy as np

logger = logging.getLogger(__name__)

class TelemetryConsensusAndReconciliationModule:
    """
TCRM: Ensures high-integrity consensus among diverse, redundant telemetry providers.
Uses robust statistical methods (e.g., Weighted Median Absolute Deviation - WMAD) 
to mitigate sensor drift, input deviation, and manipulation before TIAR attestation 
is locked for critical execution gates (P-01, etc.).
    """
    
    # Define expected fields for input integrity validation
    REQUIRED_FIELDS = ['source_id', 'timestamp', 'value', 'integrity_hash'] 

    def __init__(self, trust_config: Dict, rgcm_api: Any, sthl_api: Any = None):
        self.config = trust_config
        self.rgcm = rgcm_api
        # Dependency: Source Trust History Ledger (STHL) for dynamic weighting
        self.sthl = sthl_api 
        self.divergence_threshold = self._load_threshold()
        self.reconciliation_method = trust_config.get('reconciliation_method', 'WMAD')
        
    def _load_threshold(self) -> float:
        """Attempts to load the critical divergence threshold from RGCM, falling back to configuration."""
        try:
            return self.rgcm.get_parameter('S0X_DIVERGENCE_MAX')
        except (AttributeError, KeyError):
            logger.warning("RGCM API missing or failed to fetch threshold. Using local configuration.")
            # Fallback to a critical low threshold for safety
            return self.config.get('default_divergence_max', 0.05) 

    def resolve_consensus(self, telemetry_inputs: List[Dict]) -> Dict:
        """
        Calculates consensus and returns a structured decision and diagnostic report.
        :param telemetry_inputs: A list of dicts, where each dict is data from one telemetry provider.
        :return: Consensus Report structure.
        """
        report = {
            "consensus_achieved": False,
            "accepted_value": None,
            "divergence_metric": None,
            "diagnostic_status": "PENDING",
            "failed_sources": []
        }
        
        # 1. Integrity Check and Filtering
        valid_data = []
        for data in telemetry_inputs:
            if self._validate_input(data):
                valid_data.append(data)
            else:
                source_id = data.get('source_id', 'UNKNOWN_SOURCE')
                report["failed_sources"].append(source_id)
                if self.sthl:
                    self.sthl.record_integrity_failure(source_id)

        min_required = self.config.get('min_required_sources', 2)
        if len(valid_data) < min_required:
            report["diagnostic_status"] = f"FAILURE: Insufficient valid telemetry sources ({len(valid_data)} < {min_required})."
            return report

        # 2. Semantic Reconciliation (Divergence Check)
        is_consensus, metric, accepted_value = self._calculate_robust_consensus(valid_data)
        
        report["accepted_value"] = accepted_value
        report["divergence_metric"] = metric
        report["consensus_achieved"] = is_consensus

        # 3. Post-Consensus Trust Update
        for data in valid_data:
            if self.sthl:
                self.sthl.update_score_on_reconciliation(
                    source_id=data['source_id'],
                    success=is_consensus,
                    divergence_metric=metric,
                    consensus_median=accepted_value
                )

        if is_consensus:
            report["diagnostic_status"] = "SUCCESS: Telemetry reconciled within tolerance."
        else:
            report["diagnostic_status"] = "FAILURE: Telemetry divergence exceeds allowed threshold."
        
        return report

    def _validate_input(self, data: Dict) -> bool:
        """Validates schema integrity and checks for cryptographic integrity (if required)."""
        if not all(field in data for field in self.REQUIRED_FIELDS):
            logger.error(f"Input failed schema validation. Missing fields in data from {data.get('source_id', 'UNKNOWN')}.")
            return False
        
        # PLACEHOLDER: Cryptographic integrity check (e.g., hash or signature verification)
        # if not self._verify_data_integrity(data['value'], data['integrity_hash']): return False
        
        return True

    def _get_source_weights(self, source_ids: List[str]) -> Dict[str, float]:
        """Retrieves dynamic weights from STHL or uses default equal weighting."""
        weights = {}
        if self.sthl:
            weights = {sid: self.sthl.get_current_trust_score(sid) for sid in source_ids}
        else:
            # Default: Equal weighting if STHL is unavailable
            N = len(source_ids)
            if N > 0:
                weights = {sid: 1.0 / N for sid in source_ids}
            
        # Normalize weights to sum to 1.0
        total_score = sum(weights.values())
        if total_score > 0:
            return {k: v / total_score for k, v in weights.items()}
        
        # If normalization fails (e.g., all sources hit min 0.1 score and total is tiny), use equal weighting fallback
        N = len(source_ids)
        return {sid: 1.0 / N for sid in source_ids}

    def _calculate_robust_consensus(self, data_list: List[Dict]) -> Tuple[bool, float, float]:
        """
        Applies the Weighted Median Absolute Deviation (WMAD) to determine coherence.
        """
        source_ids = [d['source_id'] for d in data_list]
        values = np.array([d['value'] for d in data_list])
        weights = self._get_source_weights(source_ids)
        weight_list = np.array([weights[sid] for sid in source_ids])

        # 1. Accepted Value (Robust Central Tendency: Weighted Median)
        sorted_indices = np.argsort(values)
        sorted_weights = weight_list[sorted_indices]
        cumulative_weights = np.cumsum(sorted_weights)
        
        median_index = np.where(cumulative_weights >= 0.5)[0][0]
        accepted_value = values[sorted_indices[median_index]]
        
        # 2. Robust Spread (WMAD)
        deviations = np.abs(values - accepted_value)
        
        # Calculate the weighted median of the deviations
        sorted_indices_dev = np.argsort(deviations)
        sorted_weights_dev = weight_list[sorted_indices_dev]
        cumulative_weights_dev = np.cumsum(sorted_weights_dev)
        
        median_deviation_index = np.where(cumulative_weights_dev >= 0.5)[0][0]
        weighted_mad = deviations[sorted_indices_dev[median_deviation_index]]

        # Apply scaling factor for statistical consistency (1.4826 for normal distribution)
        SCALING_FACTOR = 1.4826
        robust_spread = SCALING_FACTOR * weighted_mad

        # Metric: Relative divergence of the spread
        if abs(accepted_value) > 1e-9:
            metric = robust_spread / abs(accepted_value) 
        else:
            # Absolute divergence if central value is zero (common in delta/change tracking)
            metric = robust_spread

        is_consensus = (metric <= self.divergence_threshold)
            
        return is_consensus, metric, accepted_value
