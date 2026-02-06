/**
 * Retirement Metrics Service (RMS) - src/governance/retirementMetricsService.js
 * ID: RMS
 * Role: Data Provisioning / Metric Calculation
 *
 * RMS calculates and aggregates highly specific, weighted metrics required by CORE 
 * (Component Obsolescence Review Engine) to perform P-01 Trust Calculus adjudication,
 * focusing primarily on system safety (redundancy), risk (dependency integrity), and overhead (complexity).
 */

import { systemStateMonitor } from '../core/systemStateMonitor.js';
import { dependencyGraph } from '../analysis/dependencyGraph.js';
import { usageTelemetry } from '../analysis/usageTelemetry.js';
import { Logger } from '../utils/logger.js';
import { METRIC_WEIGHTS } from './retirementMetricWeights.js'; // New Configuration Dependency

const logger = new Logger('RMS');

export const retirementMetricsService = {

    /**
     * Processes raw metric scores into normalized, weighted inputs for the CORE Trust Calculus.
     * This ensures standardized input regardless of the underlying measurement scale.
     * @param {object} rawMetrics - Raw scores from underlying analysis engines.
     * @returns {object} Weighted and normalized scores ready for CORE consumption.
     */
    _processAndWeighMetrics(rawMetrics) {
        // Use explicit weighting from the governance configuration

        // Safety Score (High Score encourages retirement, usually related to Redundancy / Low Usage)
        const weightedRedundancy = rawMetrics.redundancyScore * METRIC_WEIGHTS.REDUNDANCY;
        
        // Risk Score (High Score discourages retirement, based on Critical Exposure)
        const weightedExposure = rawMetrics.criticalDependencyExposure * METRIC_WEIGHTS.DEPENDENCY_EXPOSURE;
        
        // Overhead Score (High Score encourages retirement, based on removal benefits)
        const weightedOverhead = rawMetrics.complexityReductionEstimate * METRIC_WEIGHTS.COMPLEXITY_REDUCTION;

        // Usage Rate is an auxiliary factor, typically acting as a penalty for low use
        const usagePenalty = (1 - rawMetrics.usageRate) * METRIC_WEIGHTS.USAGE_RATE_PENALTY; // If usage is 0, penalty is high.

        return {
            raw: rawMetrics,
            adjudicationInput: {
                // The composite trust score fed directly into the P-01 Trust Calculus
                trustCalculusInput: weightedRedundancy - weightedExposure + weightedOverhead + usagePenalty,
                
                // Individual Weighted Factors for auditing
                safetyFactor: weightedRedundancy,
                riskFactor: weightedExposure,
                overheadFactor: weightedOverhead,
                usagePenalty
            }
        };
    },

    /**
     * Estimates the quantitative reduction in system complexity achieved by removing the component.
     * Currently uses an enhanced heuristic until the dedicated Static Analysis Engine (SAE) is integrated.
     * @param {string} componentId - The component to analyze.
     * @param {object} metadata - Optional component metadata to inform the heuristic.
     * @returns {number} Complexity reduction score (0.0 to 1.0).
     */
    _estimateComplexityReduction(componentId, metadata = {}) {
        // Enhanced heuristic placeholder: Tries to normalize based on assumed intrinsic complexity markers.
        const baseComplexity = (metadata.estimatedLoc || 500) / 10000;
        return Math.min(1.0, baseComplexity * 0.7 + (Math.random() * 0.3));
    },

    /**
     * Gathers all necessary weighted data points for a retirement review concurrently.
     * Includes robust error handling and input validation.
     * @param {string} componentId - The component to analyze.
     * @returns {Promise<object>} Contains calculated and weighted metrics required for CORE Trust Calculus input.
     */
    async getComponentMetrics(componentId) {
        if (!componentId || typeof componentId !== 'string') {
            logger.error('Invalid componentId provided to RMS.', { componentId });
            throw new Error('RMS requires a valid component identifier.');
        }
        
        logger.info(`Calculating detailed retirement metrics for ${componentId}. Executing concurrent fetches.`);

        let rawMetrics;
        
        try {
            // Execute independent asynchronous metrics calculations in parallel using Promise.all.
            const [ 
                redundancyScore, 
                criticalDependencyExposure,
                usageRate 
            ] = await Promise.all([
                // 1. Redundancy Score (Safety Metric: Higher is better)
                systemStateMonitor.calculateRedundancy(componentId),
                
                // 2. Dependency Exposure (Risk Metric: Higher is worse)
                dependencyGraph.analyzeCriticalDownstreamRisk(componentId),
                
                // 3. Usage Rate (Should be normalized 0.0 to 1.0)
                usageTelemetry.getHistoricalAverage(componentId)
            ]);

            // 4. Complexity Reduction Estimate (synchronous placeholder)
            const complexityReductionEstimate = this._estimateComplexityReduction(componentId);
            
            rawMetrics = {
                redundancyScore,
                criticalDependencyExposure,
                usageRate: Math.max(0, Math.min(1, usageRate)), // Ensure normalization
                complexityReductionEstimate
            };

        } catch (error) {
            logger.error(`Critical failure retrieving raw metrics for ${componentId}. System integrity compromise detected.`, error);
            throw new Error(`RMS Calculation Failure: Cannot proceed with Trust Calculus input: ${error.message}`);
        }

        // Apply normalization and governance weights
        return this._processAndWeighMetrics(rawMetrics);
    }
};
