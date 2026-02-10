// Define minimal interfaces for required plugins based on usage
interface IRateLimiter {
    check(key: string): boolean;
}

interface ISchemaValidator {
    validate(schema: object, payload: object): boolean;
    // Assuming a method to retrieve specific validation errors exists in the AGI-KERNEL validators
    getErrors?(): string[]; 
}

interface ITaskQueue {
    enqueue(task: object): Promise<void>;
}

/**
 * Type definition for the Action Registry configuration structure.
 */
interface ActionConfig {
    rate_limit_key?: string;
    schema: {
        input: object;
        output?: object;
    };
    execution_type: 'SYNCHRONOUS' | 'ASYNCHRONOUS' | 'ASYNCHRONOUS_EXTERNAL';
    handler_path: string;
    retry_policy?: object;
}

interface ActionRegistry {
    actions: { [key: string]: ActionConfig };
}


class DCM_Action_Scheduler_and_Gatekeeper {
    private registry: { [key: string]: ActionConfig };
    private rateLimiter: IRateLimiter; // Uses RateLimitingService
    private taskQueue: ITaskQueue; // Uses ResilientQueueFactory instance
    private schemaValidator: ISchemaValidator; // Uses SchemaValidationService

    /**
     * Manages action governance (rate limiting, queues) and determines execution routing.
     * This component decouples the core DCM decision engine from execution logic details.
     * 
     * @param {ActionRegistry} actionRegistry - The loaded DCM_Action_Registry configuration.
     * @param {IRateLimiter} rateLimiter - Instance of RateLimitingService.
     * @param {ISchemaValidator} schemaValidator - Instance of SchemaValidationService.
     * @param {ITaskQueue} taskQueue - Instance provided by ResilientQueueFactory.
     */
    constructor(
        actionRegistry: ActionRegistry, 
        rateLimiter: IRateLimiter, 
        schemaValidator: ISchemaValidator, 
        taskQueue: ITaskQueue
    ) {
        this.registry = actionRegistry.actions;
        this.rateLimiter = rateLimiter; 
        this.schemaValidator = schemaValidator; 
        this.taskQueue = taskQueue;
    }

    /**
     * Performs governance checks (rate limiting, validation) and routes the action for execution.
     * @param {string} actionKey - Key identifying the action configuration.
     * @param {any} payload - Input data for the action.
     * @param {any} context - Runtime context information.
     * @returns {Promise<any>} Execution result or scheduling confirmation.
     */
    async scheduleExecution(actionKey: string, payload: any, context: any): Promise<any> {
        const config = this.registry[actionKey];
        if (!config) {
            throw new Error(`[DCM_Scheduler] Action ${actionKey} not found in registry.`);
        }

        // 1. Governance Check (Rate Limiting Enforcement)
        if (config.rate_limit_key) {
            if (!this.rateLimiter.check(config.rate_limit_key)) {
                throw new Error(`[DCM_Scheduler] Rate limit exceeded for action: ${actionKey}`); 
            }
        }

        // 2. Schema Validation (Input)
        if (config.schema?.input) {
            if (!this.schemaValidator.validate(config.schema.input, payload)) {
                let errorDetails = '';
                if (this.schemaValidator.getErrors) {
                    errorDetails = `. Details: ${this.schemaValidator.getErrors().join('; ')}`;
                }
                throw new Error(`[DCM_Scheduler] Validation failed for payload of action: ${actionKey}${errorDetails}`);
            }
        }

        // 3. Execution Routing
        switch (config.execution_type) {
            case 'SYNCHRONOUS':
                // Local direct handler invocation (blocking operation)
                const Handler = require(config.handler_path);
                
                if (typeof Handler.execute !== 'function') {
                    throw new Error(`[DCM_Scheduler] Synchronous handler at path ${config.handler_path} does not export an 'execute' function.`);
                }

                // Execute the handler immediately
                return await Handler.execute(payload, context);
            
            case 'ASYNCHRONOUS':
            case 'ASYNCHRONOUS_EXTERNAL':
                // Queue the task for background worker consumption
                await this.taskQueue.enqueue({
                    actionKey: actionKey,
                    handlerPath: config.handler_path,
                    payload: payload,
                    context: context,
                    retryPolicy: config.retry_policy
                });
                return { success: true, status: 202, message: `Action ${actionKey} scheduled asynchronously` };
            
            default:
                throw new Error(`[DCM_Scheduler] Unknown execution type: ${config.execution_type}`);
        }
    }
}

export = DCM_Action_Scheduler_and_Gatekeeper;