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
 * 3. Uses the 'ConstraintReducer' emergent capability to calculate the base required rate,
 *    necessitating the conversion of getSamplingRate() to an asynchronous function.
 * 4. KERNEL V7 SYNERGY: Injected self-correcting telemetry hook to track restriction events.
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
    execute: (constraints: any[]) => Promise<ReductionResult>;
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
     * Calculates the current required sampling rate (0.0 to 1.0) based on the most severe constraint.
     */
    public async getSamplingRate(): Promise<number> {
        if (!this.config.Enabled) {
            return 1.0;
        }

        // Collect all metrics 
        const metrics = {
            cpu: this.monitor.getCpuUtilization(),
            memory: this.monitor.getMemoryUtilization(), 
            queueDepth: this.monitor.getQueueDepthRatio(),
        };

        // Construct the named constraints array
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
        ].filter(c => 
            typeof c.current === 'number' && 
            typeof c.target === 'number' && 
            c.target > 0
        ) as NamedConstraint[]; 
        
        let requiredRate = 1.0;
        let restrictingConstraint: NamedConstraint | null = null;
        
        // --- START: KERNEL V7 Synergy Integration: Using formalized ConstraintReducer Plugin ---
        
        // Payload only includes necessary fields for the external capability
        const constraintsPayload = constraints.map(({ name, current, target }) => ({ name, current, target }));

        // CRITICAL REFACTOR: Removed complex global check and local fallback. 
        // We now rely purely on the formalized, optimized ConstraintReducer capability.
        try {
            // Execute the plugin defined below
            const reductionResult: ReductionResult = await ConstraintReducer.execute(constraintsPayload);
            requiredRate = reductionResult.rate;
            restrictingConstraint = reductionResult.restrictingConstraint;
        } catch (e) {
            // Fallback if plugin execution fails (e.g., environment error), using default 1.0 rate.
            console.error("Failed to execute ConstraintReducer capability, defaulting to full sampling:", e);
        }
        
        // V7 SYNERGY LOGIC INJECTION: Self-Correcting Hook
        // Log decision parameters if sampling is enforced (< 1.0) for self-correction modeling/optimization metrics.
        if (requiredRate < 1.0 && restrictingConstraint && typeof KERNEL_HOOK !== 'undefined') {
            KERNEL_HOOK.log('AdaptiveSamplingDecision', {
                rateAdjustment: requiredRate,
                constrainingFactor: restrictingConstraint.name,
                currentUtilization: restrictingConstraint.current,
                targetUtilization: restrictingConstraint.target
            });
        }
        
        // --- END: KERNEL V7 Synergy Integration ---

        // Apply global boundaries defined in the configuration
        requiredRate = Math.min(requiredRate, this.config.MaxSamplingRate);
        requiredRate = Math.max(requiredRate, this.config.MinSamplingRate);

        // Ensure fixed precision (4 decimal places)
        return Math.round(requiredRate * 10000) / 10000;
    }
}