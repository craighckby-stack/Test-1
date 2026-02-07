import { AGCA_PCTM_V1_Asset, AGCA_PCTM_V1_ConfigurationData } from "../models/AGCA_Asset_Types";

export interface AGCA_Validation_Service {
  
  /**
   * Verifies the cryptographic integrity, authenticity, and authorization of an AGCA Asset.
   * Runs all validation steps (Hash, Signature, Authorization).
   * @param asset The strongly typed AGCA_PCTM_V1 configuration asset object.
   * @throws {Error} If validation fails due to tampering, unauthorized agent, or invalid signature.
   */
  validateAsset(asset: AGCA_PCTM_V1_Asset): Promise<void>;

  /**
   * Step 1: Checks if the embedded hash matches the calculated hash of the configuration_data.
   * @param dataPayload The raw configuration data object (the content being hashed).
   * @param expectedHash The hash_sha256 value from the metadata.
   */
  verifyHashIntegrity(
    dataPayload: AGCA_PCTM_V1_ConfigurationData,
    expectedHash: string
  ): Promise<boolean>;

  /**
   * Step 2: Validates the cryptographic signature against the referenced GKM key.
   * Requires secure interaction with the Global Key Management (GKM) system.
   * 
   * NOTE: The data payload is required to verify the signature calculation.
   * @param dataPayload The content that was signed (the configuration_data JSON representation).
   * @param signature The gkm_signature value.
   * @param keyReference The gkm_key_reference URI.
   */
  verifyCryptographicSignature(
    dataPayload: AGCA_PCTM_V1_ConfigurationData,
    signature: string,
    keyReference: string
  ): Promise<boolean>;

  /**
   * Step 3: Checks if the owner_agent is authorized to issue/modify this PCTM version/standard.
   * This typically requires checking an external Authorization Service (AAS).
   * @param agentId The owner_agent identifier.
   * @param standardId The pctm_standard_id (e.g., "AGCA_PCTM_V1").
   */
  verifyAgentAuthorization(agentId: string, standardId: string): Promise<boolean>;
}