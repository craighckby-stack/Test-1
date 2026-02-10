import { ChronoIdGenerator, ChronoId } from '../ChronoIdGenerator';
import { ulid, decodeTime } from 'ulid'; // Assumes 'ulid' package is installed

/**
 * Concrete implementation of ChronoIdGenerator utilizing the ULID (Universally Unique Lexicographically Sortable Identifier) algorithm.
 * ULIDs are 128-bit identifiers designed to be sorting-compatible with timestamps and randomness.
 */
export class UlidChronoIdGenerator implements ChronoIdGenerator {

  // Regex for standard ULID characters (Crockford Base32 excluding I, L, O, U)
  private static readonly ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

  /**
   * Generates a new ULID.
   */
  public generateId(): ChronoId {
    return ulid() as ChronoId;
  }

  /**
   * Extracts the creation timestamp (milliseconds) from the ULID.
   * Uses the standard ULID function to decode the time prefix.
   * @param chronoId The ULID string.
   * @returns The associated Unix epoch timestamp (milliseconds).
   */
  public extractTimestamp(chronoId: ChronoId): number {
    // Note: decodeTime handles the validation internally based on the ULID spec.
    return decodeTime(chronoId);
  }

  /**
   * Validates if the string is a valid ULID (26 characters, Base32 encoding).
   * This check leverages standardized validation logic defined in the CanonicalIDFormatValidator.
   */
  public isValid(value: string): value is ChronoId {
    // A basic check for ULID structure: 26 chars, alphanumeric/Base32.
    if (value.length !== 26) {
      return false;
    }
    // Regex check (standard ULID character set) using the centralized pattern.
    return UlidChronoIdGenerator.ULID_REGEX.test(value.toUpperCase()) as value is ChronoId;
  }
}