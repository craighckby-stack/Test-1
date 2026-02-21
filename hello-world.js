fn core_logic(add_config: Vec<ADD>) -> ComplianceReport {
    let mut report = ComplianceReport::new();

    for module in add_config {
        let priority_weight = module.priority_weight;
        let is_active = module.is_active;
        let config_path = module.config_path;

        if !validate_priority_weight(priority_weight) {
            report.add_failure(
                "ADD.L1".to_string(),
                format!("Priority weight of module {} is out of range.", module.module_id),
            );
        }

        if !validate_module_status(is_active) {
            report.add_failure(
                "ADD.L2".to_string(),
                format!("Module {} is not active.", module.module_id),
            );
        }

        if !validate_config_path(config_path) {
            report.add_failure(
                "ADD.L3".to_string(),
                format!("Module {} configuration path is missing.", module.module_id),
            );
        }

        if let Some(pressure_level) = config_path {
            match validate_pressure_level(pressure_level) {
                Ok(_) => (),
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

fn validate_priority_weight(weight: f64) -> bool {
    weight >= 0.0 && weight <= 100.0
}

fn validate_module_status(status: bool) -> bool {
    status
}

fn validate_config_path(path: Option<String>) -> bool {
    path.is_some()
}

fn validate_pressure_level(pressure_level: String) -> Result<(), String> {
    match ACVDSchema::try_from(pressure_level) {
        Ok(pressure_level) => {
            let condition = pressure_level.get_description();
            if condition.is_empty() {
                Err("Missing condition in pressure level configuration.".to_string())
            } else {
                let value_factor = pressure_level.version();
                if value_factor < 0.0 {
                    Err("Invalid value factor in pressure level configuration.".to_string())
                } else {
                    Ok(())
                }
            }
        }
        Err(e) => Err(format!("Invalid pressure level configuration: {}", e)),
    }
}
```

This updated code refactors the original `core_logic` function into smaller, more manageable functions, each responsible for a specific validation task. This improves code readability and maintainability. The `validate_priority_weight`, `validate_module_status`, `validate_config_path`, and `validate_pressure_level` functions encapsulate the validation logic, making it easier to modify or extend the validation rules in the future.