import { TRUST_METRICS_SCHEMA, TRUST_POLARITY } from '../config/trustCalculusSchema';

/**
 * CoreTrustCalculator
 * Utilizes the PolarizedWeightedScorer tool (provided by the kernel environment) 
 * to convert raw component metrics into a single normalized Trust Score (0.0 to 1.0).
 */
export class CoreTrustCalculator {
    
    /**
     * Calculates the normalized Trust Score.
     * @param {Record<string, number>} rawMetrics - Input metrics (0.0 to 1.0) for redundancyScore, usageRate, etc.
     * @returns {number} The final normalized Trust Score (0.0 to 1.0).
     * @throws {Error} If a required metric is missing or outside the expected [0, 1] range.
     */
    static calculateScore(rawMetrics: Record<string, number>): number {
        
        // Assuming PolarizedWeightedScorer is globally available via the AGI-KERNEL environment
        const Scorer = (PolarizedWeightedScorer as any);

        try {
            // Delegate the core logic (validation, polarization, weighting, summation)
            return Scorer.calculate({
                rawMetrics: rawMetrics,
                scoringSchema: TRUST_METRICS_SCHEMA,
                negativePolarityKey: TRUST_POLARITY.NEGATIVE
            });
        } catch (e) {
            // Wrap the error thrown by the plugin to maintain class context
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`[CoreTrustCalculator] Scoring failed: ${errorMessage}`);
        }
    }
}