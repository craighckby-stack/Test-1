import json
import logging
import datetime
from typing import Dict, Optional, List

# Initialize standardized governance logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class ArtifactDependencyAuditor:
    DEFAULT_MANIFEST_PATH = "artifacts/L2_SVP.json"
    
    def __init__(self, manifest_source: str = DEFAULT_MANIFEST_PATH, resource_constraints: Optional[Dict] = None):
        """Initializes ADA, targeting the Security Verified Payload (SVP) for analysis.
        Loads default resource constraints for budget checking, if not provided.
        """
        self.manifest_source = manifest_source
        self.dependency_ledger: Dict[str, Dict] = {}
        # In a production system, constraints would be loaded via the ConfigurationGateway
        self.resource_constraints = resource_constraints or {
            "cpu_max_msec": 5000, # Governance hard limit (placeholder)
            "memory_peak_mb": 1024,
            "io_latency_max_ms": 50
        }

    def _load_svp_payload(self) -> Optional[Dict]:
        """Loads the current L2 artifact manifest using robust error handling."""
        try:
            with open(self.manifest_source, 'r') as f:
                payload = json.load(f)
                logger.info(f"SVP manifest loaded successfully from {self.manifest_source}")
                return payload
        except FileNotFoundError:
            logger.error(f"SVP manifest not found at {self.manifest_source}. Cannot proceed with artifact analysis.")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON structure in SVP manifest: {e}")
            return None

    def map_computational_footprint(self, artifact_id: str, trace_data: Dict) -> Dict:
        """
        Analyzes simulation trace data (L3 preparatory) to map resource usage patterns
        and updates the internal dependency ledger.
        """
        if not artifact_id:
            logger.warning("Attempted to map footprint with empty artifact_id.")
            return {}

        # Standardizing cost vector extraction and zero-defaulting missing metrics
        cost_vectors = {
            "cpu_max_msec": trace_data.get("peak_cpu", 0),
            "memory_peak_mb": trace_data.get("peak_mem", 0),
            "io_latency_avg_ms": trace_data.get("avg_io", 0),
            "external_api_calls": trace_data.get("external_calls", 0)
        }

        footprint = {
            "artifact_id": artifact_id,
            "cost_vectors": cost_vectors,
            "implicit_dependencies": self._extract_implicit_dependencies(trace_data.get("code_snapshot", {}))
        }
        
        self.dependency_ledger[artifact_id] = footprint
        logger.debug(f"Mapped footprint for artifact: {artifact_id}")
        return footprint

    def _extract_implicit_dependencies(self, snapshot: Dict) -> List[str]:
        """
        Identifies non-declared dependencies using simulated static analysis.
        Uses optimized set operations for unique listing.
        """
        implicit_set = set()
        
        if snapshot.get("module_reference_ATM") is True:
             implicit_set.add("AGI_TRUST_METRICS_SYSTEM")
        if snapshot.get("utilizes_config") is True:
             implicit_set.add("CONFIGURATION_GATEWAY_V94")
             
        return sorted(list(implicit_set))

    def generate_risk_input_vector(self, artifact_id: str) -> Dict:
        """
        Formats the precise dependency audit data for consumption by the
        Multi-Constraint Risk Assessor (MCRA S-02).
        """
        if artifact_id not in self.dependency_ledger:
            logger.error(f"Risk vector generation failed: Artifact ID {artifact_id} not audited.")
            return {"error": "Artifact ID not audited."}

        data = self.dependency_ledger[artifact_id]
        
        # Calculate computational overhead score by normalizing costs
        overhead_score = (
            data['cost_vectors']['cpu_max_msec'] / self.resource_constraints['cpu_max_msec']
            + data['cost_vectors']['memory_peak_mb'] / self.resource_constraints['memory_peak_mb']
        ) * 100 # Scaling for intuitive scoring (0-200% baseline)

        risk_input = {
            "analysis_time_utc": self.get_timestamp(),
            "cost_exceeded_budget": self._check_budget_violation(data['cost_vectors']),
            "computational_overhead_score": round(overhead_score, 2),
            "dependency_breach_count": len(data['implicit_dependencies']),
            "critical_dependencies_list": data['implicit_dependencies']
        }
        
        return risk_input

    def get_timestamp(self) -> str:
        """Returns high-fidelity ISO-standardized UTC timestamp for traceability."""
        return datetime.datetime.utcnow().isoformat() + 'Z'

    def _check_budget_violation(self, costs: Dict) -> bool:
        """
        Checks costs against pre-defined, configured resource constraints.
        """
        cpu_violation = costs.get("cpu_max_msec", 0) > self.resource_constraints.get("cpu_max_msec", float('inf'))
        mem_violation = costs.get("memory_peak_mb", 0) > self.resource_constraints.get("memory_peak_mb", float('inf'))
        
        if cpu_violation or mem_violation:
             logger.warning(f"Budget violation detected: CPU={cpu_violation}, Memory={mem_violation}")
             return True
        return False
