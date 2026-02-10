const fs = require('fs/promises');
const IntegrityHashUtility = require('./IntegrityHashUtility');
const IntegrityManifestError = require('./IntegrityManifestError');

// Assuming AsyncBatchProcessor is available (extracted plugin)
declare const AsyncBatchProcessor: {
    execute: (
        items: any[], 
        workerFn: (item: any) => Promise<any>
    ) => Promise<{
        successes: Array<{ item: any, result: any }>, 
        failures: Array<{ item: any, error: Error }>
    }>
};

/**
 * IntegrityManifestManager
 * Manages the creation, loading, and comprehensive validation of system integrity manifests.
 * A manifest (e.g., integrity.json) maps relative file paths to their expected cryptographic hashes (SHA-256 assumed).
 * 
 * NOTE: Hashing and validation operations are performed concurrently for maximum efficiency using AsyncBatchProcessor.
 */
class IntegrityManifestManager {
    
    /**
     * Generates a manifest for a list of file paths.
     * All provided paths should be relative to a known root if the manifest is intended for portability.
     * Processes files concurrently using AsyncBatchProcessor.
     * 
     * @param {string[]} filePaths Array of relative file paths.
     * @returns {Promise<Record<string, string>>} A map of relativePath -> hash.
     * @throws {IntegrityManifestError} If any file fails to hash.
     */
    static async generateManifest(filePaths) {
        
        const workerFn = async (filePath) => {
            // Assuming IntegrityHashUtility handles file reading robustly and throws on error
            const hash = await IntegrityHashUtility.hashFileAsync(filePath);
            return hash;
        };

        // Use the extracted plugin for concurrent processing and result aggregation
        const { successes, failures } = await AsyncBatchProcessor.execute(filePaths, workerFn);
        
        const manifest = {};
        
        successes.forEach(s => {
            // s.item is filePath, s.result is hash
            manifest[s.item] = s.result; 
        });

        if (failures.length > 0) {
            const errors = failures.map(f => 
                // f.item is the filePath, f.error is the captured exception
                `${f.item}: Failed to hash file: ${f.error.message || f.error}`
            );

            throw new IntegrityManifestError(
                `Manifest generation failed for ${failures.length} file(s).`,
                errors,
                'GENERATION'
            );
        }

        return manifest;
    }
    
    /**
     * Saves the manifest object to a JSON file.
     * @param {string} manifestPath Path where the manifest should be saved.
     * @param {Record<string, string>} manifest The manifest object (relativePath -> hash).
     */
    static async saveManifest(manifestPath, manifest) {
        const jsonContent = JSON.stringify(manifest, null, 2);
        await fs.writeFile(manifestPath, jsonContent, 'utf8');
    }

    /**
     * Loads and validates a stored manifest against the current filesystem.
     * Validation is performed concurrently.
     * 
     * @param {string} manifestPath Path to the stored manifest file.
     * @returns {Promise<{valid: boolean, errors: string[]}>} Detailed validation result.
     * @throws {IntegrityManifestError} If the manifest file cannot be loaded or parsed.
     */
    static async validateManifest(manifestPath) {
        let expectedManifest;
        
        try {
            const data = await fs.readFile(manifestPath, 'utf8');
            // Manifest structure is { filePath: hashString }
            expectedManifest = JSON.parse(data);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            throw new IntegrityManifestError(
                `Failed to load or parse manifest file ${manifestPath}.`,
                [error],
                'LOAD'
            );
        }

        const fileEntries = Object.entries(expectedManifest);

        const workerFn = async ([filePath, expectedHash]) => {
            // 1. Calculate hash of the existing file (will throw on file access/read errors)
            const calculatedHash = await IntegrityHashUtility.hashFileAsync(filePath);
            
            // 2. Direct string comparison
            if (calculatedHash !== expectedHash) {
                // Provide truncated hashes for concise error logs
                const truncatedExpected = expectedHash.substring(0, 10);
                const truncatedCalculated = calculatedHash.substring(0, 10);
                
                // Throwing an Error here is how AsyncBatchProcessor captures it as a failure
                throw new Error(`Integrity mismatch. Expected: ${truncatedExpected}..., Got: ${truncatedCalculated}...`);
            }
            return true; // Success
        };

        const { failures } = await AsyncBatchProcessor.execute(fileEntries, workerFn);
        
        const errors = failures.map(f => {
            const [filePath] = f.item; // f.item is the input tuple [filePath, expectedHash]
            
            // Handle both hashing errors and custom mismatch errors
            if (f.error.message.startsWith('Integrity mismatch')) {
                 return `Integrity mismatch for ${filePath}. ${f.error.message}`;
            }
            
            // Handle file access/read errors caught by hashFileAsync
            return `Validation failure (file access/hashing) for ${filePath}: ${f.error.message}`;
        });
        
        return { valid: errors.length === 0, errors };
    }
}

module.exports = IntegrityManifestManager;