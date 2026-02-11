import { ChronoIdGenerator, ChronoId } from '../ChronoIdGenerator';
import { ulid, decodeTime } from 'ulid';
import { UlidFormatValidator } from '../../utils/UlidFormatValidator'; // Abstracted utility for format validation

/**
 * Concrete implementation of ChronoIdGenerator utilizing the ULID (Universally Unique Lexicographically Sortable Identifier) algorithm.
 * ULIDs are 128-bit identifiers designed to be sorting-compatible with timestamps and randomness.
 */
export class UlidChronoIdGenerator implements ChronoIdGenerator {

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
   * This check leverages the abstracted UlidFormatValidator utility.
   */
  public isValid(value: string): value is ChronoId {
    return UlidFormatValidator.isValid(value) as value is ChronoId;
  }
}