/**
 * Utility module responsible for generating time-sortable, globally unique identifiers
 * optimized for use as primary keys (chr_id) in Chronology indices.
 * Using time-sortable IDs (like ULID, KSUID, or Timeflake) ensures optimal performance
 * for time-series databases and chronological retrieval.
 */
export interface ChronoIdGenerator {
  /**
   * Generates a new, chronologically-ordered unique ID.
   * @returns A unique identifier string.
   */
  generateId(): string;

  /**
   * Extracts the creation timestamp from a generated ID.
   * @param chr_id The Chronology ID.
   * @returns The associated Unix epoch timestamp (milliseconds).
   */
  extractTimestamp(chr_id: string): number;
}

// Placeholder implementation recommendation:
// import { UlidGenerator } from './implementations/UlidGenerator';
// export const ChronoIdGenerator: ChronoIdGenerator = new UlidGenerator();
