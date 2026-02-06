/**
 * @module DataSourceRouter
 * @description Centralized data access utility employing the Strategy pattern for retrieval.
 * Interprets definitions from primitives config and routes requests to registered Handlers,
 * enforcing structured caching and security constraints.
 */

// Importing required configurations and infrastructure components
import { DataSourcePrimitives } from '../../config/DataSourcePrimitives.json';
import CacheManager from './CacheManager.js';
import Logger from '../utility/Logger.js'; 
import DataTransformer from './DataTransformer.js';

// Handlers (Strategies) - Implementations must reside in core/data/handlers/
import APIPullSyncHandler from './handlers/APIPullSyncHandler.js'; 
import MessageBusAsyncHandler from './handlers/MessageBusAsyncHandler.js';
import DBPersistenceHandler from './handlers/DBPersistenceHandler.js'; 

class DataSourceRouter {
    constructor() {
        this.primitives = DataSourcePrimitives;
        this.logger = Logger.module('DataSourceRouter');

        // Strategy Map: Maps retrieval_method strings to concrete Handler instances.
        this.handlers = {
            'API_PULL_SYNC': new APIPullSyncHandler(),
            'MESSAGE_BUS_ASYNC': new MessageBusAsyncHandler(),
            'DATABASE_QUERY': new DBPersistenceHandler(),
        };
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

        // 2. Determine Retrieval Strategy (Handler)
        const handlerKey = source.retrieval_method;
        const handler = this.handlers[handlerKey];

        if (!handler) {
            if (handlerKey === 'SUBSCRIPTION_STREAM') {
                 // Stream handling is out of scope for standard synchronous retrieval.
                 this.logger.warn(`Attempted use of unsupported stream handler: ${handlerKey}`);
                 throw new Error('Stream handling requires dedicated continuous subscription service.');
            }
            this.logger.error(`Unsupported retrieval strategy: ${handlerKey}`);
            throw new Error(`Unsupported retrieval method: ${handlerKey}`);
        }

        this.logger.info(`Retrieving data for ${key} using strategy: ${handlerKey}`);

        // 3. Execute Handler Retrieval
        let rawData;
        try {
            // Handlers must implement a consistent interface: handle(key, source_config)
            rawData = await handler.handle(key, source); 
        } catch (error) {
            this.logger.error(`Handler failed for ${key} (${handlerKey}):`, error);
            throw new Error(`Data retrieval failed for ${key}. Cause: ${error.message}`);
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
