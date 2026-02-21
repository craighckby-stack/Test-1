/**
 * AdaptiveSamplingEngine.ts
 * 
 * Utility component required to implement the 'ResourceUtilization' AdaptiveSampling Policy
 * defined in TelemetryAggregatorConfig. It dynamically calculates the necessary 
 * sampling rate based on monitored resource constraints (CPU/Memory/Queue Depth).
 */

import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

/**
 * AdaptiveSamplingEngine class.
 */
export class AdaptiveSamplingEngine {
    /**
     * Configuration object for adaptive sampling.
     */
    private config: AggregatorConfig['Processing']['AdaptiveSampling'];

    /**
     * Resource monitor instance.
     */
    private monitor: ResourceMonitor;

    /**
     * Constructor for AdaptiveSamplingEngine.
     * 
     * @param config Adaptive sampling configuration.
     */
    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = config;
        this.monitor = new ResourceMonitor();
    }

    /**
     * Calculates the current required sampling rate (0.0 to 1.0).
     * 
     * @returns The current sampling rate.
     */
    public getSamplingRate(): number {
        // If adaptive sampling is disabled, return the maximum sampling rate.
        if (!this.config.Enabled) {
            return 1.0;
        }

        // Get the current CPU utilization.
        const currentCpu = this.monitor.getCpuUtilization();

        // Get the target CPU utilization from the configuration.
        const targetCpu = this.config.TargetCPUUtilization;

        // Initialize the sampling rate to 1.0 (maximum).
        let rate = 1.0;

        // If the current CPU utilization exceeds the target, aggressively drop samples.
        if (currentCpu > targetCpu) {
            // Calculate the necessary drop factor using a proportional mechanism.
            rate = targetCpu / currentCpu;
        }

        // Ensure the sampling rate stays within the defined boundaries.
        rate = Math.min(rate, this.config.MaxSamplingRate);
        rate = Math.max(rate, this.config.MinSamplingRate);

        // Return the sampling rate as a float with 4 decimal places.
        return parseFloat(rate.toFixed(4));
    }
}