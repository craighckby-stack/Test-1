// Sovereign AGI v94.1 Telemetry Vetting Pipeline Enforcer
import { CryptoService } from '../security/CryptoService';
import VettingConfig from '../../config/governance/TelemetryVettingSpec.json';

// Placeholder for an internal logging utility (assumes existence or falls back to console)
const internalLogger = { 
    warn: (message: string) => console.warn(`[VETTING ENFORCER] ${message}`),
    debug: (message: string) => process.env.NODE_ENV !== 'production' && console.log(`[VETTING ENFORCER DEBUG] ${message}`)
};

// Assuming the AGI Kernel makes the extracted plugin available
// This interface defines the expected structure for AGI tool usage
interface VettingTransformerArgs {
    action: string;
    payload: object;
    rule: object;
    hasher: (data: string, algorithm: string) => string;
}
interface TelemetryVettingTransformerPlugin {
    execute(args: VettingTransformerArgs): object;
}

// Global reference provided by the AGI Kernel (or similar mechanism)
// eslint-disable-next-line @typescript-eslint/naming-convention
declare const TelemetryVettingTransformer: TelemetryVettingTransformerPlugin;


/**
 * Manages the autonomous enforcement of telemetry hygiene and governance rules.
 * This ensures data integrity, privacy compliance (e.g., dropping IPs), and sampling.
 */
export class TelemetryVettingPipelineEnforcer {
    private vettingRules: Record<string, any>;
    private defaultAction: string;
    private globalSamplingRate: number;
    private crypto: CryptoService;
    private logger: typeof internalLogger;

    /**
     * @param {object} config - The telemetry vetting specification configuration.
     * @param {CryptoService} cryptoService - Dependency for secure data transformation (e.g., hashing).
     */
    constructor(config: any = VettingConfig, cryptoService = new CryptoService()) {
        if (!config.metrics || !config.defaultPolicy) {
            throw new Error("TelemetryVettingSpec is improperly configured. Missing 'metrics' or 'defaultPolicy'.");
        }
        this.vettingRules = config.metrics;
        this.defaultAction = config.defaultPolicy;
        this.globalSamplingRate = config.samplingRateGlobal || 1.0;
        this.crypto = cryptoService;
        this.logger = internalLogger;

        if (typeof TelemetryVettingTransformer === 'undefined') {
             this.logger.warn("TelemetryVettingTransformer plugin not loaded. Hashing and specific transformations may fail.");
        }
    }

    /**
     * Determines the appropriate action and sampling rate for a metric key.
     * @param {string} metricKey
     * @returns {{ rule: object, action: string, samplingRate: number }}
     * @private
     */
    private _getRuleAndAction(metricKey: string): { rule: any, action: string, samplingRate: number } {
        const rule = this.vettingRules[metricKey] || {};
        const action = rule.action || this.defaultAction;
        const samplingRate = rule.sample_rate_override !== undefined
            ? rule.sample_rate_override
            : this.globalSamplingRate;

        return { rule, action, samplingRate };
    }

    /**
     * Executes necessary data transformation using the extracted TelemetryVettingTransformer plugin.
     * @param {string} action
     * @param {object} payload
     * @param {object} rule - Specific rule details.
     * @returns {object} The transformed payload.
     * @private
     */
    private _applyTransformation(action: string, payload: object, rule: object): object {
        if (typeof TelemetryVettingTransformer === 'undefined' || !TelemetryVettingTransformer.execute) {
            // Safety fallback if plugin is unavailable
            this.logger.warn(`Vetting transformation requested for action ${action}, but TelemetryVettingTransformer is unavailable.`);
            return payload; 
        }

        // We pass the hashing function (from CryptoService) directly to the plugin 
        // to decouple the CryptoService dependency from the transformation logic itself.
        const hasher = (data: string, algorithm: string) => this.crypto.hash(data, algorithm);

        return TelemetryVettingTransformer.execute({
            action,
            payload,
            rule,
            hasher
        });
    }

    /**
     * Intercepts a telemetry event and enforces hygiene rules.
     * @param {string} metricKey The name of the metric.
     * @param {object} payload The raw event payload
     * @returns {object | null} The processed payload, or null if dropped/sampled out.
     */
    public enforce(metricKey: string, payload: object): object | null {
        const { rule, action, samplingRate } = this._getRuleAndAction(metricKey);

        if (action === 'DROP_IMMEDIATELY') {
            this.logger.warn(`Hard drop enforced for metric: ${metricKey}`);
            return null;
        }

        // Sampling check (Crucial performance gate before processing)
        if (samplingRate < 1.0 && Math.random() >= samplingRate) {
            this.logger.debug(`Sampled out metric: ${metricKey}`);
            return null;
        }

        return this._applyTransformation(action, payload, rule);
    }
}

// Create a singleton instance for simplified module export usage
const TelemetryEnforcerInstance = new TelemetryVettingPipelineEnforcer();

/**
 * Standard public API wrapper for rule enforcement.
 * @param {string} metricKey The name of the metric.
 * @param {object} payload The raw event payload
 * @returns {object | null} The processed payload.
 */
export function enforceTelemetryRules(metricKey: string, payload: object): object | null {
    return TelemetryEnforcerInstance.enforce(metricKey, payload);
}