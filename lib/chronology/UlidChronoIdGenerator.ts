import { ulid } from 'ulid';
import { ChronoId, ChronoIdGenerator } from "./ChronoIdGenerator";

// Declare the external plugin interface for compile-time TypeScript compatibility
declare const UlidChronoUtility: {
    execute: (args: { action: 'validate' | 'decodeTime', value: string }) => number | boolean | null;
};

/**
 * A concrete implementation of ChronoIdGenerator utilizing the ULID specification.
 * 
 * ULIDs are ideal because they are lexicographically sortable, highly random 
 * in the latter half, and use the URL-safe Crockford Base32 encoding.
 * 
 * Note: Validation and Time Decoding are delegated to the UlidChronoUtility plugin
 * for canonical enforcement and standardization.
 */
export class UlidChronoIdGenerator implements ChronoIdGenerator {

    /**
     * Generates a new ULID string.
     */
    public generateId(): ChronoId {
        // Generation relies on the robust external 'ulid' library for secure randomness.
        return ulid() as ChronoId;
    }

    /**
     * Extracts the timestamp from a ULID by decoding the first 48 bits.
     * @param chronoId The ULID string.
     * @returns The associated Unix epoch timestamp (milliseconds).
     */
    public extractTimestamp(chronoId: ChronoId): number {
        const timestamp = UlidChronoUtility.execute({ action: 'decodeTime', value: chronoId });
        // The plugin returns the number directly (or NaN if invalid), cast needed for typing.
        return timestamp as number;
    }

    /**
     * Validates the input string against ULID structure and length using the canonical utility.
     * @param value The string to validate.
     * @returns True if the string looks like a valid ULID.
     */
    public isValid(value: string): value is ChronoId {
        const result = UlidChronoUtility.execute({ action: 'validate', value: value });
        return result === true;
    }
}