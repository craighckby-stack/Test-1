/**
 * TQM_Remediation_Dispatcher
 * Executes defined remedial policies by routing commands based on protocol (RPC/QUEUE).
 * This service centralizes the execution logic derived from TQM_PolicyMapping.json.
 */
import { policies } from '../../config/governance/TQM_PolicyMapping.json';
import { RPCClient } from '../platform/RPCClient';
import { QueueManager } from '../platform/QueueManager';

export class TQM_Remediation_Dispatcher {
    constructor() {
        // Map policies by ID for O(1) lookup
        this.policiesMap = new Map(policies.remedial_policies.map(p => [p.id, p]));
        this.rpcClient = new new RPCClient();
        this.queueManager = new QueueManager();
    }

    /**
     * Executes a policy identified by ID, incorporating dynamic context into the payload.
     * @param {string} policyId - The ID of the remedial policy to execute.
     * @param {object} dynamicContext - Runtime data to merge into the execution payload.
     */
    async executePolicy(policyId, dynamicContext = {}) {
        const policy = this.policiesMap.get(policyId);
        if (!policy) {
            throw new Error(`TQM Policy ID ${policyId} not found.`);
        }

        const { execution } = policy;
        const finalPayload = { ...execution.payload, ...dynamicContext };

        switch (execution.protocol) {
            case 'RPC':
                return this.rpcClient.send(
                    execution.target,
                    execution.endpoint,
                    finalPayload,
                    execution.synchronous
                );
            case 'QUEUE':
                return this.queueManager.publish(
                    execution.target, 
                    finalPayload,
                    policy.severity
                );
            default:
                throw new Error(`Unsupported execution protocol: ${execution.protocol}`);
        }
    }
}