// --- Updated CORE logic ---
struct ADDObject {
    // ...[TRUNCATED]
    integrity_hash: String,
    // ...[TRUNCATED]
}

// --- Updated CORE logic ---
impl ADDObject {
    fn new(
        integrity_hash: String,
        // ...[TRUNCATED]
    ) -> Self {
        Self {
            integrity_hash,
            // ...[TRUNCATED]
        }
    }
}

// --- Updated CORE logic ---
struct ComplianceReport {
    // ...[TRUNCATED]
    is_compliant: bool,
    failures: Vec<Dict>,
}

// --- Updated CORE logic ---
impl ComplianceReport {
    fn new() -> Self {
        Self {
            is_compliant: true,
            failures: Vec::new(),
        }
    }

    fn add_failure(&mut self, check_id: String, message: String) {
        self.is_compliant = false;
        self.failures.push(Dict::new());
        self.failures.last_mut().unwrap().insert("check_id", check_id);
        self.failures.last_mut().unwrap().insert("message", message);
    }

    fn is_compliant(&self) -> bool {
        self.is_compliant
    }
}

// --- Updated CORE logic ---
struct ConstraintComplianceValidator {
    // ...[TRUNCATED]
    GAX_MASTER: Dict,
    PIM_CONSTRAINTS: Dict,
    ORCHESTRATOR_CONFIG: Dict,
}

// --- Updated CORE logic ---
impl ConstraintComplianceValidator {
    fn new(
        GAX_MASTER: Dict,
        PIM_CONSTRAINTS: Dict,
        ORCHESTRATOR_CONFIG: Dict,
    ) -> Self {
        Self {
            GAX_MASTER,
            PIM_CONSTRAINTS,
            ORCHESTRATOR_CONFIG,
        }
    }

    fn _validate_required_p_sets(&self, report: &mut ComplianceReport) {
        let required_sets = self.GAX_MASTER.get("protocol_mandates").and_then(|x| x.get("required_p_sets"));
        let actual_sets = self.PIM_CONSTRAINTS.get("constraint_sets").and_then(|x| x.keys());

        if let Some(required) = required_sets {
            if let Some(actual) = actual_sets {
                for required_set in required {
                    if !actual.contains(&required_set) {
                        report.add_failure(
                            "PIM.C01".to_string(),
                            format!("PIM configuration is missing required P-Set definition: {}", required_set),
                        );
                    }
                }
            }
        }
    }

    fn _validate_severity_thresholds(&self, report: &mut ComplianceReport) {
        let gax_limits = self.GAX_MASTER.get("limits").and_then(|x| x.get("severity_thresholds"));
        let pim_thresholds = self.PIM_CONSTRAINTS.get("policy").and_then(|x| x.get("severity_levels"));

        if let Some(gax_limits) = gax_limits {
            if let Some(pim_thresholds) = pim_thresholds {
                for (level, limit) in gax_limits {
                    let current_threshold = pim_thresholds.get(level);

                    if current_threshold.is_none() {
                        report.add_failure(
                            "PIM.C02".to_string(),
                            format!("Required GAX severity level '{}' is not defined in PIM configuration.", level),
                        );
                        continue;
                    }

                    if current_threshold.unwrap() > limit {
                        report.add_failure(
                            "PIM.C02".to_string(),
                            format!("Severity '{}' ({}) exceeds GAX hard limit ({})", level, current_threshold.unwrap(), limit),
                        );
                    }
                }
            }
        }
    }

    fn _validate_orchestrator_limits(&self, report: &mut ComplianceReport) {
        let stage_limit = self.ORCHESTRATOR_CONFIG.get("gsep_stage_limit_seconds");

        if let Some(stage_limit) = stage_limit {
            if stage_limit.is_none() || stage_limit.unwrap() <= 0.0 {
                report.add_failure(
                    "ORCH.R01".to_string(),
                    "GSEP-C stage limit ({} must be a positive non-zero value, mandated by GAX II.".format(stage_limit.unwrap()),
                );
            }
        }
    }

    fn execute_pre_flight_check(&self) -> ComplianceReport {
        let mut report = ComplianceReport::new();

        self._validate_required_p_sets(&mut report);
        self._validate_severity_thresholds(&mut report);
        self._validate_orchestrator_limits(&mut report);

        report
    }
}