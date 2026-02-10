/**
 * Trust Calculus Preprocessor Service
 * Implements the normalization and initial weighting logic defined in the 
 * GOVERNANCE CONFIGURATIONS to convert raw RMS metrics into standardized
 * Trust Score components.
 */
import { METRIC_CONFIGURATIONS } from '../governance/retirementMetricWeights.js';

// Assume AGI-KERNEL provides plugin interface for metric calculation.
declare const AGI: {
    plugins: {
        MetricContributionCalculator: {
            execute: (args: { rawValue: number, config: any, historicalContext?: any }) => number;
        }
    }
}

/**
 * Processes a bundle of raw metrics into weighted Trust Score contributions.
 * @param {Object<string, number>} rawMetrics - Map of metric names to raw values.
 * @returns {Object<string, number>} Map of metric names to their weighted contributions.
 */
export function calculateTrustContributions(rawMetrics: Record<string, number>): Record<string, number> {
    const contributions: Record<string, number> = {};

    for (const [metricName, config] of Object.entries(METRIC_CONFIGURATIONS)) {
        const rawValue = rawMetrics[metricName];

        if (rawValue === undefined || rawValue === null) {
            console.warn(`Raw metric ${metricName} missing. Skipping calculation.`);
            continue;
        }

        try {
            // Delegate normalization, weighting, and influence application to the dedicated utility plugin.
            const contribution = AGI.plugins.MetricContributionCalculator.execute({
                rawValue,
                config,
                // historicalContext might be required for 'percentile_rank' strategy
                historicalContext: undefined 
            });
            
            contributions[metricName] = contribution;
            
        } catch (error) {
            console.error(`Error calculating contribution for ${metricName}:`, error);
            contributions[metricName] = 0;
        }
    }

    return contributions;
}

// Example export for utility
export default { calculateTrustContributions };