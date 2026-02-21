fn core_logic(add_config: Vec<ADD>) -> ComplianceReport {
    let mut report = ComplianceReport::new();

    for module in add_config {
        let priority_weight = module.priority_weight;
        let is_active = module.is_active;
        let config_path = module.config_path;

        if priority_weight < 0.0 || priority_weight > 100.0 {
            report.add_failure(
                "ADD.L1".to_string(),
                format!("Priority weight of module {} is out of range.", module.module_id),
            );
        }

        if !is_active {
            report.add_failure(
                "ADD.L2".to_string(),
                format!("Module {} is not active.", module.module_id),
            );
        }

        if config_path.is_none() {
            report.add_failure(
                "ADD.L3".to_string(),
                format!("Module {} configuration path is missing.", module.module_id),
            );
        }

        if let Some(pressure_level) = config_path {
            match ACVDSchema::try_from(pressure_level) {
                Ok(pressure_level) => {
                    let condition = pressure_level.get_description();
                    if condition.is_empty() {
                        report.add_failure(
                            "ADD.L5".to_string(),
                            format!("Missing condition in pressure level configuration for module {}.", module.module_id),
                        );
                    }

                    let value_factor = pressure_level.version();
                    if value_factor < 0.0 {
                        report.add_failure(
                            "ADD.L6".to_string(),
                            format!("Invalid value factor in pressure level configuration for module {}.", module.module_id),
                        );
                    }
                }
                Err(e) => {
                    report.add_failure(
                        "ADD.L4".to_string(),
                        format!("Invalid pressure level configuration: {}", e),
                    );
                }
            }
        }
    }

    report
}