import manifest from '../../config/protocol/remediation_command_manifest.json';
import { RemediationService } from './RemediationService';
import { PolicyApplicationPlugin } from "./PolicyApplicationPlugin";

/**
 * CommandExecutorPolicyEngine
 * Manages execution context, security validation, and policy adherence
 * (retry logic, idempotency checks) for RCRP commands based on the manifest definitions.
 */
class CommandExecutorPolicyEngine {
    private commandMap: Map<string, any>;
    private service: RemediationService;
    private policyEngine: PolicyApplicationPlugin;

    constructor() {
        this.commandMap = this._initializeCommandMap(manifest);
        // RemediationService assumed to handle actual low-level system interactions
        this.service = new RemediationService(); 
        this.policyEngine = new PolicyApplicationPlugin();
    }

    _initializeCommandMap(manifestData: { commands: any[] }) {
        const map = new Map();
        for (const command of manifestData.commands) {
            map.set(command.id, command);
        }
        return map;
    }

    /**
     * Executes a command, managing authorization and applying configured retry policies.
     */
    async execute(commandId: string, parameters: any, currentClearance: any) {
        const commandDef = this.commandMap.get(commandId);

        if (!commandDef) {
            throw new Error(`Command ID ${commandId} not defined.`);
        }

        // 1. Authorization & Validation Checks
        if (!this._isAuthorized(commandDef.security_scope, currentClearance)) {
            throw new Error('Insufficient clearance or scope mismatch for critical operation.');
        }
        // Note: Full JSON Schema validation should be implemented here (e.g., using AJV).

        // Define the execution logic that will be retried
        const executionFn = async () => {
            // Execute the command via the defined target interface
            return await this.service.dispatch(commandDef.execution_target, commandDef.id, parameters);
        };

        // Use the policy application plugin to handle retry and backoff logic
        // The plugin abstracts the dependency on PolicyExecutionRetryUtility.
        try {
            return await this.policyEngine.executeWithPolicy(
                commandId,
                commandDef,
                executionFn
            );
        } catch (error) {
            // The utility (via the plugin) handles maximum attempt exhaustion and throws the final error
            throw error;
        }
    }

    _isAuthorized(requiredScope: any, currentClearance: any): boolean {
        // Logic implementation placeholder: Ensure current clearance satisfies required security scope.
        return true; 
    }
}

export default CommandExecutorPolicyEngine;