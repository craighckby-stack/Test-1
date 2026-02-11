import { DataSourcePrimitives } from './DataSourcePrimitives.js';
import APIPullSyncHandler from './handlers/APIPullSyncHandler.js';
import MessageBusAsyncHandler from './handlers/MessageBusAsyncHandler.js';
import DBPersistenceHandler from './handlers/DBPersistenceHandler.js';

/**
 * @typedef {import('./handlers/IDataSourceHandler.js').IDataSourceHandler} IDataSourceHandler
 */

/**
 * Defines and freezes the Data Source Handler Strategy Map.
 * This enforces architectural consistency by separating synchronous data preparation
 * and structural guarantees (freezing) from the core module export.
 *
 * @returns {Readonly<Record<string, IDataSourceHandler>>}
 */
function _defineHandlersMap() {
    /**
     * Data Source Handler Strategy Map (Service Locator Pattern).
     * Maps standardized retrieval methods (defined in DataSourcePrimitives)
     * to concrete implementation classes for data interaction.
     * Handler classes MUST implement the IDataSourceHandler interface.
     */
    const map = {
        // Synchronous data retrieval methods
        [DataSourcePrimitives.API_PULL_SYNC]: APIPullSyncHandler,

        // Asynchronous/Event-driven data retrieval methods
        [DataSourcePrimitives.MESSAGE_BUS_ASYNC]: MessageBusAsyncHandler,

        // Persistence/storage layer access methods
        [DataSourcePrimitives.DATABASE_QUERY]: DBPersistenceHandler,
    };

    // The map is frozen for runtime safety and configuration integrity.
    return Object.freeze(map);
}

const DataSourceHandlersMap = _defineHandlersMap();

export default DataSourceHandlersMap;