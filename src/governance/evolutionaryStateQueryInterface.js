// Component ID: HSI (Hashed State Indexer)
// Mandate: Provide high-efficiency, read-only access to immutable D-01 and MCR records.
// This interface prevents direct querying of the primary state ledger, reducing latency
// during time-critical consensus steps (like C-11 risk assessment and F-01 analysis).

/**
 * @typedef {Object} HighEfficiencyStateRetriever
 * @property {function(Function): void} setFallbackRetriever - Sets the underlying persistent storage lookup function.
 * @property {function(string): (Object|null|Promise<Object|null>)} retrieve - Performs indexed lookup with fallback.
 * @property {function(Array<Object>, string): void} populateIndex - Populates the in-memory index.
 */

class EvolutionaryStateQueryInterface {
    /**
     * @param {Object} mcr - Mutation Chain Registrar reference
     * @param {Object} d01 - Decision Audit Logger reference
     * @param {HighEfficiencyStateRetriever} HESR - Injected High Efficiency State Retriever plugin instance
     */
    constructor(mcr, d01, HESR) {
        this.mcr = mcr; 
        this.d01 = d01; 

        // Inject and configure the HESR tool for optimized lookups
        if (!HESR || typeof HESR.retrieve !== 'function') {
            throw new Error("EvolutionaryStateQueryInterface requires HESR plugin instance.");
        }
        this.HESR = HESR;

        // Configure the fallback mechanism using the D-01 record retrieval
        if (d01 && typeof d01.retrieveRecord === 'function') {
            this.HESR.setFallbackRetriever(d01.retrieveRecord.bind(d01));
        } else {
            console.warn("D-01 dependency missing required 'retrieveRecord' method. HESR will operate without persistent fallback.");
        }
    }

    /**
     * Initializes the optimized index from existing D-01/MCR data.
     * @returns {Promise<boolean>}
     */
    async initialize() {
        // Load recent states/hashes into the indexed map using the HESR tool.
        console.log("HSI initialized and indexing recent evolutionary states using HESR.");
        
        // NOTE: In a complete implementation, data would be fetched from MCR/D01
        // and loaded into the index via this.HESR.populateIndex(data, 'hashKey');
        
        return true;
    }

    /**
     * Retrieves a full evolutionary state artifact by its cryptographic hash or index ID.
     * Optimized for O(1) lookup via the HESR tool, with fallback to D-01.
     * @param {string} stateHashOrId
     * @returns {Object|null}
     */
    getStateByHash(stateHashOrId) {
        // Delegate retrieval logic entirely to the high-efficiency tool
        return this.HESR.retrieve(stateHashOrId);
    }

    /**
     * Provides the historical sequence required for C-11's contextual modeling.
     * @param {number} depth - How many prior steps to retrieve.
     * @returns {Array<Object>}
     */
    getHistoricalContext(depth) {
        // Logic to efficiently retrieve last 'depth' immutable records.
        return [];
    }
}

module.exports = EvolutionaryStateQueryInterface;
