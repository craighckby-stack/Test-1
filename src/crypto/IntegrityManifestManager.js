const path = require('path');
const fs = require('fs/promises');
const IntegrityHashUtility = require('./IntegrityHashUtility');

/**
 * IntegrityManifestManager
 * Manages the creation, loading, and comprehensive validation of system integrity manifests.
 * A manifest (e.g., integrity.json) maps file paths to their expected SHA-256 hashes.
 */
class IntegrityManifestManager {
    
    /**
     * Generates a manifest for a list of file paths.
     * @param {string[]} filePaths Array of relative or absolute file paths.
     * @returns {Promise<Object<string, string>>} A map of relativePath -> hash.
     */
    static async generateManifest(filePaths) {
        const manifest = {};
        for (const filePath of filePaths) {
            try {
                // Use async hashing for efficient operation
                const hash = await IntegrityHashUtility.hashFileAsync(filePath);
                // Store relative paths in the manifest for portability
                manifest[filePath] = hash;
            } catch (error) {
                // Decide whether to fail fast or log and continue. We fail fast here.
                throw new Error(`Failed to generate manifest entry for ${filePath}: ${error.message}`);
            }
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
     * @param {string} manifestPath Path to the stored manifest file.
     * @returns {Promise<{valid: boolean, errors: string[]}>}
     */
    static async validateManifest(manifestPath) {
        const errors = [];
        let expectedManifest;
        
        try {
            const data = await fs.readFile(manifestPath, 'utf8');
            expectedManifest = JSON.parse(data);
        } catch (e) {
            return { valid: false, errors: [`Failed to load or parse manifest file ${manifestPath}: ${e.message}`] };
        }

        for (const [filePath, expectedHash] of Object.entries(expectedManifest)) {
            try {
                const calculatedHash = await IntegrityHashUtility.hashFileAsync(filePath);
                
                if (!IntegrityHashUtility.validateHash(calculatedHash, expectedHash)) {
                    errors.push(`Integrity mismatch for ${filePath}. Expected: ${expectedHash}, Got: ${calculatedHash}`);
                }
            } catch (e) {
                errors.push(`Validation failure (file access/hashing) for ${filePath}: ${e.message}`);
            }
        }
        
        return { valid: errors.length === 0, errors };
    }
}

module.exports = IntegrityManifestManager;
