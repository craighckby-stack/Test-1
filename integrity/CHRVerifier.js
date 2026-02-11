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
 * 
 * NOTE: SynchronousIntegrityChecker plugin is used to generalize the integrity validation loop.
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

    // Private helper defining how file hashing is performed using the AGI-KERNEL tool.
    _synchronousHashCalculator(filePath, algorithm) {
        // Runtime check for tool availability
        if (typeof SynchronousFileIntegrityCheckerTool === 'undefined' || typeof SynchronousFileIntegrityCheckerTool.execute !== 'function') {
             throw new Error("Dependency Error: SynchronousFileIntegrityCheckerTool is not available.");
        }
        
        try {
            return SynchronousFileIntegrityCheckerTool.execute({
                filePath: filePath,
                algorithm: algorithm
            });
        } catch (e) {
            // Ensure any error from the synchronous tool is clearly surfaced
            throw new Error(`File hashing failed using tool for path ${filePath}: ${e.message}`);
        }
    }

    async runValidation() {
        // Runtime check for plugin availability
        if (typeof SynchronousIntegrityChecker === 'undefined' || typeof SynchronousIntegrityChecker.execute !== 'function') {
             throw new Error("Refactoring Error: SynchronousIntegrityChecker plugin is not available.");
        }

        // Delegate the core validation loop to the generic plugin
        return SynchronousIntegrityChecker.execute(
            this.baseline,
            (filePath) => this._synchronousHashCalculator(filePath, this.baseline.integrity_algorithm)
        );
    }
}

module.exports = CHRVerifier;