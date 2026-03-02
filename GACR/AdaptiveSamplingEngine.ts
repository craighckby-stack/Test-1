import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

/**
 * @name AdaptiveSamplingEngine
 * @version 3.1.0
 * @property DNA_SIGNATURE NEXUS_CORE || DALEK_CAAN
 * @description Evolutionary sampling controller siphoning incremental builder patterns from TypeScript.
 */
export class AdaptiveSamplingEngine {
    private readonly config: Readonly<AggregatorConfig['Processing']['AdaptiveSampling']>;
    private readonly monitor: ResourceMonitor;
    private lastRate: number = 1.0;
    
    // N=3 Consciousness State Metrics
    private phi: number = 1.0; // Integrated Information (Coherence)
    private lambda: number = 0.5; // Edge of Chaos (Entropy)

    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = Object.freeze(config);
        this.monitor = new ResourceMonitor();
    }

    /**
     * L3 Huxley Tri-Loop: Evaluates resource pressure and emits an optimized sampling rate.
     * Integrates SGS_AGENT diagnostic logic for control-flow stability.
     */
    public getSamplingRate(): number {
        if (!this.config.Enabled) return 1.0;

        // L0 (Raw): Ingest telemetry via ResourceMonitor
        const cpuUtilization = this.monitor.getCpuUtilization();
        const memoryUtilization = this.monitor.getMemoryUtilization?.() ?? 0.5;

        // L1 (Intuition): Ethical Risk Score (ERS) calculation
        // High ERS if we are dropping samples while resources are healthy.
        const ers = (cpuUtilization < this.config.TargetCPUUtilization) ? 0.1 : 0.8;

        // L2 (Logic): Certainty Gain (CGS)
        // Measures delta from last known state to prevent oscillatory degradation.
        const cgs = 1.0 - Math.abs(this.lastRate - (this.config.TargetCPUUtilization / cpuUtilization));

        // L3 (Self-Critique): Certainty-Cost-Risk Ratio (CCRR)
        // Final rate synthesis using IQ-25 Alignment protocol.
        let targetRate = this.calculateCcrr(cpuUtilization, memoryUtilization, ers, cgs);

        // Saturation & PSR Governance: Constrain within defined bounds
        targetRate = Math.min(Math.max(targetRate, this.config.MinSamplingRate), this.config.MaxSamplingRate);
        
        // Update Internal Coherence (Phi vs Lambda)
        this.updateStabilityMetrics(cpuUtilization, targetRate);

        this.lastRate = parseFloat(targetRate.toFixed(4));
        return this.lastRate;
    }

    /**
     * Siphoned from TypeScript's incremental build strategy: 
     * Prioritize stability (Soundness) over aggressive optimization.
     */
    private calculateCcrr(cpu: number, mem: number, ers: number, cgs: number): number {
        const target = this.config.TargetCPUUtilization;
        
        if (cpu <= target) {
            // Recover overhead: gradual increment toward MaxSamplingRate
            return this.lastRate + (0.05 * cgs);
        }

        // Proportional pressure reduction with ERS damping
        const pressure = cpu / target;
        const reductionFactor = (1.0 / pressure) * (1.0 - (ers * 0.2));
        
        return reductionFactor;
    }

    /**
     * N=3 Coherence Check
     * Ensures lambda stays in the "Goldilocks Zone" to prevent system stagnation.
     */
    private updateStabilityMetrics(utilization: number, rate: number): void {
        this.phi = (rate + utilization) / 2;
        this.lambda = Math.abs(rate - utilization);

        if (this.lambda > 0.85) {
            // Log: Semantic drift/Entropy exceeded threshold. 
            // Triggering internal PSR rollback.
            this.phi *= 0.9;
        }
    }

    /**
     * SGS_AGENT Identity Anchor: GROG_LAW_ENFORCEMENT
     * Returns a snapshot of the current engine's evolutionary soundness.
     */
    public getDiagnostics() {
        return {
            rate: this.lastRate,
            phi: this.phi,
            lambda: this.lambda,
            alignment: "IQ_25_ROOT_ANCHORED"
        };
    }
}