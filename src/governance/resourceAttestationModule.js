/**
 * RESOURCE ATTESTATION MODULE (RAM)
 * ID: RAM-G01 (Orchestrator Role)
 * GSEP Role: Pre-execution resource integrity verification using A-07 (Autonomy Core telemetry).
 *
 * The RAM ensures that the target environment and the Autogeny Sandbox (C-04)
 * are provisioned correctly and meet minimum operational guarantees. This prevents
 * Mutation Failure Due to Environmental Drift (MFDED) and enhances rollback safety.
 */

const AttestationFailureRecord = require('./AttestationFailureRecord');

// NOTE: The runCheck utility has been extracted into the ResilientTaskExecutor plugin.
// The class uses dependency injection to access the standardized execution utility.

class ResourceAttestationModule {
    /**
     * @param {object} config - The baseline configuration and thresholds.
     * @param {object} environmentMonitor - The telemetry source for real-time resource data.
     * @param {object} checkRegistry - The centralized source of all defined resource checks.
     * @param {object} [taskExecutor] - Dependency injection for the ResilientTaskExecutor utility.
     */
    constructor(config, environmentMonitor, checkRegistry, taskExecutor = null) {
        if (!config || !environmentMonitor || !checkRegistry) {
            // Updated failure record to reflect new dependency requirement
            throw new AttestationFailureRecord('RAM_INIT_001', 'Initialization failed: Missing config, environment monitor, or CheckRegistry dependency.');
        }
        this.baselineConfig = config;
        this.environmentMonitor = environmentMonitor;
        this.checkRegistry = checkRegistry;
        
        // Attempt to resolve dependency, preferring explicit injection
        this.taskExecutor = taskExecutor || (typeof ResilientTaskExecutor !== 'undefined' ? ResilientTaskExecutor : null);

        if (!this.taskExecutor) {
             console.error("RAM-G01 Initialization Warning: ResilientTaskExecutor dependency missing.");
             // Note: In a production kernel environment, this should be guaranteed available.
        }

        console.log('RAM-G01 initialized. Using Check Registry for flexible attestations.');
    }

    /**
     * Executes environmental checks necessary for stable mutation execution.
     *
     * @typedef {object} AttestationReport
     * @property {boolean} success - True if all checks passed.
     * @property {Array<{check: string, status: string, details: object}>} results - Detailed output of each check.
     *
     * @param {object} payloadMetadata - Metadata detailing resources required by the mutation (e.g., requiredResources).
     * @returns {Promise<AttestationReport>} Structured report detailing check outcomes.
     */
    async executePreExecutionCheck(payloadMetadata) {
        if (!this.taskExecutor) {
             throw new AttestationFailureRecord('RAM_EXEC_002', 'Cannot execute checks: ResilientTaskExecutor is unavailable.');
        }
        
        const requiredResources = payloadMetadata.requiredResources || {};
        const checksToRun = this.checkRegistry.getChecks(); 

        if (checksToRun.length === 0) {
            console.warn("RAM-G01: Check Registry is empty. Bypassing attestation (Potential Security Risk).");
            return { success: true, results: [] };
        }

        console.log(`RAM-G01: Initiating concurrent attestation of ${checksToRun.length} resources (Payload: ${payloadMetadata.id || 'N/A'}).`);

        // 1. Map checks into executable promises wrapped by the ResilientTaskExecutor.
        // The Executor handles standardization of success/failure/error outcomes.
        const checkPromises = checksToRun.map(check => 
            this.taskExecutor.execute(
                check.id, 
                () => check.execute(requiredResources, this.environmentMonitor, this.baselineConfig)
            )
        );

        // 2. Execute all checks simultaneously.
        const checkResults = await Promise.all(checkPromises);

        // 3. Aggregate results and finalize report.
        const report = {
            success: true,
            results: []
        };

        checkResults.forEach(result => {
            report.results.push({
                check: result.id, // Using 'id' provided by the executor
                status: result.status,
                details: result.details
            });
            if (!result.success) {
                report.success = false;
            }
        });

        if (!report.success) {
             // Throw standardized record containing the full failure report
             throw new AttestationFailureRecord('RAM_CHECK_FAIL', 'Resource attestation failed one or more critical checks. Mutation execution halted.', { report });
        }

        console.log("RAM-G01: Attestation passed successfully.");
        return report;
    }
}

module.exports = ResourceAttestationModule;