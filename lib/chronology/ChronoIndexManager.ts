export interface CHR_Record {
  chr_id: string;
  parent_chr_id: string | null;
  timestamp: string;
  entity_type: string;
  data_payload: any;
  metadata: any;
}

/**
 * Manages the efficient storage, retrieval, and querying of Chronology Records (CHR).
 * It handles abstraction over the underlying persistent storage layer (e.g., time-series database).
 */
export interface ChronoIndexManager {
  /**
   * Persists a new CHR record.
   * @param record The CHR object conforming to the protocol/chr_schema.json.
   */
  write(record: CHR_Record): Promise<void>;

  /**
   * Retrieves a record by its unique ID.
   */
  getById(chr_id: string): Promise<CHR_Record | null>;

  /**
   * Retrieves all immediate descendants (children) of a specific record, following the causal chain.
   */
  getChildren(parent_chr_id: string): Promise<CHR_Record[]>;

  /**
   * Queries the historical chain based on criteria (e.g., entity_type, time range).
   */
  queryHistory(criteria: {
    startTime?: string;
    endTime?: string;
    entityType?: string;
    category?: string;
  }): Promise<CHR_Record[]>;
}

// NOTE: This interface abstracts database logic required to maximize performance using chr_id and parent_chr_id indexing.