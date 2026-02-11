/**
 * Abstract interface for fetching schema data from external sources.
 * This decouples the resolution logic (caching, immutability) from the I/O mechanism.
 */
interface ISchemaFetcher {
    /**
     * Fetches a schema definition based on its unique identifier.
     * @param schemaId The unique identifier (URI, path, etc.).
     * @returns A Promise resolving to the raw schema object.
     */
    fetch(schemaId: string): Promise<any>;
}

/**
 * Efficient service for resolving schemas, utilizing caching and promoting immutability.
 */
export class SchemaResolverService {
    // O(1) Cache Map for resolved schemas
    private readonly schemaCache = new Map<string, Readonly<any>>();
    
    // Dependency Injection of the abstracted I/O mechanism
    constructor(private readonly fetcher: ISchemaFetcher) {}

    /**
     * Resolves and retrieves an immutable schema, prioritizing the cache.
     * Computational Efficiency: O(1) if cached; O(Fetch Time) otherwise.
     *
     * @param schemaId The unique ID/URI of the schema to resolve.
     * @returns A promise resolving to the immutable schema object.
     */
    public async resolveSchema(schemaId: string): Promise<Readonly<any>> {
        // 1. Cache Hit Check (O(1))
        if (this.schemaCache.has(schemaId)) {
            return this.schemaCache.get(schemaId)!;
        }

        // 2. Fetch (Asynchronous I/O via abstracted dependency)
        try {
            const rawSchema = await this.fetcher.fetch(schemaId);

            // 3. Enforce Immutability (Prevents runtime state corruption)
            // NOTE: Object.freeze is shallow; deep freezing would require a utility.
            const immutableSchema = Object.freeze(rawSchema);
            
            // 4. Cache Miss Update (O(1))
            this.schemaCache.set(schemaId, immutableSchema);
            
            return immutableSchema;
        } catch (error) {
            console.error(`[SchemaResolver] Fatal error resolving schema ${schemaId}:`, error);
            // Throw a standardized error type for robust downstream handling
            throw new SchemaResolutionError(`Failed to resolve schema ID: ${schemaId}`);
        }
    }

    /**
     * Clears a specific schema from the cache, forcing a re-fetch.
     * O(1) removal efficiency.
     */
    public invalidate(schemaId: string): boolean {
        return this.schemaCache.delete(schemaId);
    }

    /**
     * Clears the entire cache. Optimized for high-throughput environment resets.
     */
    public clearCache(): void {
        this.schemaCache.clear();
    }
}

// Placeholder error type for abstraction
class SchemaResolutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SchemaResolutionError';
    }
}