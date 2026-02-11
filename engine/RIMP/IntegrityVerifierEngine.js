// Sovereign AGI v7.4.4 - RIMP Integrity Verifier Engine
// This module utilizes the prioritized baseline snapshot to perform intelligent, tiered integrity checks.
// Refactored for scalability and better asynchronous dependency management (Cycle 1: Hash Abstraction).

// NOTE: Assumes ContextualLogger is available, either required or globally registered in the AGI-KERNEL environment.

const RIMP_STATUS = {
    MODIFIED: 'MODIFIED',
    OK: 'OK',
    ERROR: 'ERROR_READ'
};

class IntegrityVerifierEngine {
    #baseline;
    #hashAlgorithm;
    #verifierId;
    #contextualLogger;
    #integrityHasher;
    #componentKeys;

    /**
     * @param {Object} baselineConfig - Configuration including components, priority, and algorithm.
     * @param {Object} environmentServices - Simulated environment services (fs, crypto, logger, integrityHasher).
     */
    constructor(baselineConfig, environmentServices = {}) {
        this.#initializeEngine(baselineConfig, environmentServices);
    }

    /**
     * Performs synchronous initialization and dependency resolution.
     * @param {Object} baselineConfig 
     * @param {Object} environmentServices 
     */
    #initializeEngine(baselineConfig, environmentServices) {
        this.#baseline = baselineConfig;
        this.#hashAlgorithm = baselineConfig.algorithm || 'SHA256';
        this.#verifierId = baselineConfig.snapshotId;
        
        // Initialize Contextual Logger plugin
        this.#contextualLogger = new ContextualLogger(`RIMP::${this.#verifierId}`, environmentServices.logger);

        // Dependency Injection for external tools
        this.#integrityHasher = environmentServices.integrityHasher || null;

        // Sorting keys upfront based on descending priority for efficient iteration
        this.#componentKeys = Object.keys(baselineConfig.components).sort((a, b) => 
            baselineConfig.components[b].priority - baselineConfig.components[a].priority
        );

        if (!this.#integrityHasher) {
             this.#logWarn('Integrity Hash calculation tool not provided. Scan will proceed but requires external injection for functionality.');
        }

        this.#logInfo(`Initialized RIMP Engine ${this.#verifierId} using ${this.#hashAlgorithm}.`);
    }

    /**
     * Delegates the asynchronous execution request to the external IntegrityHasher tool.
     * @param {string} path 
     * @returns {Promise<string>} The calculated hash.
     */
    async #delegateToIntegrityHasherExecution(path) {
        if (!this.#integrityHasher) {
            throw new Error('IntegrityHasher dependency is missing.');
        }
        // Call the injected external hasher tool
        return await this.#integrityHasher.execute({
            path: path,
            algorithm: this.#hashAlgorithm
        }); 
    }

    // --- Logging Proxies ---
    #logInfo(message) {
        if (this.#contextualLogger) this.#contextualLogger.info(message);
    }
    #logWarn(message) {
        if (this.#contextualLogger) this.#contextualLogger.warn(message);
    }
    #logError(message) {
        if (this.#contextualLogger) this.#contextualLogger.error(message);
    }
    #logDebug(message) {
        if (this.#contextualLogger) this.#contextualLogger.debug(message);
    }
    // -----------------------

    /**
     * Executes the integrity scan.
     * @param {number} maxPriority - Only components with priority <= this value are checked.
     * @param {boolean} differential - If true, only reports MODIFIED/ERROR results.
     * @returns {Promise<Object>} Results map.
     */
    async executeScan(maxPriority, differential = false) {
        if (!this.#integrityHasher) {
             this.#logError('Cannot execute scan: Integrity Hash calculation tool is missing.');
             throw new Error('Missing IntegrityHasher dependency.');
        }

        this.#logInfo(`Starting Integrity Scan (Max P: ${maxPriority}, Differential: ${differential})`);
        const results = {};
        
        for (const key of this.#componentKeys) {
            const component = this.#baseline.components[key];
            if (component.priority <= maxPriority) {
                this.#logDebug(`Verifying component: ${key} (P: ${component.priority})`);
                
                for (const [path, expectedHash] of Object.entries(component.hashes)) {
                    let currentHash;
                    try {
                        // Use I/O proxy for external dependency execution
                        currentHash = await this.#delegateToIntegrityHasherExecution(path);
                    } catch (error) {
                        results[path] = { status: RIMP_STATUS.ERROR, detail: error.message };
                        this.#logError(`Error reading file ${path}: ${error.message}`);
                        continue; // Move to the next file
                    }

                    if (currentHash !== expectedHash) {
                        results[path] = {
                            status: RIMP_STATUS.MODIFIED,
                            current: currentHash,
                            expected: expectedHash
                        };
                        this.#logWarn(`Integrity breach detected: ${path}`);
                    } else if (!differential) {
                        results[path] = { status: RIMP_STATUS.OK };
                    }
                }
            }
        }
        const issuesCount = Object.keys(results).filter(p => results[p].status !== RIMP_STATUS.OK).length;
        this.#logInfo(`Scan complete. Found ${issuesCount} integrity issues.`);
        return results;
    }
}

module.exports = IntegrityVerifierEngine;