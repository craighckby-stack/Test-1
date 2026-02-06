from typing import Dict, Any, Union, Tuple

# Define standard type aliases for clarity
ComplexitySignature = Dict[str, Union[int, float]]
SSTManifest = Dict[str, Any]

class CBMVeto(Exception):
    """Custom exception raised when CBM constraints are violated."""
    pass

class ComputationalBoundednessModule:
    """L2: CBM performs static analysis to ensure the proposed SST (System State Transition) is computationally bounded, minimizing S-02 risk associated with unbounded resource consumption or non-termination. """

    def __init__(self, limits: Dict[str, Union[int, float]]):
        """Initializes CBM with structural and resource constraints.
        Example limits: {"complexity_budget": 0.85, "max_estimated_depth": 5}
        """
        if not limits:
            raise ValueError("CBM initialization requires resource limits.")
        self.limits: Dict[str, Union[int, float]] = limits

    def calculate_turing_signature(self, sst_manifest: SSTManifest) -> ComplexitySignature:
        """Estimates the static computational complexity based on structural features. 
        Returns a dictionary of measurable complexity metrics (Turing Signature).
        """
        
        # 1. Structural size (proxy for state space and I/O)
        try:
            size_bytes = len(str(sst_manifest).encode('utf-8'))
        except TypeError:
            size_bytes = 0
            
        # 2. Heuristic Depth (estimated recursion or chain length)
        # Requires deep knowledge of SST structure, using a metadata hint as a proxy.
        estimated_depth = sst_manifest.get('metadata', {}).get('depth_hint', 1) 
        
        # 3. Overall Complexity Score (Normalized static metric)
        # Mock Calculation: Log size proportional to depth and a multiplier.
        complexity_score = (size_bytes / 1024.0) * float(estimated_depth) * 0.01
        
        signature: ComplexitySignature = {
            "size_bytes": size_bytes,
            "estimated_depth": estimated_depth,
            "complexity_score": complexity_score
        }
        return signature

    def bounds_check(self, sst_manifest: SSTManifest) -> bool:
        """Checks if the estimated complexity violates predefined resource ceilings (CBM constraints).
        Raises CBMVeto if the bounds are violated.
        """
        turing_signature = self.calculate_turing_signature(sst_manifest)
        
        # Map signature keys to expected limit keys
        limit_key_map = {
            "size_bytes": "max_size_bytes",
            "estimated_depth": "max_estimated_depth",
            "complexity_score": "complexity_budget"
        }
        
        for metric, value in turing_signature.items():
            limit_key = limit_key_map.get(metric)
            
            if limit_key and limit_key in self.limits:
                limit = self.limits[limit_key]
                
                if value > limit:
                    reason = (f"Computational signature VETO: Metric '{metric}' ({value:.4f}) "
                              f"exceeds critical limit '{limit_key}' ({limit}).")
                    raise CBMVeto(reason)
        
        return True
