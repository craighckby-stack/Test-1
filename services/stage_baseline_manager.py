from typing import Dict, Any, Optional, List

class StageBaselineManager:
    """
    Calculates and applies optimized performance baselines (latency, resource use) 
    for GSEP stages based on historical execution data, feeding results back to 
    the system configuration via a ConfigManager.
    
    This fulfills Mandate P-M01 by ensuring max durations are dynamically derived.
    """
    def __init__(self, history_db_connector: Any, config_manager: Any):
        """
        Initializes the manager with dependencies.
        :param history_db_connector: Abstraction layer for historical execution data access.
        :param config_manager: Utility responsible for reading and writing system configuration.
        """
        self.db = history_db_connector
        self.config_manager = config_manager
        
        # Define standard allowed metrics and their default calculation method
        self.BASELINE_METHODS = {
            'duration_ms': 'P95',
            'cpu_utilization': 'P90',
            'memory_bytes': 'P99'
        }

    def calculate_baseline(self, stage_id: str, metric: str = 'duration_ms', method: str = 'P95', min_samples: int = 50) -> Optional[float]:
        """
        Calculates the performance baseline for a given stage using a specified statistical method.
        
        :param stage_id: Identifier of the stage.
        :param metric: The performance metric to track (e.g., 'duration_ms').
        :param method: The percentile method (e.g., 'P90', 'P95', 'P99').
        :param min_samples: Minimum successful executions required for a valid calculation.
        :return: Calculated baseline value (float) or None if insufficient data or calculation method is unknown.
        """
        
        # Ensure the DB connector uses safe parameter binding. Assuming query returns a list of dicts.
        try:
            # Limiting history retrieval to the most recent 500 successful runs for relevance
            query = f"SELECT {metric} FROM executions WHERE stage = %s AND success = true ORDER BY timestamp DESC LIMIT 500"
            history: List[Dict[str, Any]] = self.db.query(query, (stage_id,))
        except Exception:
            # Log database retrieval error
            return None

        if not history or len(history) < min_samples:
            return None

        # Extract and sort values (ensure metric data is float/int)
        try:
            values = sorted([float(h[metric]) for h in history])
        except (KeyError, ValueError):
            # Data structure mismatch or non-numeric data
            return None

        N = len(values)

        if method.startswith('P') and method[1:].isdigit():
            percentile = int(method[1:]) / 100.0
            
            # Nearest Rank Percentile Calculation: Index = ceil(N * P). Use max(0, int(N * P) - 1) for 0-indexing safety.
            index = max(0, int(N * percentile) - 1)
            baseline_value = values[min(N - 1, index)]
            
            return baseline_value
        
        return None

    def update_config_soft_targets(self, calculation_margin: float = 1.1) -> bool:
        """
        Iterates through configurable stages, calculates new baselines, and suggests/applies 
        updates to the configuration's soft targets (e.g., max_duration_ms).
        
        Updates are only applied if the calculated baseline necessitates lowering the target 
        or if the observed performance baseline significantly exceeds the current target (10% safety buffer).
        """
        config = self.config_manager.get_config()
        config_updated = False
        
        for stage_id, stage_config in config.get('stages', {}).items():
            
            # 1. Update duration soft target
            if 'max_duration_ms' in stage_config:
                
                baseline = self.calculate_baseline(
                    stage_id=stage_id, 
                    metric='duration_ms', 
                    method=self.BASELINE_METHODS.get('duration_ms', 'P95')
                )
                
                if baseline is not None:
                    new_target = round(baseline * calculation_margin) 
                    current_target = stage_config['max_duration_ms']
                    
                    # Heuristic for updating: Prevents runaway duration increases
                    if new_target < current_target: 
                        # Baseline is better: immediately lower the target
                        stage_config['max_duration_ms'] = new_target
                        config_updated = True
                    elif new_target > (current_target * 1.1): 
                        # Baseline is significantly worse (10% drift detected): adjust upward
                        stage_config['max_duration_ms'] = new_target
                        config_updated = True
        
        if config_updated:
            self.config_manager.save_config(config)
            return True
        
        return False
