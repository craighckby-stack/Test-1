/**
 * AdaptiveSamplingEngine.ts
 * 
 * Utility component required to implement the 'ResourceUtilization' AdaptiveSampling Policy
 * defined in TelemetryAggregatorConfig. It dynamically calculates the necessary 
 * sampling rate based on monitored resource constraints (CPU/Memory/Queue Depth).
 * 
 * AGI KERNEL V7.5.0 IMPROVEMENT: 
 * Implemented multi-constraint adherence (CPU, Memory, Queue Depth) as required 
 * by the system specification, ensuring stability by enforcing the most restrictive limit.
 */

import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

// Defining required configuration extensions based on component description
type AdaptiveSamplingConfig = AggregatorConfig['Processing']['AdaptiveSampling'] & {
    TargetMemoryUtilization?: number;
    TargetQueueDepthRatio?: number;
};

export class AdaptiveSamplingEngine {
    private config: AdaptiveSamplingConfig;
    private monitor: ResourceMonitor;

    constructor(config: AdaptiveSamplingConfig) {
        this.config = config;
        this.monitor = new ResourceMonitor();
    }

    /**
     * Calculates the current required sampling rate (0.0 to 1.0) based on the most severe constraint.
     */
    public getSamplingRate(): number {
        if (!this.config.Enabled) {
            return 1.0;
        }

        // Collect all metrics (assuming corresponding methods in ResourceMonitor)
        const metrics = {
            cpu: this.monitor.getCpuUtilization(),
            memory: this.monitor.getMemoryUtilization(), 
            queueDepth: this.monitor.getQueueDepthRatio(),
        };

        // Define constraints and apply defaults if configuration is sparse (e.g., 0.85 for memory)
        const constraints = [
            { current: metrics.cpu, target: this.config.TargetCPUUtilization },
            { current: metrics.memory, target: this.config.TargetMemoryUtilization || 0.85 },
            { current: metrics.queueDepth, target: this.config.TargetQueueDepthRatio || 0.70 },
        ];

        let rates: number[] = [1.0]; // Initialize with 1.0 (no reduction)

        // Calculate proportional reduction required for each metric
        for (const { current, target } of constraints) {
            // Ensure metrics are valid and constraint is violated
            if (current != null && target != null && current > target && target > 0) {
                // Calculate necessary proportional drop factor: rate = target / current
                rates.push(target / current);
            }
        }

        // The final rate is determined by the most restrictive constraint (the minimum rate)
        let rate = Math.min(...rates);

        // Ensure the rate stays within defined boundaries
        rate = Math.min(rate, this.config.MaxSamplingRate);
        rate = Math.max(rate, this.config.MinSamplingRate);

        // Use Math.round for fast fixed precision (4 decimal places)
        return Math.round(rate * 10000) / 10000;
    }
}