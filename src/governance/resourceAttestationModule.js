/**
 * RESOURCE ATTESTATION MODULE (RAM)
 * ID: RAM-G01
 * GSEP Role: Pre-execution resource integrity verification using A-07 (Autonomy Core telemetry).
 *
 * The RAM ensures that the target environment and the Autogeny Sandbox (C-04)
 * are provisioned correctly and meet minimum operational guarantees. This prevents
 * Mutation Failure Due to Environmental Drift (MFDED) and enhances rollback safety.
 */

const AttestationFailureRecord = require('./AttestationFailureRecord');

/**
 * Internal utility function to wrap and standardize asynchronous check execution.
 * Ensures consistent result formatting and handles internal check failures gracefully.
 * @param {string} name - The identifier for the check.
 * @param {function(): Promise<{success: boolean, details: object}>} promiseFn - The asynchronous function executing the check logic.
 * @returns {Promise<object>} Structured result object.
 */
const runCheck = async (name, promiseFn) => {
    try {
        const result = await promiseFn();
        return {
            check: name,
            status: result.success ? 'PASS' : 'FAIL',
            details: result.details || {},
            success: result.success
        };
    } catch (error) {
        // Catch errors originating from the environmentMonitor or dependency resolution
        return {
            check: name,
            status: 'ERROR',
            details: { message: `Critical error during check execution: ${error.message}`, stack: error.stack },
            success: false
        };
    }
};

class ResourceAttestationModule {
    /**
     * @param {object} config - The baseline configuration and thresholds.
     * @param {object} environmentMonitor - The telemetry source for real-time resource data.
     * 
     * Future Improvement: Inject ResourceCheckRegistry here instead of hardcoding internal checks.
     */
    constructor(config, environmentMonitor) {
        if (!config || !environmentMonitor) {
            throw new AttestationFailureRecord('RAM_INIT_001', 'Initialization failed: Missing config or environment monitor dependency.');
        }
        this.baselineConfig = config;
        this.environmentMonitor = environmentMonitor;
    }

    /**
     * Executes environmental checks necessary for stable mutation execution.
     * Must pass prior to Architectural Staging Lock (EPDP D).
     * @typedef {object} AttestationReport
     * @property {boolean} success - True if all checks passed.
     * @property {Array<{check: string, status: string, details: object}>} results - Detailed output of each check.
     *
     * @param {object} payloadMetadata - Metadata detailing resources required by the mutation.
     * @returns {Promise<AttestationReport>} Structured report detailing check outcomes.
     */
    async executePreExecutionCheck(payloadMetadata) {
        const requiredResources = payloadMetadata.requiredResources || {};
        console.log(`RAM-G01: Initiating resource attestation (Payload: ${payloadMetadata.id || 'N/A'}).`);

        // 1. Define checks to run (in anticipation of using a Check Registry).
        const checkPromises = [
            runCheck('C04_ISOLATION_CHECK', () => this._verifySandboxIntegrity()),
            runCheck('HW_AVAILABILITY_CHECK', () => this._checkHardwareAvailability(requiredResources)),
            runCheck('OP_CONSTRAINTS_CHECK', () => this._checkOperationalConstraints(requiredResources))
        ];

        // 2. Execute all checks simultaneously for maximum efficiency.
        const checkResults = await Promise.all(checkPromises);

        // 3. Aggregate results and finalize report.
        const report = {
            success: true,
            results: []
        };

        checkResults.forEach(result => {
            report.results.push({
                check: result.check,
                status: result.status,
                details: result.details
            });
            if (!result.success) {
                report.success = false;
            }
        });

        if (!report.success) {
             // Throw standardized record containing the full failure report
             throw new AttestationFailureRecord('RAM_CHECK_FAIL', 'Resource attestation failed one or more critical checks.', { report });
        }

        return report;
    }

    /**
     * Internal check for hardware/resource minimums against baselines.
     * @param {object} requirements
     * @returns {Promise<{success: boolean, details: object}>}
     */
    async _checkHardwareAvailability(requirements) {
        const currentResources = await this.environmentMonitor.getCurrentState();
        const details = { current: currentResources, required: requirements, discrepancies: [] };
        let success = true;

        // Check Max CPU Threshold (Ambient System Stress)
        if (currentResources.cpuLoad > (this.baselineConfig.maxCpuThreshold || 80)) { // Added fallback default
            success = false;
            details.discrepancies.push(`CPU Load (${currentResources.cpuLoad.toFixed(2)}%) exceeds system max threshold (${this.baselineConfig.maxCpuThreshold}%).`);
        }

        // Check Min Memory Availability
        if (requirements.minMemory && currentResources.availableMemory < requirements.minMemory) {
            success = false;
            details.discrepancies.push(`Available Memory (${currentResources.availableMemory} bytes) is below payload minimum requirement (${requirements.minMemory} bytes).`);
        }
        
        return { success, details };
    }

    /**
     * Internal helper to ensure C-04 (Autogeny Sandbox) operational readiness.
     * @returns {Promise<{success: boolean, details: object}>}
     */
    async _verifySandboxIntegrity() {
        // Logic to verify container health, resource limit enforcement, and kernel namespace isolation.
        
        // Simulation of telemetry fetching
        const isolationStatus = (await this.environmentMonitor.getSandboxHealth()).status || 'OK'; 
        const enforcementLevel = this.baselineConfig.requiredIsolationLevel || 'HIGH';
        
        if (isolationStatus !== 'OK') {
             return { success: false, details: { status: isolationStatus, reason: 'C-04 Sandbox environment reported unhealthy status.' } };
        }

        return { success: true, details: { isolationLevel: enforcementLevel } };
    }

    /**
     * Checks operational requirements like external service latency or critical statuses.
     * @param {object} requirements
     * @returns {Promise<{success: boolean, details: object}>}
     */
    async _checkOperationalConstraints(requirements) {
        // Example check: Sentinel database (D-09) latency
        if (requirements.requiresSentinelAccess) {
            const latency = await this.environmentMonitor.ping('sentinel_db');
            if (latency > (this.baselineConfig.maxDbLatency || 150)) { // Added fallback default
                return { 
                    success: false, 
                    details: { constraint: 'SENTINEL_LATENCY', measured: latency, threshold: this.baselineConfig.maxDbLatency } 
                };
            }
        }
        return { success: true, details: { } };
    }
}

module.exports = ResourceAttestationModule;
