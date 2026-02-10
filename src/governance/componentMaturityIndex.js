/**
 * src/governance/componentMaturityIndex.js
 * Component Maturity Index (CMI): Provides real-time quantitative stability metrics 
 * for all registered components (Section 2.0). 
 * This data acts as a mandatory input layer for the MCRA (C-11) and ATM scoring systems.
 */

// Define types for clarity in TypeScript environment
interface ComponentMetrics {
    stabilityIndex: number;
    failureWindowAvg: string;
    maturityStage: string;
}

interface RawComponentMetrics {
    runtimeMetrics: { 
        failures: number; 
        totalRequests: number; 
    };
    failureWindow: { 
        avgTimeMs: number; 
        maxExpectedMs: number;
    };
    deploymentMetrics: { 
        passRate: number; 
    };
}

// Assumption: ComponentMaturityMetricDeriver plugin is available at runtime
declare const ComponentMaturityMetricDeriver: {
    calculateIndex(componentId: string, rawMetrics: RawComponentMetrics): ComponentMetrics;
};

class ComponentMaturityIndex {
    private statusMap: Map<string, ComponentMetrics>;

    constructor() {
        this.statusMap = new Map<string, ComponentMetrics>();
        // Load baseline data from persistent store/telemetry pipeline
    }

    /**
     * Retrieves objective component health metrics.
     * @param {string} componentId 
     * @returns {ComponentMetrics}
     */
    getMetrics(componentId: string): ComponentMetrics {
        // Retrieve and calculate current weighted stability metrics
        return this.statusMap.get(componentId) || { stabilityIndex: 0.5, failureWindowAvg: 'N/A', maturityStage: 'Unknown' };
    }

    /**
     * CMI recalculation trigger, typically fed by FBA post-execution data.
     * Delegates complex derivation logic to the ComponentMaturityMetricDeriver tool.
     * @param {string} componentId
     * @param {RawComponentMetrics} rawMetrics
     * @returns {ComponentMetrics}
     */
    recalculateIndex(componentId: string, rawMetrics: RawComponentMetrics): ComponentMetrics {
        if (typeof ComponentMaturityMetricDeriver === 'undefined' || !ComponentMaturityMetricDeriver.calculateIndex) {
             console.error("ComponentMaturityMetricDeriver plugin is required for complex calculation.");
             return this.getMetrics(componentId);
        }

        // Use the specialized plugin to handle the complex, weighted index derivation.
        const newMetrics = ComponentMaturityMetricDeriver.calculateIndex(componentId, rawMetrics);
        
        this.statusMap.set(componentId, newMetrics);
        return newMetrics;
    }
}

module.exports = ComponentMaturityIndex;