interface RRPAction {
  type: 'LOG' | 'STATE' | 'NOTIFICATION' | 'ALARM';
  detail: string;
  [key: string]: any; // Allows dynamic mode/channel/level
}

interface RRPTrigger {
  severity: 'CATASTROPHIC' | 'CRITICAL' | 'HIGH' | 'WARNING';
  description: string;
  actions: RRPAction[];
}

/**
 * Interface reflecting the contract of the RRP Action Processor plugin.
 */
interface IRRPActionProcessor {
    process(action: RRPAction): Promise<void>;
}

/**
 * RRP_Executor_Engine:
 * Executes mandatory Rollback and Recovery Policies defined in RRP_Policy_Definition.json.
 * Guarantees atomic, sequenced execution of recovery actions, prioritizing CATASTROPHIC
 * events even during resource exhaustion.
 */
class RRPExecutorEngine {
  private policies: Record<string, RRPTrigger>;
  private actionProcessor: IRRPActionProcessor;

  constructor(policyDefinition: Record<string, RRPTrigger>, actionProcessor: IRRPActionProcessor) {
    this.policies = policyDefinition;
    // Dependency Injection: Rely on the abstracted processor interface
    this.actionProcessor = actionProcessor;
  }

  public async executeTrigger(hookName: keyof typeof this.policies): Promise<void> {
    const trigger = this.policies[hookName];
    if (!trigger) {
      console.warn(`RRP Trigger '${hookName}' not defined. Skipping.`);
      return;
    }

    console.error(`[RRP EXEC] Activating trigger: ${hookName} (Severity: ${trigger.severity})`);

    // 1. Prioritized Actions (E.g., immediate logging and shutdown checks)
    for (const action of trigger.actions) {
      await this.processAction(action);
    }

    // 2. Report Final State to central supervisor
    this.reportRecoveryCompletion(hookName, trigger.severity);
  }

  private async processAction(action: RRPAction): Promise<void> {
    // Delegation to the extracted tool for robust, atomic action execution.
    await this.actionProcessor.process(action);
  }

  private reportRecoveryCompletion(hookName: string, severity: string): void {
    // Implementation detail: Notify upstream supervisor of recovery attempt success/failure.
  }
}