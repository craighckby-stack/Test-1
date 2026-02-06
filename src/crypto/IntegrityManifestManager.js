const fs = require('fs/promises');
const IntegrityHashUtility = require('./IntegrityHashUtility');
const IntegrityManifestError = require('./IntegrityManifestError');

/**
 * IntegrityManifestManager
 * Manages the creation, loading, and comprehensive validation of system integrity manifests.
 * A manifest (e.g., integrity.json) maps file paths to their expected SHA-256 hashes.
 * 
 * NOTE: Hashing and validation operations are performed concurrently for maximum efficiency.
 */
class IntegrityManifestManager {
    
    /**
     * Generates a manifest for a list of file paths.
     * Processes files concurrently using Promise.all.
     * @param {string[]} filePaths Array of relative or absolute file paths.
     * @returns {Promise<Object<string, string>>} A map of relativePath -> hash.
     * @throws {IntegrityManifestError} If any file fails to hash.
     */
    static async generateManifest(filePaths) {
        const hashPromises = filePaths.map(async (filePath) => {
            try {
                const hash = await IntegrityHashUtility.hashFileAsync(filePath);
                return { filePath, hash };
            } catch (error) {
                // Return error object instead of throwing immediately to allow concurrency
                return { filePath, error: `Failed to hash file: ${error.message}` };
            }
        });

        const results = await Promise.all(hashPromises);
        const manifest = {};
        const errors = [];

        for (const result of results) {
            if (result.error) {
                errors.push(`${result.filePath}: ${result.error}`);
            } else {
                // Store relative paths in the manifest for portability
                manifest[result.filePath] = result.hash;
            }
        }

        if (errors.length > 0) {
            throw new IntegrityManifestError(
                `Manifest generation failed for ${errors.length} file(s).`,
                errors,
                'GENERATION'
            );
        }

        return manifest;
    }
    
    /**
     * Saves the manifest object to a JSON file.
     * @param {string} manifestPath Path where the manifest should be saved.
     * @param {Object<string, string>} manifest The manifest object.
     */
    static async saveManifest(manifestPath, manifest) {
        const jsonContent = JSON.stringify(manifest, null, 2);
        await fs.writeFile(manifestPath, jsonContent, 'utf8');
    }

    /**
     * Loads and validates a stored manifest against the current filesystem.
     * Validation is performed concurrently.
     * @param {string} manifestPath Path to the stored manifest file.
     * @returns {Promise<{valid: boolean, errors: string[]}>}
     */
    static async validateManifest(manifestPath) {
        let expectedManifest;
        
        try {
            const data = await fs.readFile(manifestPath, 'utf8');
            expectedManifest = JSON.parse(data);
        } catch (e) {
            // Use standard error object here as this is a load/parse failure, not a validation run failure.
            throw new IntegrityManifestError(
                `Failed to load or parse manifest file ${manifestPath}.`,
                [e.message],
                'LOAD'
            );
        }

        const validationPromises = Object.entries(expectedManifest).map(async ([filePath, expectedHash]) => {
            try {
                const calculatedHash = await IntegrityHashUtility.hashFileAsync(filePath);
                
                if (!IntegrityHashUtility.validateHash(calculatedHash, expectedHash)) {
                    return `Integrity mismatch for ${filePath}. Expected: ${expectedHash.substring(0, 10)}..., Got: ${calculatedHash.substring(0, 10)}...`;
                }
            } catch (e) {
                return `Validation failure (file access/hashing) for ${filePath}: ${e.message}`;
            }
            return null; // Indicates successful validation for this file
        });

        const validationResults = await Promise.all(validationPromises);
        
        const errors = validationResults.filter(result => result !== null);
        
        return { valid: errors.length === 0, errors };
    }
}

module.exports = IntegrityManifestManager;
