import manifest from '../../config/protocol/remediation_command_manifest.json';
import { RemediationService } from './RemediationService';

// CRITICAL: Assuming PolicyExecutionRetryUtility is globally available or imported
// In a real TS environment, this would be typed:
// import { PolicyExecutionRetryUtility } from '@@kernel/utilities';

declare const PolicyExecutionRetryUtility: { 
    execute: (fn: () => Promise<any>, policy: any, commandId: string) => Promise<any>
};

/**
 * CommandExecutorPolicyEngine
 * Manages execution context, security validation, and policy adherence
 * (retry logic, idempotency checks) for RCRP commands based on the manifest definitions.
 */
class CommandExecutorPolicyEngine {
    private commandMap: Map<string, any>;
    private service: RemediationService;

    constructor() {
        this.commandMap = this._initializeCommandMap(manifest);
        // RemediationService assumed to handle actual low-level system interactions
        this.service = new RemediationService(); 
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

        const policy = commandDef.metadata.retry_policy;

        // Define the execution logic that will be retried
        const executionFn = async () => {
            // Execute the command via the defined target interface
            return await this.service.dispatch(commandDef.execution_target, commandDef.id, parameters);
        };

        try {
            // Use the extracted utility to handle all retry and backoff logic
            const result = await PolicyExecutionRetryUtility.execute(
                executionFn,
                policy,
                commandId
            );
            return result;
        } catch (error) {
            // The utility handles maximum attempt exhaustion and throws the final error
            throw error;
        }
    }

    _isAuthorized(requiredScope: any, currentClearance: any): boolean {
        // Logic implementation placeholder: Ensure current clearance satisfies required security scope.
        return true; 
    }
}

export default CommandExecutorPolicyEngine;
