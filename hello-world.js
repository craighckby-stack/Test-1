// --- Updated CORE logic ---
use crate::acvd_schema;

// Assuming ACVDSchema is defined in a separate module
pub fn validate_add_logic(report: &mut ComplianceReport) {
    let add_config = self.ADD_CONFIG.get("add_config");

    if let Some(add_config) = add_config {
        if add_config.is_none() {
            report.add_failure(
                "ADD.L01".to_string(),
                "ADD configuration is missing required configuration.".to_string(),
            );
        } else {
            let add_config = add_config.unwrap();
            if add_config.is_empty() {
                report.add_failure(
                    "ADD.L01".to_string(),
                    "ADD configuration is empty.".to_string(),
                );
            } else {
                let result = acvd_schema::ACVDSchema::try_from(add_config);
                if result.is_err() {
                    report.add_failure(
                        "ADD.L02".to_string(),
                        "ADD configuration does not conform to the ACVD schema.".to_string(),
                    );
                } else {
                    // Additional validation logic can be added here
                    // For example, checking if the ACVD schema conforms to the expected version
                    if result.unwrap().version != 1.1 {
                        report.add_failure(
                            "ADD.L03".to_string(),
                            "ADD configuration uses an unsupported version of the ACVD schema.".to_string(),
                        );
                    }
                    // Check if the ACVD schema has the required fields
                    if !result.unwrap().has_required_fields() {
                        report.add_failure(
                            "ADD.L04".to_string(),
                            "ADD configuration is missing required fields.".to_string(),
                        );
                    }
                    // Check if the ACVD schema has any invalid fields
                    if result.unwrap().has_invalid_fields() {
                        report.add_failure(
                            "ADD.L05".to_string(),
                            "ADD configuration contains invalid fields.".to_string(),
                        );
                    }
                }
            }
        }
    }
}

// --- Updated CORE logic ---
impl ConstraintComplianceValidator {
    fn execute_pre_flight_check_with_add_logic(&self) -> ComplianceReport {
        let mut report = ComplianceReport::new();

        self._validate_required_p_sets(&mut report);
        self._validate_severity_thresholds(&mut report);
        self._validate_orchestrator_limits(&mut report);
        validate_add_logic(&mut report);

        report
    }
}