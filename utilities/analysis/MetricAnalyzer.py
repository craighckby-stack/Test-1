from typing import Dict, List
import numpy as np
from statsmodels.tsa.api import ExponentialSmoothing

class MetricAnalyzer:
    """
    Utility class responsible for advanced statistical analysis of historical metrics (S-01, S-02).
    Calculates trends, volatility, and proposes optimal GTCM threshold adjustments.
    """

    def __init__(self, smoothing_window: int = 10, confidence_level: float = 0.95):
        self.smoothing_window = smoothing_window
        self.confidence_level = confidence_level

    def _calculate_ema_trend(self, data: List[float]) -> float:
        """Calculates the Exponential Moving Average (EMA) of a metric."""
        if not data:
            return 0.0
        # Using ExponentialSmoothing for robust calculation
        fit = ExponentialSmoothing(data, trend=None, seasonal=None).fit(smoothing_level=2/(self.smoothing_window + 1))
        return fit.fittedvalues[-1]

    def analyze_gtcm_performance(self, history: Dict[str, list]) -> Dict[str, float]:
        """
        Analyzes S-01 (Efficiency) and S-02 (Exposure) history to suggest new thresholds.
        """
        suggestions = {}
        
        # 1. Analyze S-01 (Utility/Efficiency) for Utility_Min adjustment
        if 'S-01' in history and len(history['S-01']) > self.smoothing_window:
            s01_ema = self._calculate_ema_trend(history['S-01'])
            # Proposal logic: If recent EMA is high, slightly raise the floor.
            # Simplified model: new floor is 99% of current EMA (to maintain buffer)
            suggested_s01_floor = s01_ema * 0.99 
            suggestions['suggested_s01_floor'] = round(suggested_s01_floor, 4)

        # 2. Analyze S-02 (Exposure/Risk) for Exposure_Max adjustment
        if 'S-02' in history and len(history['S-02']) > self.smoothing_window:
            s02_ema = self._calculate_ema_trend(history['S-02'])
            s02_std = np.std(history['S-02'])
            
            # Proposal logic: New ceiling is based on EMA plus a risk buffer (e.g., 1.5 standard deviations).
            # If volatility (std) is high, the ceiling should be lowered relative to the peak.
            suggested_s02_ceiling = s02_ema + (1.5 * s02_std)
            suggestions['suggested_s02_ceiling'] = round(suggested_s02_ceiling, 4)

        return suggestions
