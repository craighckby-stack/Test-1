// ...[TRUNCATED]
fn synthesize_add_logic(add_config: String) -> Result<Vec<ADD>, String> {
    let add_config_json = serde_json::from_str(&add_config)?;
    let add_config = add_config_json
        .as_object()
        .ok_or_else(|| "Invalid ADD configuration: expected an object".to_string())?
        .into_iter()
        .map(|(key, value)| {
            let service_id = value
                .as_str()
                .ok_or_else(|| "Invalid ADD configuration: missing service_id".to_string())?;
            let description = value
                .as_str()
                .ok_or_else(|| "Invalid ADD configuration: missing description".to_string())?;
            let map_targets = value
                .as_array()
                .ok_or_else(|| "Invalid ADD configuration: missing map_targets".to_string())?
                .into_iter()
                .map(|target| {
                    let source_manifest_domain = target
                        .as_object()
                        .ok_or_else(|| "Invalid ADD configuration: expected an object for map_target".to_string())?
                        .get("source_manifest_domain")
                        .and_then(|source_manifest_domain| source_manifest_domain.as_str())
                        .ok_or_else(|| "Invalid ADD configuration: missing source_manifest_domain".to_string())?;
                    let constraint_path = target
                        .as_object()
                        .ok_or_else(|| "Invalid ADD configuration: expected an object for map_target".to_string())?
                        .get("constraint_path")
                        .and_then(|constraint_path| constraint_path.as_str())
                        .ok_or_else(|| "Invalid ADD configuration: missing constraint_path".to_string())?;
                    let metric_field_key = target
                        .as_object()
                        .ok_or_else(|| "Invalid ADD configuration: expected an object for map_target".to_string())?
                        .get("metric_field_key")
                        .and_then(|metric_field_key| metric_field_key.as_str())
                        .ok_or_else(|| "Invalid ADD configuration: missing metric_field_key".to_string())?;
                    let output_signal = target
                        .as_object()
                        .ok_or_else(|| "Invalid ADD configuration: expected an object for map_target".to_string())?
                        .get("output_signal")
                        .and_then(|output_signal| output_signal.as_str())
                        .ok_or_else(|| "Invalid ADD configuration: missing output_signal".to_string())?;
                    let pressure_levels = target
                        .as_array()
                        .ok_or_else(|| "Invalid ADD configuration: missing pressure_levels".to_string())?
                        .into_iter()
                        .map(|pressure_level| {
                            let level = pressure_level
                                .as_object()
                                .ok_or_else(|| "Invalid ADD configuration: expected an object for pressure_level".to_string())?
                                .get("level")
                                .and_then(|level| level.as_str())
                                .ok_or_else(|| "Invalid ADD configuration: missing level".to_string())?;
                            let condition = pressure_level
                                .as_object()
                                .ok_or_else(|| "Invalid ADD configuration: expected an object for pressure_level".to_string())?
                                .get("condition")
                                .and_then(|condition| condition.as_str())
                                .ok_or_else(|| "Invalid ADD configuration: missing condition".to_string())?;
                            let value_factor = pressure_level
                                .as_object()
                                .ok_or_else(|| "Invalid ADD configuration: expected an object for pressure_level".to_string())?
                                .get("value_factor")
                                .and_then(|value_factor| value_factor.as_f64())
                                .ok_or_else(|| "Invalid ADD configuration: missing value_factor".to_string())?;
                            Ok(ADD {
                                module_id: service_id.to_string(),
                                priority_weight: 0.0,
                                resource_tag: source_manifest_domain.to_string(),
                                is_active: true,
                                config_path: Some(format!("{}: {}", constraint_path, metric_field_key)),
                            })
                        })
                        .collect::<Result<Vec<ADD>, String>>()?;
                    Ok((key.to_string(), pressure_levels))
                })
                .collect::<Result<Vec<(String, Vec<ADD>)>, String>>()?;
            Ok(add_config)
        })
        .collect::<Result<Vec<ADD>, String>>()?;
    Ok(add_config)
}

fn core_logic(add_config: Vec<ADD>) -> ComplianceReport {
    let mut report = ComplianceReport::new();

    for module in add_config {
        if module.priority_weight < 0.0 || module.priority_weight > 100.0 {
            report.add_failure(
                "ADD.L1".to_string(),
                format!("Priority weight of module {} is out of range.", module.module_id),
            );
        }

        if !module.is_active {
            report.add_failure(
                "ADD.L2".to_string(),
                format!("Module {} is not active.", module.module_id),
            );
        }

        if module.config_path.is_none() {
            report.add_failure(
                "ADD.L3".to_string(),
                format!("Module {} configuration path is missing.", module.module_id),
            );
        }
    }

    report
}

fn main() {
    let add_config = String::from("ADD: { ... }");
    let add_config = synthesize_add_logic(add_config).unwrap();
    let report = core_logic(add_config);
    println!("{:?}", report);
}
```

```rust
// ...[TRUNCATED]
struct ACVDSchema {
    // ...[TRUNCATED]
}

impl ACVDSchema {
    fn try_from(add_config: String) -> Result<Self, String> {
        // ...[TRUNCATED]
    }

    fn get_description(&self) -> String {
        // ...[TRUNCATED]
    }

    fn version(&self) -> f64 {
        // ...[TRUNCATED]
    }

    fn get_metadata(&self) -> Metadata {
        // ...[TRUNCATED]
    }

    fn get_assets(&self) -> HashMap<String, Asset> {
        // ...[TRUNCATED]
    }
}

struct ComplianceReport {
    // ...[TRUNCATED]
}

impl ComplianceReport {
    fn new() -> Self {
        // ...[TRUNCATED]
    }

    fn add_failure(&mut self, code: String, message: String) {
        // ...[TRUNCATED]
    }

    fn merge(&mut self, other: ComplianceReport) {
        // ...[TRUNCATED]
    }
}

struct ADD {
    module_id: String,
    priority_weight: f64,
    resource_tag: String,
    is_active: bool,
    config_path: Option<String>,
}

impl ADD {
    fn validate(&self) -> ComplianceReport {
        // ...[TRUNCATED]
    }
}