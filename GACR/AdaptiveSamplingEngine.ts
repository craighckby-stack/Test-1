/**
 * AdaptiveSamplingEngine.ts
 * 
 * Utility component required to implement the 'ResourceUtilization' AdaptiveSampling Policy
 * defined in TelemetryAggregatorConfig. It dynamically calculates the necessary 
 * sampling rate based on monitored resource constraints (CPU/Memory/Queue Depth),
 * ensuring stability by enforcing the most restrictive limit.
 * 
 * AGI KERNEL V8.5.1 IMPROVEMENT (Enhanced Resilience):
 * 1. Implemented a robust local reduction fallback mechanism (_localCalculateRate) 
 *    to ensure throttling based on observed constraints continues even if the external 
 *    ConstraintReducer capability fails.
 * 2. Maintained improved internal modularity and V7 Synergy hook usage.
 */

import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

// Define configuration extensions, using safe defaults if not provided centrally.
type AdaptiveSamplingConfig = AggregatorConfig['Processing']['AdaptiveSampling'] & {
    TargetCPUUtilization?: number;
    TargetMemoryUtilization?: number;
    TargetQueueDepthRatio?: number;
};

// Define the shape of a constraint used internally
type Constraint = { current: number; target: number };

// V7 Synergy requirement: Add name property for metric logging
type NamedConstraint = Constraint & { name: string }; 

// Define the expected return structure from the ConstraintReducer capability
type ReductionResult = {
    rate: number;
    restrictingConstraint: NamedConstraint | null;
};

// Default targets for core constraints, used if config is missing
const DEFAULT_TARGETS = {
    cpu: 0.80, 
    memory: 0.85, 
    queueDepth: 0.70
};

// --- KERNEL V7 SYNERGY: Global declarations for plugin access ---
declare const ConstraintReducer: {
    execute: (constraints: { name: string, current: number, target: number }[]) => Promise<ReductionResult>;
};
declare const KERNEL_HOOK: {
    log(eventName: string, data: any): void;
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
     * Helper to collect metrics and format them into NamedConstraint objects.
     */
    private _getConstraints(): NamedConstraint[] {
        const metrics = {
            cpu: this.monitor.getCpuUtilization(),
            memory: this.monitor.getMemoryUtilization(), 
            queueDepth: this.monitor.getQueueDepthRatio(),
        };

        const constraints: NamedConstraint[] = [
            { 
                name: 'CPU',
                current: metrics.cpu, 
                target: this.config.TargetCPUUtilization ?? DEFAULT_TARGETS.cpu 
            },
            {
                name: 'Memory',
                current: metrics.memory, 
                target: this.config.TargetMemoryUtilization ?? DEFAULT_TARGETS.memory 
            },
            {
                name: 'QueueDepth',
                current: metrics.queueDepth, 
                target: this.config.TargetQueueDepthRatio ?? DEFAULT_TARGETS.queueDepth 
            },
        ];
        
        // Filter out constraints where metrics are not valid numbers or targets are zero/missing,
        // preventing division by zero or nonsensical calculations in the reducer.
        return constraints.filter(c => 
            typeof c.current === 'number' && 
            typeof c.target === 'number' && 
            c.target > 0
        ) as NamedConstraint[];
    }

    /**
     * Applies configured Max/Min sampling rate boundaries and precision formatting.
     */
    private _applyBoundaries(rate: number): number {
        let finalRate = rate;
        
        // Apply global boundaries defined in the configuration
        finalRate = Math.min(finalRate, this.config.MaxSamplingRate);
        finalRate = Math.max(finalRate, this.config.MinSamplingRate);

        // Ensure fixed precision (4 decimal places)
        return Math.round(finalRate * 10000) / 10000;
    }

    /**
     * Internal fallback method: Calculates the required rate based on local constraints
     * by finding the ratio (target / current) for the most restrictive resource.
     * This acts as a protective measure if the complex external ConstraintReducer fails.
     */
    private _localCalculateRate(constraints: NamedConstraint[]): ReductionResult {
        let requiredRate = 1.0;
        let restrictingConstraint: NamedConstraint | null = null;

        for (const constraint of constraints) {
            // Calculate the ratio needed to bring current utilization down to target utilization.
            // If current is significantly higher than target, this ratio enforces throttling.
            const rateRatio = constraint.target / constraint.current;
            
            const rateToApply = Math.min(1.0, rateRatio);

            if (rateToApply < requiredRate) {
                requiredRate = rateToApply;
                restrictingConstraint = constraint;
            }
        }

        return { rate: requiredRate, restrictingConstraint };
    }

    /**
     * Calculates the current required sampling rate (0.0 to 1.0) based on the most severe constraint.
     */
    public async getSamplingRate(): Promise<number> {
        if (!this.config.Enabled) {
            return 1.0;
        }

        const constraints = this._getConstraints();
        
        // If no valid constraints were found (e.g., monitor failure), default to full sampling
        if (constraints.length === 0) {
             return this._applyBoundaries(1.0);
        }

        let requiredRate = 1.0;
        let restrictingConstraint: NamedConstraint | null = null;
        
        // --- START: KERNEL V7 Synergy Integration: Using formalized ConstraintReducer Plugin ---
        
        // Payload only includes necessary fields for the external capability
        const constraintsPayload = constraints.map(({ name, current, target }) => ({ name, current, target }));

        try {
            // Execute the optimized ConstraintReducer capability (Primary Path)
            const reductionResult: ReductionResult = await ConstraintReducer.execute(constraintsPayload);
            requiredRate = reductionResult.rate;
            restrictingConstraint = reductionResult.restrictingConstraint;

        } catch (e) {
            // Fallback if plugin execution fails (Enhanced Resilience Path)
            console.warn("ConstraintReducer capability failed. Falling back to local adaptive calculation:", e);
            const fallbackResult = this._localCalculateRate(constraints);
            requiredRate = fallbackResult.rate;
            restrictingConstraint = fallbackResult.restrictingConstraint;
        }
        
        // V7 SYNERGY LOGIC INJECTION: Self-Correcting Hook
        // Log decision parameters if sampling is enforced (< 1.0) 
        if (requiredRate < 1.0 && restrictingConstraint && typeof KERNEL_HOOK !== 'undefined') {
            KERNEL_HOOK.log('AdaptiveSamplingDecision', {
                rateAdjustment: requiredRate,
                constrainingFactor: restrictingConstraint.name,
                currentUtilization: restrictingConstraint.current,
                targetUtilization: restrictingConstraint.target
            });
        }
        
        // --- END: KERNEL V7 Synergy Integration ---

        return this._applyBoundaries(requiredRate);
    }
}