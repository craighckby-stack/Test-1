/**
 * AdaptiveSamplingEngine.ts
 * 
 * Utility component required to implement the 'ResourceUtilization' AdaptiveSampling Policy
 * defined in TelemetryAggregatorConfig. It dynamically calculates the necessary 
 * sampling rate based on monitored resource constraints (CPU/Memory/Queue Depth),
 * ensuring stability by enforcing the most restrictive limit.
 *
 * Refactoring Note: The synchronous local rate calculation logic has been abstracted
 * into the `ConstraintRateReducer` plugin and is now injected/defaulted for the fallback path.
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

// Interface matching the abstracted ConstraintRateReducer plugin
interface IConstraintRateReducer {
    reduce(constraints: NamedConstraint[]): ReductionResult;
}

// Default targets for core constraints, used if config is missing
const DEFAULT_TARGETS = {
    cpu: 0.80, 
    memory: 0.85, 
    queueDepth: 0.70
};

// Robust local fallback implementation (using the abstracted logic)
const defaultLocalReducer: IConstraintRateReducer = {
    /**
     * Calculates the required sampling rate by finding the ratio (target / current) 
     * for the most restrictive resource.
     */
    reduce: (constraints: NamedConstraint[]): ReductionResult => {
        let requiredRate = 1.0;
        let restrictingConstraint: NamedConstraint | null = null;

        for (const constraint of constraints) {
            // Rate Ratio calculation: target / current utilization. 
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
};

// --- KERNEL V7 SYNERGY: Global declarations for plugin access ---
declare const ConstraintReducer: {
    execute: (constraints: { name: string, current: number, target: number }[]) => Promise<ReductionResult>;
};
declare const KERNEL_HOOK: {
    log(eventName: string, data: any): void;
};

export class AdaptiveSamplingEngine {
    private readonly config: AdaptiveSamplingConfig;
    private readonly monitor: ResourceMonitor;
    private readonly localReducer: IConstraintRateReducer; // Handles the local fallback logic

    /**
     * Constructor using dependency injection for ResourceMonitor and ConstraintRateReducer (fallback logic).
     */
    constructor(
        config: AdaptiveSamplingConfig, 
        monitor?: ResourceMonitor,
        rateReducer?: IConstraintRateReducer // New dependency injection point
    ) {
        this.config = config;
        // Ensure ResourceMonitor is initialized, using provided instance or creating a default one.
        this.monitor = monitor ?? new ResourceMonitor(); 
        // Use injected reducer or the robust default implementation.
        this.localReducer = rateReducer ?? defaultLocalReducer;
    }

    /**
     * Helper to collect metrics from the ResourceMonitor and format them 
     * into validated NamedConstraint objects for consumption by the reducer.
     */
    private _getConstraints(): NamedConstraint[] {
        // Collect raw metrics
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
            {S
                name: 'Memory',
                current: metrics.memory,
                target: this.config.TargetMemoryUtilization ?? DEFAULT_TARGETS.memory 
            },
            {S
                name: 'QueueDepth',
                current: metrics.queueDepth,
                target: this.config.TargetQueueDepthRatio ?? DEFAULT_TARGETS.queueDepth 
            },
        ];
        
        // Grounding Filter: Ensure current metrics are finite numbers and targets are non-zero positive,
        // preventing calculation errors (Division by Zero, NaN/Infinity propagation).
        return rawConstraints.filter(c => 
            isFinite(c.current) && 
            c.target > 0
        ) as NamedConstraint[];
    }

    /**
     * Applies configured Max/Min sampling rate boundaries and precision formatting.
     */
    private _applyBoundaries(rate: number): number {
        const { MaxSamplingRate, MinSamplingRate } = this.config;
        
        // Apply global boundaries defined in the configuration
        let finalRate = Math.min(rate, MaxSamplingRate);
        finalRate = Math.max(finalRate, MinSamplingRate);

        // Ensure fixed precision (4 decimal places)
        return Math.round(finalRate * 10000) / 10000;
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
        let calculationSource: 'Reducer' | 'LocalFallback';
        
        // --- START: KERNEL V7 Synergy Integration ---
        
        // Prepare payload for external system contract
        const constraintsPayload = constraints.map(c => ({ name: c.name, current: c.current, target: c.target }));

        try {
            // Primary Path: Execute the optimized ConstraintReducer capability
            reductionResult = await ConstraintReducer.execute(constraintsPayload);
            calculationSource = 'Reducer';

        } catch (e) {
            // Enhanced Resilience Path: Fallback if plugin execution fails
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.warn(`[ASE] ConstraintReducer failed or unavailable. Falling back to local calculation. Error: ${errorMsg}`);
            
            // Refactored: Use the injected/default local reducer utility (ConstraintRateReducer logic)
            reductionResult = this.localReducer.reduce(constraints);
            calculationSource = 'LocalFallback';
        }
        
        const { rate: requiredRate, restrictingConstraint } = reductionResult;

        // V7 SYNERGY LOGIC INJECTION: Self-Correcting Hook Logging
        // Log decision parameters if sampling is enforced (< 1.0) and the hook is available.
        if (requiredRate < 1.0 && restrictingConstraint && typeof KERNEL_HOOK !== 'undefined') {
            KERNEL_HOOK.log('AdaptiveSamplingDecision', {
                rateAdjustment: requiredRate,
                constrainingFactor: restrictingConstraint.name,
                currentUtilization: restrictingConstraint.current,
                targetUtilization: restrictingConstraint.target,
                source: calculationSource // Explicit source tracking for resilience analysis
            });
        }
        
        // --- END: KERNEL V7 Synergy Integration ---

        return this._applyBoundaries(requiredRate);
    }
}