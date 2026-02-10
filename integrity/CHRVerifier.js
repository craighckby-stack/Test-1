/*
 * Module: Configuration Hash Registry (CHR) Verifier
 * Function: Provides synchronous methods for C-ICR validation.
 *
 * Dependencies: Node 'fs' (for baseline loading).
 */

const fs = require('fs'); 
// SynchronousFileIntegrityCheckerTool replaces the direct use of 'crypto' and 'fs' for file hashing.

/**
 * NOTE: SynchronousFileIntegrityCheckerTool is provided by the AGI-KERNEL framework.
 * It encapsulates fs.readFileSync and crypto.createHash for file hashing.
 */

class CHRVerifier {
    constructor(baselinePath = 'integrity/baseline_chr.json') {
        this.baselinePath = baselinePath;
        this.baseline = this._loadBaseline();
    }

    _loadBaseline() {
        try {
            // NOTE: Synchronous file read is necessary here for critical system initialization.
            const data = fs.readFileSync(this.baselinePath, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            throw new Error(`CHR Initialization Failure: Could not load baseline registry. ${e.message}`);
        }
    }

    // Refactored to use the synchronous file hashing plugin
    computeFileHash(filePath) {
        // Runtime check for tool availability
        if (typeof SynchronousFileIntegrityCheckerTool === 'undefined' || typeof SynchronousFileIntegrityCheckerTool.execute !== 'function') {
             throw new Error("Dependency Error: SynchronousFileIntegrityCheckerTool is not available.");
        }
        
        try {
            return SynchronousFileIntegrityCheckerTool.execute({
                filePath: filePath,
                algorithm: this.baseline.integrity_algorithm
            });
        } catch (e) {
            // Ensure any error from the synchronous tool is clearly surfaced
            throw new Error(`File hashing failed using tool for path ${filePath}: ${e.message}`);
        }
    }

    async runValidation() {
        const results = [];
        let integrityOK = true;

        for (const cid in this.baseline.registry) {
            if (!Object.prototype.hasOwnProperty.call(this.baseline.registry, cid)) continue;

            const entry = this.baseline.registry[cid];
            let status = 'PASS';
            let runtimeHash = null;
            let error = null;

            try {
                runtimeHash = this.computeFileHash(entry.path);
                
                // Skip validation if expected hash is placeholder (e.g., during registry generation)
                if (entry.hash !== '[GENERATE_RUNTIME_HASH]' && runtimeHash !== entry.hash) {
                    status = 'FAIL';
                    integrityOK = false;
                    error = 'Hash mismatch detected.';
                }

            } catch (e) {
                status = 'FAIL';
                integrityOK = false;
                error = `File read or compute error: ${e.message || String(e)}`;
            }

            results.push({
                cid: cid,
                path: entry.path,
                status: status,
                expected: entry.hash,
                actual: runtimeHash,
                error: error
            });
        }

        return {
            integrity_status: integrityOK ? 'VALID' : 'COMPROMISED',
            algorithm: this.baseline.integrity_algorithm,
            details: results
        };
    }
}

module.exports = CHRVerifier;