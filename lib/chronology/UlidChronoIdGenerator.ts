import { ulid } from 'ulid';
import { ChronoId, ChronoIdGenerator } from "./ChronoIdGenerator";

// Declare the external plugin interface for compile-time TypeScript compatibility
declare const UlidChronoUtility: {
    execute: (args: { action: 'validate' | 'decodeTime', value: string }) => number | boolean | null;
};

/**
 * A concrete implementation of ChronoIdGenerator utilizing the ULID specification.
 * 
 * ULIDs are lexicographically sortable, highly random, and use URL-safe Crockford Base32 encoding.
 * 
 * Note: Validation and Time Decoding are delegated to the standardized UlidChronoUtility plugin.
 */
export class UlidChronoIdGenerator implements ChronoIdGenerator {

    /**
     * Generates a new ULID string using the 'ulid' library for secure randomness.
     */
    public generateId(): ChronoId {
        return ulid() as ChronoId;
    }

    /**
     * Extracts the timestamp from a ULID by decoding the first 48 bits via the utility plugin.
     * @param chronoId The ULID string.
     * @returns The associated Unix epoch timestamp (milliseconds).
     */
    public extractTimestamp(chronoId: ChronoId): number {
        const timestamp = UlidChronoUtility.execute({ action: 'decodeTime', value: chronoId });
        // The plugin returns the number directly (or NaN if invalid).
        return timestamp as number;
    }

    /**
     * Validates the input string against ULID structure and length using the canonical utility plugin.
     * @param value The string to validate.
     * @returns True if the string looks like a valid ULID.
     */
    public isValid(value: string): value is ChronoId {
        const result = UlidChronoUtility.execute({ action: 'validate', value: value });
        return result === true;
    }
}