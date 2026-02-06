/**
 * CIL_BlockQuery_Interface (CIL-BQI)
 * Version: V1.1
 * Responsible Subsystems: GSEP, AICV
 * Description: Defines the high-speed interface for retrieving cryptographically certified constraint blocks from the CIL.
 */

interface CIL_BlockMetadata {
  Block_N: number;
  Root_Content_Hash: string; // SHA3-512
  Timestamp_UTC_NANO: string;
  Event_Trigger: 'SCHEMA_EVOLUTION' | 'THRESHOLD_TUNING' | 'CALCULUS_AMENDMENT' | 'STATE_TRANSITION';
  AIA_Epoch_Ref: string;
}

interface CertifiedCILBlock extends CIL_BlockMetadata {
  // The actual verifiable content payload (schemas, thresholds, formulae)
  contentPayload: Record<string, any>; 
  
  // Proofs required for L3/L4 validation
  AICV_Cert_Chain: string; 
  SCR_Snapshot_Merkle: string;
}

interface CIL_BlockQuery_Interface {

  /**
   * Retrieves a certified block based on the specific governance event ID (non-repudiation key).
   * @param commitmentId The UUIDv4 of the event.
   * @returns CertifiedCILBlock
   * @throws NotFoundError | IntegrityValidationError
   */
  queryByCommitmentID(commitmentId: string): Promise<CertifiedCILBlock>;

  /**
   * Retrieves the latest constraint block relevant to a specific AIA Epoch.
   * @param aiaEpochRef The reference ID to the AIA index.
   * @returns CertifiedCILBlock
   * @throws NotFoundError
   */
  queryLatestByAIA(aiaEpochRef: string): Promise<CertifiedCILBlock>;

  /**
   * Verifies the authenticity and non-repudiation of a local constraint hash against the ledger.
   * @param rootHash Local SHA3-512 hash of constraints used.
   * @param blockNumber The expected ledger index.
   * @returns CIL_BlockMetadata
   * @throws MismatchError | BlockIntegrityViolation
   */
  verifyHashAnchor(rootHash: string, blockNumber: number): Promise<CIL_BlockMetadata>;
}
