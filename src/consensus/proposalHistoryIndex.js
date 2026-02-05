/**
 * Proposal Success History Index (PSHI) v94.1 - High-Efficiency Indexing
 * Stores and analyzes historical metadata concerning generated code proposals (AGI-C-14 output).
 * Utilizes indexed maps for O(1) agent-specific access and O(N) contextual analysis, supporting
 * rapid recalibration of ARCH-ATM (agent trust) and AGI-C-12 CIW (contextual weighting).
 */

class ProposalHistoryIndex {
    /**
     * @param {object} [config] - Configuration options.
     * @param {number} [config.maxHistorySize=5000] - Max number of events retained in temporal index.
     */
    constructor(config = {}) {
        // Configuration options (e.g., maximum history size for pruning)
        this.maxHistorySize = config.maxHistorySize || 5000;
        
        // Primary raw history array (used for temporal context and pruning)
        this.history = []; 
        
        // Index 1: Quick lookups by proposal ID (Map facilitates O(1) removal on prune)
        this.proposalsById = new Map();
        
        // Index 2: Aggregation map for agent performance: { agentId: { successCount: N, failureCount: M, recentScores: [] } }
        this.agentPerformanceMap = new Map(); 
    }

    /**
     * Records a new proposal event, validates schema, and updates internal indices.
     * @param {object} eventData - Standardized proposal metrics payload.
     */
    recordProposalEvent(eventData) {
        if (!eventData || !eventData.proposal_id || !eventData.agent_id) {
            console.warn("[PSHI] Invalid event data structure encountered. Event rejected.");
            return false;
        }

        const normalizedEvent = {
            ...eventData,
            creation_timestamp: Date.now(), // Ensure temporal indexing consistency
            isSuccess: eventData.validation_status === 'ACCEPTED', // Normalized status
        };

        // 1. Update temporal history and lookups
        this.history.push(normalizedEvent);
        this.proposalsById.set(normalizedEvent.proposal_id, normalizedEvent);
        
        this._pruneHistory();

        // 2. Update agent performance aggregates (Index 2)
        const agentId = normalizedEvent.agent_id;
        if (!this.agentPerformanceMap.has(agentId)) {
            this.agentPerformanceMap.set(agentId, { successCount: 0, failureCount: 0, recentScores: [] });
        }

        const stats = this.agentPerformanceMap.get(agentId);
        if (normalizedEvent.isSuccess) {
            stats.successCount++;
        } else {
            stats.failureCount++;
        }

        // Add recent CIW score for weighted metrics analysis
        if (normalizedEvent.actual_score_ciw !== undefined) {
            stats.recentScores.push(normalizedEvent.actual_score_ciw);
            // Limit recent score tracking (Last 50 proposals)
            if (stats.recentScores.length > 50) {
                stats.recentScores.shift(); 
            }
        }
        
        return true;
    }

    /**
     * Implements a FIFO/LRU-like pruning mechanism based on maxHistorySize.
     */
    _pruneHistory() {
        if (this.history.length > this.maxHistorySize) {
            const excessCount = this.history.length - this.maxHistorySize;
            for (let i = 0; i < excessCount; i++) {
                const oldEvent = this.history.shift(); // Remove oldest temporal record
                if (oldEvent && oldEvent.proposal_id) {
                    this.proposalsById.delete(oldEvent.proposal_id);
                    // Note: Agent counts are preserved for long-term ATM statistics unless explicitly decayed by PME.
                }
            }
        }
    }
    
    /**
     * Provides ARCH-ATM system with weighted historical performance data.
     * Efficiency: O(1) access to aggregated counts.
     * @param {string} agentId - The ID of the agent.
     * @returns {{ rawRate: number, recentWeight: number, totalProposals: number }} Performance snapshot.
     */
    calculateAgentSuccessRate(agentId) {
        const stats = this.agentPerformanceMap.get(agentId);
        
        if (!stats) {
            return { rawRate: 0, recentWeight: 0, totalProposals: 0 };
        }
        
        const total = stats.successCount + stats.failureCount;
        const rawRate = total > 0 ? (stats.successCount / total) : 0;
        
        // Simple average of recent CIW scores (normalized quality metric)
        const recentWeight = stats.recentScores.length > 0
            ? stats.recentScores.reduce((a, b) => a + b, 0) / stats.recentScores.length
            : 0;
        
        return {
            rawRate: rawRate,
            recentWeight: recentWeight,
            totalProposals: total
        };
    }

    /**
     * Retrieves bias data for specific failure topologies/contexts by scanning history.
     * Used by MCRA/SIC to adjust threshold requirements.
     * @param {string} topologyType - E.g., 'API_Schema_Misalignment', 'Memory_Leak_Pattern'.
     * @returns {number} Bias metric (Ratio of this failure type to all failures).
     */
    getFailurePatternBias(topologyType) {
        let matchCount = 0;
        let totalFailures = 0;
        
        // O(N) required for detailed pattern scanning across temporal history
        for (const event of this.history) {
            if (!event.isSuccess) {
                totalFailures++;
                // Assumes event data includes failure_reason_tags
                if (event.failure_reason_tags && event.failure_reason_tags.includes(topologyType)) {
                    matchCount++;
                }
            }
        }

        if (totalFailures === 0) return 0;
        
        return matchCount / totalFailures; 
    }
}

module.exports = ProposalHistoryIndex;