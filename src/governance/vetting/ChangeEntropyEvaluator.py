import typing
from typing import Dict, Any, Final


class ChangeEntropyEvaluator:
    def __init__(self, gco_config: Dict[str, Any]):
        """Initializes CEE, loading configuration (e.g., Entropy weighting/GRS thresholds) 
        necessary for risk assessment, ensuring weights are normalized.
        """
        self.config = gco_config

        weights = self.config.get("entropy_weights", {})
        
        # Retrieve weights or fall back to defaults
        self.complexity_weight = weights.get("complexity_factor", 0.6)
        self.fragility_weight = weights.get("fragility_factor", 0.4)
        
        # Normalize weights to ensure they sum to 1.0 for risk calibration
        total = self.complexity_weight + self.fragility_weight
        if total > 0 and total != 1.0:
            self.complexity_weight /= total
            self.fragility_weight /= total
        elif total == 0:
            # Fallback for completely missing config
            self.complexity_weight = 0.6
            self.fragility_weight = 0.4


    def calculate_entropy(self, M_02_payload: Dict[str, Any], structural_report: Dict[str, Any]) -> float:
        """Calculates a quantifiable entropy score for the M-02 payload based on complexity and coupling.
        
        The score reflects the projected risk exposure increase due to the proposed change set.
        
        Returns: Quantifiable entropy score (0.0 to 1.0) for S-04 calibration.
        """
        
        complexity_data = self._assess_cyclomatic_complexity(M_02_payload)
        fragility_data = self._map_dependency_risk(M_02_payload, structural_report)
        
        complexity_score = complexity_data['score']
        fragility_score = fragility_data['score']
        
        # Weighted calculation using configured factors
        entropy = (complexity_score * self.complexity_weight) + (fragility_score * self.fragility_weight)
        
        # Clamp the score to the [0.0, 1.0] range
        return max(0.0, min(1.0, entropy))


    def _assess_cyclomatic_complexity(self, payload: Dict[str, Any]) -> Dict[str, float]:
        """Stub: Calculates the complexity risk score based on the delta CC increase.
        
        Requires input metrics from a dedicated metric extractor component.
        """
        # Placeholder logic referencing expected metrics (e.g., from StaticMetricExtractor)
        delta_cc = payload.get('metrics', {}).get('delta_cc', 2.5)
        risk_tolerance = self.config.get('complexity_threshold', 10.0)
        
        # Risk score proportional to delta CC relative to the defined threshold
        score = min(1.0, delta_cc / risk_tolerance) 

        return {
            "score": score, 
            "delta_cc": delta_cc,
            "risk_threshold_used": risk_tolerance
        }


    def _map_dependency_risk(self, payload: Dict[str, Any], report: Dict[str, Any]) -> Dict[str, float]:
        """Stub: Analyzes new/modified connections against system integrity goals and GRS mapping.
        
        High-risk architectural component interaction increases the fragility score.
        """
        # Placeholder logic referencing expected metrics and GRS lookup
        is_high_risk_zone = any(f.startswith("src/core/kernel") for f in payload.get('files_modified', []))
        coupling_increase = payload.get('metrics', {}).get('dependency_delta', 0.2)
        
        risk_multiplier = 1.5 if is_high_risk_zone else 1.0
        
        fragility_score = min(1.0, coupling_increase * risk_multiplier * 5.0) # Scaling factor 5.0 ensures relevance

        return {
            "score": fragility_score,
            "high_risk_interaction": 1.0 if is_high_risk_zone else 0.0,
            "coupling_delta": coupling_increase
        }