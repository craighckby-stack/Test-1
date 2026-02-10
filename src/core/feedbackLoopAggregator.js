/**
 * src/core/feedbackLoopAggregator.js
 *
 * Purpose: Standardizes and aggregates metrics derived from the Consensus Layer 
 * to ensure accurate learning (ATM recalibration and SIC updates).
 * This component is the formalized link between critique and execution/learning.
 */

interface FeedbackRecord {
    timestamp: number;
    proposalId: string;
    success: boolean;
    riskScore_MCRA: number;
    confidenceScore_ATM: number;
    agentWeightDeltas: any; 
}

interface OutcomeData {
    proposalId: string;
    success: boolean;
    mcraScore: number;
    finalAtmScore: number;
    agentWeights: any;
}

// Assumed global availability of the extracted tool for validation and normalization.
declare const FeedbackSchemaNormalizerTool: {
    execute(data: OutcomeData): { error?: string, record?: FeedbackRecord };
}

class FeedbackLoopAggregator {
    private consensusLog: FeedbackRecord[];

    constructor() {
        this.consensusLog = [];
    }

    /**
     * Captures and validates the outcome of a single proposal validation cycle.
     * Validation and normalization logic is delegated to FeedbackSchemaNormalizerTool.
     * @param {Object} outcomeData - Contains proposal ID, success status, applied MCRA threshold, final weighted ATM score, and resulting architecture delta.
     */
    captureConsensusOutcome(outcomeData: OutcomeData): void {
        
        const normalizationResult = FeedbackSchemaNormalizerTool.execute(outcomeData);

        if (normalizationResult.error || !normalizationResult.record) {
            console.error(`Invalid outcome data provided to Aggregator. Error: ${normalizationResult.error || 'Normalization failed.'}`);
            return;
        }
        
        const record = normalizationResult.record;
        
        this.consensusLog.push(record);
        this.processForLearning(record);
    }
    
    /**
     * Immediately feeds the structured record into the ATM and SIC systems.
     * @param {FeedbackRecord} record - The validated feedback record.
     */
    processForLearning(record: FeedbackRecord): void {
        // 1. Trigger ATM System Update (recalibration based on record.success)
        // 2. Trigger SIC Analysis (check if success criteria meets abstraction threshold)
    }

    getHistoricalMetrics(): FeedbackRecord[] {
        return this.consensusLog;
    }
}

module.exports = FeedbackLoopAggregator;