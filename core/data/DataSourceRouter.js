/**
 * @module DataSourceRouter
 * @description Centralized data access utility employing the Strategy pattern for retrieval.
 * Interprets definitions from primitives config and routes requests to registered Handlers,
 * enforcing structured caching and security constraints.
 * Uses lazy loading for handler strategies for efficiency and modularity.
 */

// Configurations and Infrastructure
import { DataSourcePrimitives } from '../../config/DataSourcePrimitives.json';
import CacheManager from './CacheManager.js';
import Logger from '../utility/Logger.js'; 
import DataTransformer from './DataTransformer.js';

// Strategy Configuration Map (Decouples Router from concrete Handler imports)
import DataSourceHandlersMap from './DataSourceHandlersMap.js'; 

class DataSourceRouter {
    constructor() {
        this.primitives = DataSourcePrimitives;
        this.logger = Logger.module('DataSourceRouter');
        
        // Strategy Cache: Stores instantiated handler objects for reuse.
        this.handlerInstances = {};
    }

    /**
     * Internal method to retrieve or lazily instantiate a Handler based on its key.
     * Ensures handlers are only instantiated once and retrieves the instance from cache thereafter.
     * @param {string} handlerKey - The key defined in DataSourceHandlersMap.
     * @returns {object} The instantiated Handler object.
     * @private
     */
    _getHandler(handlerKey) {
        if (this.handlerInstances[handlerKey]) {
            return this.handlerInstances[handlerKey];
        }
        
        const HandlerClass = DataSourceHandlersMap[handlerKey];

        if (!HandlerClass) {
            this.logger.error(`Attempted to retrieve unsupported strategy: ${handlerKey}`);
            throw new Error(`Unsupported retrieval method: ${handlerKey}. Check DataSourceHandlersMap.`);
        }
        
        try {
            // Lazy instantiation: Create the handler instance and cache it.
            const handlerInstance = new HandlerClass();
            this.handlerInstances[handlerKey] = handlerInstance;
            return handlerInstance;
        } catch (e) {
            this.logger.error(`Failed to instantiate handler ${handlerKey}:`, e);
            throw new Error(`Configuration Error: Handler instantiation failed for ${handlerKey}.`);
        }
    }

    /**
     * Retrieves data for a specified primitive key, enforcing defined constraints.
     * @param {string} key - The data source key (e.g., 'RCM').
     * @returns {Promise<any>} The retrieved and decoded data.
     */
    async retrieve(key) {
        const source = this.primitives[key];
        if (!source) {
            this.logger.error(`Unknown data source primitive: ${key}`);
            throw new Error(`Unknown data source primitive: ${key}`);
        }

        // 1. Check Cache Policy
        const cachedData = CacheManager.get(key, source.caching_policy);
        if (cachedData) {
            this.logger.debug(`Hit cache for ${key}. Policy: ${source.caching_policy}`);
            return cachedData;
        }

        // 2. Determine and Instantiate Retrieval Strategy (Handler)
        const handlerKey = source.retrieval_method;
        // Lazy load the handler using the internal method
        const handler = this._getHandler(handlerKey);

        this.logger.info(`Retrieving data for ${key} using strategy: ${handlerKey}`);

        // 3. Execute Handler Retrieval
        let rawData;
        try {
            // Handlers must implement a consistent interface: handle(key, source_config)
            rawData = await handler.handle(key, source); 
        } catch (error) {
            this.logger.error(`Handler execution failed for ${key} (${handlerKey}):`, error);
            // Re-throw standardized error format
            throw new Error(`Data retrieval failed for ${key}. Source Handler Error: ${error.message}`);
        }

        // 4. Apply Security and Transformation Logic
        const transformedData = DataTransformer.transform(rawData, source);

        // 5. Update Cache
        CacheManager.set(key, transformedData, source.caching_policy);
        this.logger.debug(`Cached result for ${key}.`);

        return transformedData;
    }
}

export default new DataSourceRouter();
