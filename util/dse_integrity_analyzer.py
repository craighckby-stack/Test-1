#!/usr/bin/env python3

import json
import sys
from typing import Dict, Any

# DSE Integrity Analyzer: Provides Root Cause Analysis (RCA) upon an Integrity Halt (IH).

class DSEAnalyzer:
    def __init__(self, artifacts_path: str, logs_path: str):
        self.artifacts = self._load_data(artifacts_path)
        self.logs = self._load_data(logs_path)

    def _load_data(self, file_path: str) -> Dict[str, Any]:
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Error: Required input file not found: {file_path}")
            sys.exit(1)

    def run_analysis(self):
        """Executes RCA by correlating artifacts against failure logs based on GAX rules."""
        print("--- DSE INTEGRITY HALT RCA ---")
        
        analysis_report = {
            "status": "FAILURE_UNCORRELATED",
            "gsep_stage": self.artifacts.get('last_stage', 'UNKNOWN'),
            "root_cause_candidates": []
        }

        # 1. GAX III Correlation (Constraint Integrity)
        if not self.artifacts.get('CSR_VALID', True):
            trace = self.logs.get('MPAM', 'N/A')
            analysis_report['root_cause_candidates'].append({
                "axiom": "GAX III (Constraint Integrity)",
                "artifact": "CSR (Configuration Snapshot Receipt)",
                "trace": trace, 
                "severity": "Critical: Policy Violation"
            })
            analysis_report['status'] = "FAILURE_GAX_III"

        # 2. GAX II Correlation (Contextual Validity)
        if self.artifacts.get('ECVM_PERMISSIBLE') != True:
            trace = self.logs.get('SGS', 'N/A')
            analysis_report['root_cause_candidates'].append({
                "axiom": "GAX II (Contextual Validity)",
                "artifact": "ECVM (Execution Context Validation Map)",
                "trace": trace,
                "severity": "High: Environmental Mismatch"
            })
            analysis_report['status'] = "FAILURE_GAX_II"

        # 3. GAX I Correlation (Utility Efficacy)
        if self.artifacts.get('TEMM_VALUE', 0) < self.artifacts.get('OMEGA_MIN', 1):
            trace = self.logs.get('ADTM', 'N/A')
            analysis_report['root_cause_candidates'].append({
                "axiom": "GAX I (Utility Efficacy)",
                "artifact": "TEMM (Transition Efficacy Measure)",
                "trace": trace,
                "severity": "Medium: Performance Debt"
            })
            if analysis_report['status'] == 'FAILURE_UNCORRELATED':
                analysis_report['status'] = "FAILURE_GAX_I"

        print(json.dumps(analysis_report, indent=4))
        print("\n*** Action Required: Execute RRP based on detected failure conditions. ***")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: ./dse_integrity_analyzer.py <artifacts.json> <logs.json>")
        sys.exit(1)
        
    analyzer = DSEAnalyzer(sys.argv[1], sys.argv[2])
    analyzer.run_analysis()