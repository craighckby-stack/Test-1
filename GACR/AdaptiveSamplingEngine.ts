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

// Define configuration extensions for resource targets.
interface TargetUtilizationConfig {
    TargetCPUUtilization?: number;
    TargetMemoryUtilization?: number;
    TargetQueueDepthRatio?: number;
}

type AdaptiveSamplingConfig = AggregatorConfig['Processing']['AdaptiveSampling'] & TargetUtilizationConfig;

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
        // Ensure ResourceMonitor is initialized, using provided instance or creating a default one.
        this.monitor = monitor ?? new ResourceMonitor(); 
    }

    /**
     * Helper to collect metrics from the ResourceMonitor and format them 
     * into validated NamedConstraint objects for consumption by the reducer.
     */
    private _getConstraints(): NamedConstraint[] {
        const metrics = {
            cpu: this.monitor.getCpuUtilization(),
            memory: this.monitor.getMemoryUtilization(), 
            queueDepth: this.monitor.getQueueDepthRatio(),
        };

        const rawConstraints: NamedConstraint[] = [
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
        
        // Filter: Ensure current metrics are valid numbers and targets are non-zero positive,
        // preventing corrupted input into calculation logic (e.g., NaN or Division by Zero).
        return rawConstraints.filter(c => 
            typeof c.current === 'number' && 
            !isNaN(c.current) && // Explicit check for NaN robustness
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
     * Internal fallback method (Enhanced Resilience): Calculates the required rate based 
     * on local constraints by finding the ratio (target / current) for the most 
     * restrictive resource.
     */
    private _localCalculateRate(constraints: NamedConstraint[]): ReductionResult {
        let requiredRate = 1.0;
        let restrictingConstraint: NamedConstraint | null = null;

        for (const constraint of constraints) {
            // Rate Ratio calculation: target / current utilization. If current > target, ratio < 1.
            const rateRatio = constraint.target / constraint.current;
            
            // The effective throttling rate cannot exceed 1.0 (no boosting).
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

        let reductionResult: ReductionResult;
        
        // --- START: KERNEL V7 Synergy Integration: Using formalized ConstraintReducer Plugin ---
        
        const constraintsPayload = constraints.map(({ name, current, target }) => ({ name, current, target }));

        try {
            // Primary Path: Execute the optimized ConstraintReducer capability
            reductionResult = await ConstraintReducer.execute(constraintsPayload);

        } catch (e) {
            // Enhanced Resilience Path: Fallback if plugin execution fails
            console.warn(`[ASE] ConstraintReducer failed. Falling back to local calculation. Error: ${e instanceof Error ? e.message : String(e)}`);
            reductionResult = this._localCalculateRate(constraints);
        }
        
        const { rate: requiredRate, restrictingConstraint } = reductionResult;

        // V7 SYNERGY LOGIC INJECTION: Self-Correcting Hook Logging
        // Log decision parameters if sampling is enforced (< 1.0) and the hook is available.
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