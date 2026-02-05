/**
 * ICryptographicIntegrity
 * Defines the standard contract for deterministic serialization and hashing services
 * required by governance and decisional components like DSCM.
 */
export interface ICryptographicIntegrity {
    /**
     * Generates a deterministic cryptographic hash/digest for any given data structure.
     * This requires internal, canonical serialization (e.g., standard JSON stringify and sorting keys).
     * @param data The structure to hash.
     * @returns The resulting cryptographic hash string.
     */
    hash(data: unknown): string;
}