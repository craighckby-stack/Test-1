/**
 * IntegrityManifestKernel
 * Manages the creation, loading, and comprehensive validation of system integrity manifests.
 * A manifest (e.g., integrity.json) maps relative file paths to their expected cryptographic hashes (SHA-256 assumed).
 */
class IntegrityManifestKernel {
    
    // Dependencies
    #integrityHashKernel;
    #batchProcessorTool;
    #secureResourceLoader;
    #manifestErrorConstructor; // Reference to the IntegrityManifestError class/constructor

    /**
     * @param {object} dependencies
     * @param {IIntegrityHashKernel} dependencies.integrityHashKernel
     * @param {IBatchProcessorToolKernel} dependencies.batchProcessorTool
     * @param {SecureResourceLoaderInterfaceKernel} dependencies.secureResourceLoader
     * @param {new (...args: any[]) => IntegrityManifestError} dependencies.manifestErrorConstructor
     */
    constructor(dependencies = {}) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Private method to enforce synchronous setup extraction mandate.
     * @param {object} dependencies 
     */
    #setupDependencies(dependencies) {
        const { 
            integrityHashKernel, 
            batchProcessorTool, 
            secureResourceLoader, 
            manifestErrorConstructor 
        } = dependencies;

        if (!integrityHashKernel || typeof integrityHashKernel.hashFileAsync !== 'function') {
            throw new Error(`${this.constructor.name}: Missing or invalid integrityHashKernel dependency.`);
        }
        if (!batchProcessorTool || typeof batchProcessorTool.execute !== 'function') {
            throw new Error(`${this.constructor.name}: Missing or invalid batchProcessorTool dependency.`);
        }
        if (!secureResourceLoader || typeof secureResourceLoader.loadJson !== 'function' || typeof secureResourceLoader.saveJson !== 'function') {
            throw new Error(`${this.constructor.name}: Missing or invalid secureResourceLoader dependency.`);
        }
        if (!manifestErrorConstructor || typeof manifestErrorConstructor !== 'function') {
             throw new Error(`${this.constructor.name}: Missing or invalid manifestErrorConstructor dependency.`);
        }
        
        this.#integrityHashKernel = integrityHashKernel;
        this.#batchProcessorTool = batchProcessorTool;
        this.#secureResourceLoader = secureResourceLoader;
        this.#manifestErrorConstructor = manifestErrorConstructor;
    }

    async initialize() {
        // Standard kernel initialization hook
    }

    /**
     * Generates a manifest for a list of file paths.
     *
     * @param {string[]} filePaths Array of relative file paths.
     * @returns {Promise<Record<string, string>>} A map of relativePath -> hash.
     * @throws {this.#manifestErrorConstructor} If any file fails to hash.
     */
    async generateManifest(filePaths) {
        
        const workerFn = async (filePath) => {
            // Use injected IntegrityHashKernel (previously IntegrityHashUtility)
            const hash = await this.#integrityHashKernel.hashFileAsync(filePath);
            return hash;
        };

        // Use injected BatchProcessorTool (previously AsyncBatchProcessor)
        const { successes, failures } = await this.#batchProcessorTool.execute(filePaths, workerFn);
        
        const manifest = {};
        
        successes.forEach(s => {
            manifest[s.item] = s.result; 
        });

        if (failures.length > 0) {
            const errors = failures.map(f => 
                `${f.item}: Failed to hash file: ${f.error.message || f.error}`
            );

            // Use injected error constructor
            throw new this.#manifestErrorConstructor(
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
    async saveManifest(manifestPath, manifest) {
        // Use injected SecureResourceLoaderInterfaceKernel (previously FileUtility)
        await this.#secureResourceLoader.saveJson(manifestPath, manifest);
    }

    /**
     * Loads and validates a stored manifest against the current filesystem.
     * Validation is performed concurrently.
     * 
     * @param {string} manifestPath Path to the stored manifest file.
     * @returns {Promise<{valid: boolean, errors: string[]}>} Detailed validation result.
     * @throws {this.#manifestErrorConstructor} If the manifest file cannot be loaded or parsed.
     */
    async validateManifest(manifestPath) {
        let expectedManifest;
        
        try {
            // Use injected SecureResourceLoaderInterfaceKernel
            expectedManifest = await this.#secureResourceLoader.loadJson(manifestPath);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            // Use injected error constructor
            throw new this.#manifestErrorConstructor(
                `Failed to load or parse manifest file ${manifestPath}.`,
                [error],
                'LOAD'
            );
        }

        const fileEntries = Object.entries(expectedManifest);

        const workerFn = async ([filePath, expectedHash]) => {
            // Use injected IntegrityHashKernel
            const calculatedHash = await this.#integrityHashKernel.hashFileAsync(filePath);
            
            if (calculatedHash !== expectedHash) {
                const truncatedExpected = expectedHash.substring(0, 10);
                const truncatedCalculated = calculatedHash.substring(0, 10);
                
                throw new Error(`Integrity mismatch. Expected: ${truncatedExpected}..., Got: ${truncatedCalculated}...`);
            }
            return true;
        };

        // Use injected BatchProcessorTool
        const { failures } = await this.#batchProcessorTool.execute(fileEntries, workerFn);
        
        const errors = failures.map(f => {
            const [filePath] = f.item; 
            
            if (f.error.message.startsWith('Integrity mismatch')) {
                 return `Integrity mismatch for ${filePath}. ${f.error.message}`;
            }
            
            return `Validation failure (file access/hashing) for ${filePath}: ${f.error.message}`;
        });
        
        return { valid: errors.length === 0, errors };
    }
}

module.exports = IntegrityManifestKernel;