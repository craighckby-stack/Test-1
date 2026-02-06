import APIPullSyncHandler from './handlers/APIPullSyncHandler.js';
import MessageBusAsyncHandler from './handlers/MessageBusAsyncHandler.js';
import DBPersistenceHandler from './handlers/DBPersistenceHandler.js';

/**
 * @typedef {import('./handlers/IDataSourceHandler.js').IDataSourceHandler} IDataSourceHandler
 */

/**
 * @type {Readonly<Record<string, IDataSourceHandler>>}
 * 
 * Data Source Handler Strategy Map (Service Locator Pattern).
 * Maps standardized retrieval methods (e.g., defined in Primitives) 
 * to concrete implementation classes for data interaction.
 * 
 * This map is frozen for runtime safety and configuration integrity.
 * Handler classes MUST implement the IDataSourceHandler interface.
 */
const DataSourceHandlersMap = Object.freeze({
    // Synchronous data retrieval methods
    'API_PULL_SYNC': APIPullSyncHandler,

    // Asynchronous/Event-driven data retrieval methods
    'MESSAGE_BUS_ASYNC': MessageBusAsyncHandler,

    // Persistence/storage layer access methods
    'DATABASE_QUERY': DBPersistenceHandler,

    // --- Template for future extension ---
    // 'SUBSCRIPTION_STREAM': NewStreamingHandler,
});

export default DataSourceHandlersMap;