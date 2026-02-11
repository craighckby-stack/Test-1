/**
 * TQM_Remediation_Dispatcher
 * Executes defined remedial policies by routing commands based on protocol (RPC/QUEUE, etc.).
 * Designed for resilience, auditability, and clear separation of execution concerns.
 */
import { policies } from '../../config/governance/TQM_PolicyMapping.json';
import { RPCClient } from '../platform/RPCClient';
import { QueueManager } from '../platform/QueueManager';
import { GovernanceAuditService } from './GovernanceAuditService';

// Define the interface for the extracted routing tool
interface ICommandRouter {
    register(protocolKey: string, handlerFn: Function): void;
    route(protocolKey: string, ...args: any[]): Promise<any>;
}

// NOTE: ProtocolRouter is the concrete implementation of the command routing plugin.
// We declare it here to satisfy TypeScript when instantiating it without an explicit import.
declare class ProtocolRouter implements ICommandRouter { 
    constructor();
    register(protocolKey: string, handlerFn: Function): void;
    route(protocolKey: string, ...args: any[]): Promise<any>;
}

export class TQM_Remediation_Dispatcher {
    
    #policiesMap: Map<string, any>;
    #rpcClient: RPCClient;
    #queueManager: QueueManager;
    #auditService: GovernanceAuditService;
    #commandRouter: ICommandRouter; // Field for protocol routing

    /**
     * @param {object} [dependencies] - Optional dependencies container for robust DI.
     * @param {RPCClient} [dependencies.rpcClient]
     * @param {QueueManager} [dependencies.queueManager]
     * @param {GovernanceAuditService} [dependencies.auditService]
     * @param {ICommandRouter} [dependencies.commandRouter] - For injection during testing.
     */
    constructor(dependencies: any = {}) {
        const { rpcClient, queueManager, auditService, commandRouter } = dependencies;
        
        // 1. Configuration Safety Check and Mapping
        if (!policies || !Array.isArray(policies.remedial_policies)) {
            throw new Error("Invalid TQM configuration: remedial_policies array is missing or malformed.");
        }
        this.#policiesMap = new Map(policies.remedial_policies.map((p: any) => [p.id, p]));
        
        // 2. Dependency Initialization using encapsulation
        this.#rpcClient = rpcClient || new RPCClient();
        this.#queueManager = queueManager || new QueueManager();
        this.#auditService = auditService || new GovernanceAuditService();

        // 3. Command Router Initialization and Registration
        // Use injected router or initialize the concrete ProtocolRouter plugin instance.
        this.#commandRouter = commandRouter || new ProtocolRouter();
        
        // Register handlers, ensuring 'this' context is preserved
        this.#commandRouter.register('RPC', this.#handleRpcExecution.bind(this));
        this.#commandRouter.register('QUEUE', this.#handleQueueExecution.bind(this));
    }

    /**
     * Retrieves a policy and validates its existence.
     * @param {string} policyId 
     * @returns {object} The policy object.
     */
    #getPolicyOrThrow(policyId: string): any {
        const policy = this.#policiesMap.get(policyId);
        if (!policy) {
            this.#auditService.log(policyId, 'LOOKUP_FAILURE', { message: `Policy ID ${policyId} not found.` });
            throw new Error(`TQM Policy ID ${policyId} not found in map.`);
        }
        return policy;
    }

    /**
     * Executes the RPC protocol command.
     * @param {object} execution - Policy execution details.
     * @param {object} payload - The finalized execution payload.
     * @returns {Promise<any>}
     */
    async #handleRpcExecution(execution: any, payload: any): Promise<any> {
        const isSynchronous = execution.synchronous ?? true;
        
        return this.#rpcClient.send(
            execution.target,
            execution.endpoint,
            payload,
            isSynchronous
        );
    }

    /**
     * Executes the QUEUE protocol command.
     * @param {object} execution - Policy execution details.
     * @param {object} payload - The finalized execution payload.
     * @param {string} severity - Severity level for prioritization. (Matches router signature)
     * @returns {Promise<any>}
     */
    async #handleQueueExecution(execution: any, payload: any, severity: string): Promise<any> {
        return this.#queueManager.publish(
            execution.target, 
            payload,
            severity
        );
    }
    
    /**
     * Executes a policy identified by ID, incorporating dynamic context into the payload.
     * @param {string} policyId - The ID of the remedial policy to execute.
     * @param {object} dynamicContext - Runtime data to merge into the execution payload.
     * @returns {Promise<any>} The result of the dispatch operation.
     */
    async executePolicy(policyId: string, dynamicContext: any = {}): Promise<any> {
        const policy = this.#getPolicyOrThrow(policyId);
        const { execution, severity } = policy;
        
        // Construct Payload: Stamp with explicit metadata for enhanced traceability.
        const finalPayload = { 
            ...execution.payload, 
            ...dynamicContext, 
            _policyId: policyId,
            _dispatchTimestamp: Date.now() 
        };

        try {
            // Delegate routing and execution to the command router
            const result = await this.#commandRouter.route(
                execution.protocol,
                execution, 
                finalPayload, 
                severity
            );

            this.#auditService.logExecution(policyId, 'SUCCESS', finalPayload, result);
            return result;

        } catch (error) {
            const errorInstance = error instanceof Error ? error : new Error(String(error));
            
            console.error(`[TQM Dispatcher] Execution failed for ${policyId}:`, errorInstance);
            
            // Log failure before re-throwing
            this.#auditService.logExecution(policyId, 'FAILURE', finalPayload, { 
                error: errorInstance.message, 
                stack: errorInstance.stack 
            });
            
            throw errorInstance; 
        }
    }
}