/**
 * Manages configuration schemas, utilizing the AsyncResourceCacheManager for 
 * optimized caching, load barriers, and parallelized promise handling.
 */
class SchemaConfigRegistry {
    /**
     * @param {AsyncResourceCacheManager} cacheManager - Instance of the centralized cache manager (emergent plugin).
     * @param {function(string): Promise<object>} schemaLoaderFn - Function responsible for fetching raw schemas from source.
     */
    constructor(cacheManager, schemaLoaderFn) {
        if (!cacheManager || !schemaLoaderFn) {
            throw new Error('SchemaConfigRegistry requires a cacheManager and a schemaLoaderFn.');
        }
        this.cacheManager = cacheManager;
        this.schemaLoaderFn = schemaLoaderFn;
    }

    /**
     * Retrieves a configuration schema by key. 
     * Automatically handles caching and prevents concurrent loading for the same key.
     * @param {string} schemaKey - The identifier for the schema.
     * @returns {Promise<object>} The configuration schema.
     */
    async getSchema(schemaKey) {
        // Use a unique prefix to namespace resources if cacheManager is shared
        const uniqueKey = `schema:${schemaKey}`;
        
        // Define the specific loader function for this key
        const loader = () => this.schemaLoaderFn(schemaKey);

        // Delegate caching and concurrency management to the plugin
        return this.cacheManager.getResource(uniqueKey, loader);
    }

    /**
     * Invalidates a specific cached schema, forcing a reload on the next access.
     * @param {string} schemaKey
     */
    invalidateSchema(schemaKey) {
        this.cacheManager.invalidate(`schema:${schemaKey}`);
    }

    /**
     * Clears the entire schema registry cache.
     */
    clearCache() {
        // Note: If the cacheManager is shared globally, this will clear all resources.
        // A more complex solution would be required to only clear namespaced keys.
        this.cacheManager.clear();
    }
}