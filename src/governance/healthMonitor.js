// src/governance/healthMonitor.js
/**
 * GHM: Governance Health Monitor
 * Responsible for continuously assessing the operational integrity of the OGT Core components.
 */
class GovernanceHealthMonitor {
    constructor({ mcraEngine, atmSystem, policyEngine, auditLogger }) {
        this.components = { mcraEngine, atmSystem, policyEngine, auditLogger };
    }

    /**
     * Polls individual OGT components for their status and latency.
     * Assumes component classes expose a `runDiagnostics()` method.
     * @param {string} componentId - The ID of the component (e.g., 'C-11', 'ATM').
     * @returns {Promise<{isReady: boolean, latencyMs: number, healthScore: number}>}
     */
    async checkComponentStatus(componentId) {
        const component = this.components[componentId];
        if (!component) return { isReady: false, latencyMs: -1, healthScore: 0 };
        
        try {
            const start = Date.now();
            await component.runDiagnostics();
            const latencyMs = Date.now() - start;
            
            // Normalize score based on internal thresholds (e.g., 500ms max acceptable latency)
            const healthScore = 1.0 - (latencyMs / 500);
            
            return {
                isReady: true,
                latencyMs,
                healthScore: Math.max(0, healthScore)
            };
        } catch (error) {
            console.error(`GHM failure for ${componentId}:`, error);
            return { isReady: false, latencyMs: -1, healthScore: 0 };
        }
    }

    /**
     * Aggregates the health scores of all OGT components into a single GRS.
     * The GRS must meet a minimum threshold for GSEP Stage 3 to proceed.
     * @returns {Promise<number>} Governance Readiness Signal (GRS: 0.0 to 1.0)
     */
    async getGovernanceReadinessSignal() {
        const componentKeys = Object.keys(this.components);
        const checks = await Promise.all(componentKeys.map(key => this.checkComponentStatus(key)));

        const totalWeight = componentKeys.length;
        const totalScore = checks.reduce((sum, status) => sum + status.healthScore, 0);

        // GRS is the average normalized health score
        return totalScore / totalWeight;
    }

    /**
     * Primary interface for the GSEP protocol check in Stage 3.
     * @param {number} requiredThreshold - Minimum acceptable GRS (e.g., 0.85).
     * @returns {Promise<boolean>}
     */
    async isReady(requiredThreshold = 0.85) {
        const grs = await this.getGovernanceReadinessSignal();
        return grs >= requiredThreshold;
    }
}

module.exports = GovernanceHealthMonitor;