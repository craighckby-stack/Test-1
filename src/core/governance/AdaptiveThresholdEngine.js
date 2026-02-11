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

interface PolicyInputResolver {
  resolveInputs(policyName: string): Promise<{ formula: string, variables: Record<string, any> }>;
}

/**
 * Plugin Implementation: Handles configuration lookup, validation, and real-time data fetching
 * to prepare variables for formula evaluation.
 */
class PolicyInputResolverImpl implements PolicyInputResolver {
  private config: Record<string, PolicyDefinition>;
  private telemetry: TelemetryProvider;

  constructor(config: PolicyConfig, telemetryProvider: TelemetryProvider) {
    this.config = config.policy_definitions;
    this.telemetry = telemetryProvider;
  }

  async resolveInputs(policyName: string): Promise<{ formula: string, variables: Record<string, any> }> {
    const policy = this.config[policyName];
    if (!policy) {
      throw new Error(`Policy ${policyName} not found.`);
    }

    const { adaptation_formula: formula, base_threshold: baseThreshold, required_input_sensor: sensorKey } = policy;

    // Fetch real-time data
    const sensorValue = await this.telemetry.getSensorData(sensorKey);

    // Prepare variables for the formula evaluator
    const variables = {
      base_threshold: baseThreshold,
      [sensorKey]: sensorValue,
    };
    
    return { formula, variables };
  }
}

export class AdaptiveThresholdEngine {
  private inputResolver: PolicyInputResolver;
  private formulaEvaluator: FormulaEvaluator;

  constructor(config: PolicyConfig, telemetryProvider: TelemetryProvider, formulaEvaluator: FormulaEvaluator) {
    // Abstract policy configuration and telemetry interaction into the inputResolver plugin
    this.inputResolver = new PolicyInputResolverImpl(config, telemetryProvider);
    this.formulaEvaluator = formulaEvaluator;
  }

  /**
   * Calculates the effective threshold by evaluating the policy's adaptation formula
   * using the base threshold and real-time sensor data.
   */
  async getEffectiveThreshold(policyName: string): Promise<number> {
    // Step 1: Gather all necessary inputs (formula, variables) using the resolver
    const { formula, variables } = await this.inputResolver.resolveInputs(policyName);

    // Step 2: Execute the evaluation
    return this.formulaEvaluator.execute({ formula, variables });
  }
}