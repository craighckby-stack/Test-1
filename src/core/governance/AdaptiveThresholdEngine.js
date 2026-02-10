// Requires Governance Policy (GP) and Telemetry Data (TD)

interface FormulaEvaluator {
  execute(args: { formula: string, variables: Record<string, any> }): number;
}

interface PolicyConfig {
  policy_definitions: Record<string, PolicyDefinition>;
}

interface PolicyDefinition {
  adaptation_formula: string;
  base_threshold: number;
  required_input_sensor: string;
}

interface TelemetryProvider {
  getSensorData(key: string): Promise<number>;
}

export class AdaptiveThresholdEngine {
  private config: Record<string, PolicyDefinition>;
  private telemetry: TelemetryProvider;
  private formulaEvaluator: FormulaEvaluator;

  constructor(config: PolicyConfig, telemetryProvider: TelemetryProvider, formulaEvaluator: FormulaEvaluator) {
    this.config = config.policy_definitions;
    this.telemetry = telemetryProvider;
    this.formulaEvaluator = formulaEvaluator;
  }

  /**
   * Calculates the effective threshold by evaluating the policy's adaptation formula
   * using the base threshold and real-time sensor data.
   */
  async getEffectiveThreshold(policyName: string): Promise<number> {
    const policy = this.config[policyName];
    if (!policy) throw new Error(`Policy ${policyName} not found.`);

    const formula = policy.adaptation_formula;
    const baseThreshold = policy.base_threshold;
    const sensorKey = policy.required_input_sensor;

    let sensorValue = await this.telemetry.getSensorData(sensorKey);

    const variables = {
      base_threshold: baseThreshold,
      [sensorKey]: sensorValue
    };

    // Use the dedicated PolicyFormulaEvaluatorUtility for safe variable substitution and evaluation
    return this.formulaEvaluator.execute({ formula, variables });
  }
}