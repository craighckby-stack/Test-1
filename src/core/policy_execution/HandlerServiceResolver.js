/**
 * HandlerServiceResolver (HSR)
 * Mission: Dynamically resolves service paths defined in config/ems_pe_handlers.json and instantiates them, 
 * applying specified execution metadata (e.g., timeouts, retries).
 *
 * Note: Assumes a module loader/dependency injection framework exists to map 'Service.Method' strings to executable objects.
 */

class HandlerServiceResolver {
    constructor(handlerRegistryConfig) {
        this.registry = handlerRegistryConfig;
        this.cache = new Map();
    }

    /**
     * Initializes all handlers specified in the registry.
     */
    async initialize() {
        console.log("HSR: Initializing execution handlers...");
        for (const [id, definition] of Object.entries(this.registry)) {
            if (!this.cache.has(id)) {
                await this._resolveAndRegister(id, definition);
            }
        }
    }

    /**
     * Retrieves a prepared execution handler object by its ID.
     * @param {string} handlerId - The symbolic ID from assertion_routes.
     * @returns {Object} The callable handler function wrapped with execution metadata.
     */
    getHandler(handlerId) {
        if (!this.cache.has(handlerId)) {
            throw new Error(`Handler ID not found: ${handlerId}`);
        }
        return this.cache.get(handlerId);
    }

    /**
     * Internal function to load the service, bind execution metadata, and cache the result.
     */
    async _resolveAndRegister(id, definition) {
        const [serviceName, methodName] = definition.path.split('.');
        
        // TODO: Implement dependency loading via DI container (e.g., require(serviceName))
        const ServiceModule = require(serviceName); 
        const handlerFunction = ServiceModule[methodName];

        if (typeof handlerFunction !== 'function') {
            throw new Error(`Invalid handler definition for ${id}: Path ${definition.path} does not point to a callable function.`);
        }

        // Wrap the handler function with metadata (for PEE to use during execution)
        const executableWrapper = {
            handler: handlerFunction.bind(ServiceModule), // Ensure 'this' context is preserved
            metadata: definition.execution_metadata || {}
        };
        
        this.cache.set(id, executableWrapper);
        console.log(`HSR: Registered handler ${id} -> ${definition.path}`);
    }
}

module.exports = HandlerServiceResolver;
