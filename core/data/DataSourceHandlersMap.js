import APIPullSyncHandler from './handlers/APIPullSyncHandler.js';
import MessageBusAsyncHandler from './handlers/MessageBusAsyncHandler.js';
import DBPersistenceHandler from './handlers/DBPersistenceHandler.js';

/**
 * Strategy Map: Maps retrieval_method strings (from DataSourcePrimitives) 
 * to concrete Handler classes. This acts as the Service Locator for Strategies,
 * allowing the DataSourceRouter to remain decoupled from individual strategy implementations.
 */
const DataSourceHandlersMap = {
    'API_PULL_SYNC': APIPullSyncHandler,
    'MESSAGE_BUS_ASYNC': MessageBusAsyncHandler,
    'DATABASE_QUERY': DBPersistenceHandler,
    // Add new handlers here:
    // 'SUBSCRIPTION_STREAM': NewStreamingHandler,
};

export default DataSourceHandlersMap;