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
    /**
     * @param {Object} baselineConfig - Configuration including components, priority, and algorithm.
     * @param {Object} environmentServices - Simulated environment services (fs, crypto, logger, integrityHasher).
     */
    constructor(baselineConfig, environmentServices = {}) {
        this.baseline = baselineConfig;
        this.hashAlgorithm = baselineConfig.algorithm || 'SHA256';
        this.verifierId = baselineConfig.snapshotId;
        
        // Initialize Contextual Logger plugin
        this.contextualLogger = new ContextualLogger(`RIMP::${this.verifierId}`, environmentServices.logger);

        // Dependency Injection for external tools
        // The 'SimulatedIntegrityHasher' (or actual Crypto/FS utility) is injected here.
        this.integrityHasher = environmentServices.integrityHasher || null;

        // Sorting keys upfront based on descending priority for efficient iteration
        this.componentKeys = Object.keys(baselineConfig.components).sort((a, b) => 
            baselineConfig.components[b].priority - baselineConfig.components[a].priority
        );

        if (!this.integrityHasher) {
             this.contextualLogger.warn('Integrity Hash calculation tool not provided. Scan will proceed but requires external injection for functionality.');
        }

        this.contextualLogger.info(`Initialized RIMP Engine ${this.verifierId} using ${this.hashAlgorithm}.`);
    }

    /**
     * Executes the integrity scan.
     * @param {number} maxPriority - Only components with priority <= this value are checked.
     * @param {boolean} differential - If true, only reports MODIFIED/ERROR results.
     * @returns {Promise<Object>} Results map.
     */
    async executeScan(maxPriority, differential = false) {
        if (!this.integrityHasher) {
             this.contextualLogger.error('Cannot execute scan: Integrity Hash calculation tool is missing.');
             throw new Error('Missing IntegrityHasher dependency.');
        }

        this.contextualLogger.info(`Starting Integrity Scan (Max P: ${maxPriority}, Differential: ${differential})`);
        const results = {};
        
        for (const key of this.componentKeys) {
            const component = this.baseline.components[key];
            if (component.priority <= maxPriority) {
                this.contextualLogger.debug(`Verifying component: ${key} (P: ${component.priority})`);
                
                for (const [path, expectedHash] of Object.entries(component.hashes)) {
                    let currentHash;
                    try {
                        // Call the injected external hasher tool
                        currentHash = await this.integrityHasher.execute({
                            path: path,
                            algorithm: this.hashAlgorithm
                        }); 
                    } catch (error) {
                        results[path] = { status: RIMP_STATUS.ERROR, detail: error.message };
                        this.contextualLogger.error(`Error reading file ${path}: ${error.message}`);
                        continue; // Move to the next file
                    }

                    if (currentHash !== expectedHash) {
                        results[path] = {
                            status: RIMP_STATUS.MODIFIED,
                            current: currentHash,
                            expected: expectedHash
                        };
                        this.contextualLogger.warn(`Integrity breach detected: ${path}`);
                    } else if (!differential) {
                        results[path] = { status: RIMP_STATUS.OK };
                    }
                }
            }
        }
        this.contextualLogger.info(`Scan complete. Found ${Object.keys(results).filter(p => results[p].status !== RIMP_STATUS.OK).length} integrity issues.`);
        return results;
    }
}

module.exports = IntegrityVerifierEngine;