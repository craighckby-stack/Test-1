/**
 * AdaptiveSamplingEngine.ts
 * 
 * Utility component required to implement the 'ResourceUtilization' AdaptiveSampling Policy
 * defined in TelemetryAggregatorConfig. It dynamically calculates the necessary 
 * sampling rate based on monitored resource constraints (CPU/Memory/Queue Depth),
 * ensuring stability by enforcing the most restrictive limit.
 * 
 * AGI KERNEL V7.5.0 IMPROVEMENT: 
 * 1. Implemented Dependency Injection for ResourceMonitor to improve testability.
 * 2. Extracted the core multi-constraint normalization logic into the 'ConstraintReducer' 
 *    emergent capability for reuse in future cycles (Pattern Recognition Success).
 */

import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

// Define configuration extensions, using safe defaults if not provided centrally.
type AdaptiveSamplingConfig = AggregatorConfig['Processing']['AdaptiveSampling'] & {
    TargetCPUUtilization?: number;
    TargetMemoryUtilization?: number;
    TargetQueueDepthRatio?: number;
};

// Define the shape of a constraint used internally and externally (by the emergent tool)
type Constraint = { current: number; target: number };

// Default targets for core constraints, used if config is missing
const DEFAULT_TARGETS = {
    cpu: 0.80, 
    memory: 0.85, 
    queueDepth: 0.70
};

export class AdaptiveSamplingEngine {
    private config: AdaptiveSamplingConfig;
    private monitor: ResourceMonitor;

    /**
     * Constructor using dependency injection for ResourceMonitor.
     */
    constructor(config: AdaptiveSamplingConfig, monitor?: ResourceMonitor) {
        this.config = config;
        this.monitor = monitor ?? new ResourceMonitor(); 
    }

    /**
     * Calculates the current required sampling rate (0.0 to 1.0) based on the most severe constraint.
     */
    public getSamplingRate(): number {
        if (!this.config.Enabled) {
            return 1.0;
        }

        // Collect all metrics 
        const metrics = {
            cpu: this.monitor.getCpuUtilization(),
            memory: this.monitor.getMemoryUtilization(), 
            queueDepth: this.monitor.getQueueDepthRatio(),
        };

        // Construct the constraints array, applying robust defaults
        const constraints: Constraint[] = [
            { 
                current: metrics.cpu, 
                target: this.config.TargetCPUUtilization ?? DEFAULT_TARGETS.cpu 
            },
            {
                current: metrics.memory, 
                target: this.config.TargetMemoryUtilization ?? DEFAULT_TARGETS.memory 
            },
            {
                current: metrics.queueDepth, 
                target: this.config.TargetQueueDepthRatio ?? DEFAULT_TARGETS.queueDepth 
            },
        ].filter(c => 
            typeof c.current === 'number' && 
            typeof c.target === 'number' && 
            c.target > 0
        ) as Constraint[]; 
        
        // The logic below implements the core pattern recognized and extracted as 'ConstraintReducer'
        let requiredRate = 1.0;

        // Iterate through constraints, enforcing the most restrictive proportional drop factor
        for (const { current, target } of constraints) {
            if (current > target) {
                // Rate = Target / Current ensures proportional reduction based on overshoot
                const dropFactor = target / current;
                requiredRate = Math.min(requiredRate, dropFactor);
            }
        }

        // Apply global boundaries defined in the configuration
        requiredRate = Math.min(requiredRate, this.config.MaxSamplingRate);
        requiredRate = Math.max(requiredRate, this.config.MinSamplingRate);

        // Ensure fixed precision (4 decimal places)
        return Math.round(requiredRate * 10000) / 10000;
    }
}