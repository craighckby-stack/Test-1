// Sovereign AGI v7.4.4 - RIMP Integrity Verifier Engine
// This module utilizes the prioritized baseline snapshot to perform intelligent, tiered integrity checks.
// Refactored for scalability and better asynchronous dependency management (Cycle 1: Hash Abstraction).

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
        
        // Dependency Injection for external tools
        // The 'SimulatedIntegrityHasher' (or actual Crypto/FS utility) is injected here.
        this.integrityHasher = environmentServices.integrityHasher || null;

        // Prepare for integration with standardized logging
        this.logger = environmentServices.logger || console; 
        
        // Sorting keys upfront based on descending priority for efficient iteration
        this.componentKeys = Object.keys(baselineConfig.components).sort((a, b) => 
            baselineConfig.components[b].priority - baselineConfig.components[a].priority
        );

        if (!this.integrityHasher) {
             this._log('WARNING: Integrity Hash calculation tool not provided. Scan will proceed but requires external injection for functionality.', 'warn');
        }

        this._log(`Initialized RIMP Engine ${this.verifierId} using ${this.hashAlgorithm}.`);
    }

    _log(message, level = 'info') {
        // Use structured logging preparation instead of simple console.log
        if (this.logger && this.logger[level]) {
            this.logger[level](`[RIMP::${this.verifierId}] ${message}`);
        } else {
             // Fallback if logger doesn't have the level (e.g., standard console)
            console.log(`[RIMP::${this.verifierId}] [${level.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Executes the integrity scan.
     * @param {number} maxPriority - Only components with priority <= this value are checked.
     * @param {boolean} differential - If true, only reports MODIFIED/ERROR results.
     * @returns {Promise<Object>} Results map.
     */
    async executeScan(maxPriority, differential = false) {
        if (!this.integrityHasher) {
             this._log('Cannot execute scan: Integrity Hash calculation tool is missing.', 'error');
             throw new Error('Missing IntegrityHasher dependency.');
        }

        this._log(`Starting Integrity Scan (Max P: ${maxPriority}, Differential: ${differential})`);
        const results = {};
        
        for (const key of this.componentKeys) {
            const component = this.baseline.components[key];
            if (component.priority <= maxPriority) {
                this._log(`Verifying component: ${key} (P: ${component.priority})`, 'debug');
                
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
                        this._log(`Error reading file ${path}: ${error.message}`, 'error');
                        continue; // Move to the next file
                    }

                    if (currentHash !== expectedHash) {
                        results[path] = {
                            status: RIMP_STATUS.MODIFIED,
                            current: currentHash,
                            expected: expectedHash
                        };
                        this._log(`Integrity breach detected: ${path}`, 'warn');
                    } else if (!differential) {
                        results[path] = { status: RIMP_STATUS.OK };
                    }
                }
            }
        }
        this._log(`Scan complete. Found ${Object.keys(results).filter(p => results[p].status !== RIMP_STATUS.OK).length} integrity issues.`);
        return results;
    }

    // _calculateFileHash has been abstracted into the SimulatedIntegrityHasher plugin.
}

module.exports = IntegrityVerifierEngine;