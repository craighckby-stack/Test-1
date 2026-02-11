/**
 * ProtocolExecutionFSM
 * Implements a Finite State Machine responsible for controlling the flow
 * of protocol verification, interpreting complex directives like 'RetryStep'
 * and 'HaltExecution' defined in the protocol definition schema.
 */

class ProtocolExecutionFSM {
  /**
   * @param {object} protocolDefinition The definition of the protocol.
   * @param {object} failurePolicyHandler An instance of the FailurePolicyHandler plugin interface.
   */
  constructor(protocolDefinition, failurePolicyHandler) {
    if (!failurePolicyHandler || typeof failurePolicyHandler.execute !== 'function') {
        throw new Error("ProtocolExecutionFSM requires a valid FailurePolicyHandler instance.");
    }
    
    this.protocol = protocolDefinition;
    this.steps = protocolDefinition.required_steps;
    this.currentState = 'READY';
    this.currentStepIndex = 0;
    
    // Use injected dependency
    this.failurePolicyHandler = failurePolicyHandler; 
  }

  async executeProtocol() {
    this.currentState = 'RUNNING';
    while (this.currentStepIndex < this.steps.length) {
      const step = this.steps[this.currentStepIndex];
      console.log(`Executing step: ${step.step_id}`);

      const result = await this._runStep(step);

      if (!result.success) {
        // Delegate failure policy logic to the injected handler
        const policyResult = this.failurePolicyHandler.execute({
            step: step,
            result: result, 
            currentIndex: this.currentStepIndex
        });

        this.currentState = policyResult.newState;
        this.currentStepIndex = policyResult.nextIndex;
        
        if (this.currentState === 'HALTED') break;
        
      } else {
        this.currentStepIndex++;
      }
    }
    this.currentState = (this.currentState === 'HALTED') ? 'FAILED' : 'COMPLETED';
    return this.currentState;
  }

  async _runStep(step) {
    // Placeholder for PIM module execution logic
    // Actual execution would involve dynamic import/loading of step.verifier_module
    // using step.configuration and step.timeout_ms.
    return {
      success: true, // Simulate success for demonstration
      message: `Step ${step.step_id} verified.`
    };
  }
}
module.exports = ProtocolExecutionFSM;