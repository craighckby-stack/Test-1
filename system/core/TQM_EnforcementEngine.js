/**
 * TQM_EnforcementEngine.js
 * Purpose: Monitors real-time operational metrics against configured TQM Thresholds
 * and executes the specified mitigation hook when a breach is detected.
 */

const TQM_Thresholds = require('../../config/governance/TQM_Thresholds.json');
const ExecutionHarness = require('../governance/ExecutionHarness');

class TQMEnforcementEngine {
    constructor() {
        this.thresholds = TQM_Thresholds.threshold_categories;
    }

    /**
     * Checks a specific metric against its threshold and triggers the hook if breached.
     * @param {string} categoryName - e.g., 'Code_Evolution_Integrity'
     * @param {string} metricKey - e.g., 'Technical_Debt_Index_Max'
     * @param {number} currentValue - The current measured value
     */
    checkAndEnforce(categoryName, metricKey, currentValue) {
        const category = this.thresholds[categoryName];
        if (!category) return;
        
        const metricConfig = category.metrics[metricKey];
        if (!metricConfig) return;

        const breached = this.isBreached(metricConfig.level, currentValue, metricKey.endsWith('_Min'));

        if (breached) {
            console.error(`[TQM Breach] ${metricKey} (${currentValue}) exceeded limit (${metricConfig.level}). Severity: ${metricConfig.severity}`);
            
            ExecutionHarness.executeHook({
                path: metricConfig.on_breach_hook,
                severity: metricConfig.severity,
                context: { categoryName, metricKey, currentValue }
            });
        }
    }

    isBreached(level, current, isMin) {
        if (isMin) {
            return current < level; // Check if current value is less than required minimum
        } else {
            return current > level; // Check if current value exceeds maximum
        }
    }

    // ... Additional methods for periodic metric ingestion and bulk checking
}

module.exports = new TQMEnforcementEngine();
