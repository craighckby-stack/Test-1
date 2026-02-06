from typing import Dict, Any, Union, Tuple, TypedDict, cast
import math

# --- Type Definitions ---
class ComplexitySignature(TypedDict):
    """The measurable output metrics (Turing Signature) of an SST analysis."""
    size_bytes: int
    estimated_depth: int
    complexity_score: float

class CBMLimits(TypedDict, total=False):
    """Defines the structural and resource constraints imposed by CBM."""
    max_size_bytes: int
    max_estimated_depth: int
    complexity_budget: float

SSTManifest = Dict[str, Any] # System State Transition Manifest (generic payload)

class CBMVeto(Exception):
    """Custom exception raised when CBM constraints are violated."""
    pass

class ComputationalBoundednessModule:
    """
    L2: CBM performs static analysis to ensure the proposed SST (System State Transition) 
    is computationally bounded (S-02 risk mitigation).

    CBM relies solely on structural features available pre-execution.
    """

    # Defines how keys in the Signature map to keys in the Limits
    LIMIT_KEY_MAP: Dict[str, str] = {
        "size_bytes": "max_size_bytes",
        "estimated_depth": "max_estimated_depth",
        "complexity_score": "complexity_budget"
    }

    def __init__(self, limits: CBMLimits):
        """
        Initializes CBM with structural and resource constraints.
        :param limits: Dictionary adhering to CBMLimits structure.
        """
        if not limits:
            raise ValueError("CBM initialization requires non-empty resource limits.")
            
        # Ensure limits are positive numeric values before casting
        validated_limits = cast(CBMLimits, {k: v for k, v in limits.items() if isinstance(v, (int, float)) and v >= 0})
        if not validated_limits:
            raise ValueError("CBM limits must be valid positive numeric values.")
            
        self.limits: CBMLimits = validated_limits

    def calculate_turing_signature(self, sst_manifest: SSTManifest) -> ComplexitySignature:
        """
        Estimates the static computational complexity based on structural features. 
        Returns a dictionary of measurable complexity metrics (Turing Signature).
        """
        
        # 1. Structural size (Serialization cost proxy)
        try:
            # Using repr() captures structural details better than str() for complexity estimation
            size_bytes = len(repr(sst_manifest).encode('utf-8'))
        except TypeError:
            size_bytes = 0
            
        # 2. Heuristic Depth (estimated recursion or chain length)
        # Defaulting to 2 prevents overly optimistic estimates for missing metadata.
        estimated_depth = int(sst_manifest.get('metadata', {}).get('depth_hint', 2))
        
        # 3. Overall Complexity Score (Normalized static metric)
        # Uses log size * depth, providing a combined risk metric.
        log_size = math.log(size_bytes + 1, 10) # +1 prevents log(0)
        complexity_score = log_size * estimated_depth * 0.1
        
        signature: ComplexitySignature = {
            "size_bytes": size_bytes,
            "estimated_depth": estimated_depth,
            "complexity_score": complexity_score
        }
        return signature

    def bounds_check(self, sst_manifest: SSTManifest) -> bool:
        """
        Performs static constraint checking against the predefined CBM ceilings.
        Raises CBMVeto if the bounds are violated.
        
        :param sst_manifest: The System State Transition payload to analyze.
        :return: True if all bounds are met.
        """
        turing_signature = self.calculate_turing_signature(sst_manifest)
        
        violations = []

        for metric_name, value in turing_signature.items():
            limit_key = self.LIMIT_KEY_MAP.get(metric_name)
            
            if limit_key and limit_key in self.limits:
                limit = self.limits[limit_key]
                
                if value > limit:
                    violations.append(
                        f"'{metric_name}' ({value:.4f}) > limit '{limit_key}' ({limit})"
                    )
        
        if violations:
            violation_str = "; ".join(violations)
            reason = f"CBM VETO (S-02 risk): Static signature violation(s): [{violation_str}]"
            raise CBMVeto(reason)
        
        return True
