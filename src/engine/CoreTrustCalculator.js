import { TRUST_METRICS_SCHEMA, TRUST_POLARITY } from '../config/trustCalculusSchema';

// Assumed availability of the PolarizedWeightedScorer plugin via the AGI-KERNEL environment.
declare const PolarizedWeightedScorer: {
    calculate: (args: {
        rawMetrics: Record<string, number>;
        scoringSchema: Record<string, { weight: number; polarity: string }>;
        negativePolarityKey: string;
    }) => number;
};

/**
 * CoreTrustCalculator
 * Utilizes the PolarizedWeightedScorer tool to convert raw component metrics
 * into a single normalized Trust Score (0.0 to 1.0).
 */
export class CoreTrustCalculator {
    
    /**
     * Calculates the normalized Trust Score.
     * @param {Record<string, number>} rawMetrics - Input metrics (0.0 to 1.0) for redundancyScore, usageRate, etc.
     * @returns {number} The final normalized Trust Score (0.0 to 1.0).
     * @throws {Error} If a required metric is missing or outside the expected [0, 1] range.
     */
    static calculateScore(rawMetrics: Record<string, number>): number {
        
        try {
            // Delegate the core logic (validation, polarization, weighting, summation)
            return PolarizedWeightedScorer.calculate({
                rawMetrics: rawMetrics,
                scoringSchema: TRUST_METRICS_SCHEMA,
                negativePolarityKey: TRUST_POLARITY.NEGATIVE
            });
        } catch (e) {
            // Wrap the error thrown by the plugin to maintain class context
            throw new Error(`[CoreTrustCalculator] Scoring failed: ${e.message}`);
        }
    }
}