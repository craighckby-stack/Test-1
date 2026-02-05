const fs = require('fs');
const path = require('path');

// GAX III Standard Constants
const G0_HASH_LENGTH = 64; // SHA-256 standard output length (hex string)
const ARTIFACT_MANIFEST_DEFAULT_PATH = 'protocol/artifact_manifest.json';

/**
 * Governance Artifacts Registrar (GAR)
 * Enforces GAX III (Immutability) by managing and validating the G0 Seals
 * (initial hash-locks) for all critical configuration artifacts.
 * The load mechanism is designed to be synchronous and 'fail-fast' during initialization.
 */
class GovernanceArtifactsRegistrar {
  /**
   * @param {string} manifestPath Path to the sealed G0 manifest file.
   */
  constructor(manifestPath = ARTIFACT_MANIFEST_DEFAULT_PATH) {
    this.manifestPath = path.resolve(manifestPath);
    this.sealedManifest = this._loadManifest();
    
    console.log(`[GAR v94.1]: Loaded immutable manifest from ${this.manifestPath} (${Object.keys(this.sealedManifest).length} artifacts sealed).`);
  }

  /**
   * Internal synchronous loading of the SEALED artifact manifest.
   * Throws if file integrity is compromised or unreadable (fail-fast principle).
   * @returns {object} The parsed manifest data.
   * @private
   */
  _loadManifest() {
    try {
      const data = fs.readFileSync(this.manifestPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`[GAR: ERROR] Critical failure loading G0 Manifest: ${this.manifestPath}`);
      // P-M01: Manifest Integrity/Availability Failure
      throw new Error(`INTEGRITY HALT [P-M01]: Failed to load or parse manifest. Reason: ${error.message}`);
    }
  }
  
  /**
   * Writes the current manifest state back to the physical file.
   * NOTE: This operation is usually restricted to the G0 Sealing Phase only.
   * @private
   */
  _saveManifest() {
     try {
        fs.writeFileSync(this.manifestPath, JSON.stringify(this.sealedManifest, null, 2), 'utf8');
        console.log(`[GAR: PERSIST] Manifest successfully updated and persisted to ${this.manifestPath}`);
     } catch (error) {
        // P-M03: Persistence Failure
        console.error(`[GAR: ERROR] Failed to persist G0 Manifest. This state must be reviewed immediately.`);
        throw new Error(`PERSISTENCE HALT [P-M03]: Cannot write manifest: ${error.message}`);
     }
  }

  /**
   * Register a new G0 Seal hash during system sealing (G0 Phase).
   * This function updates the internal state and explicitly persists the change.
   * @param {string} artifactPath Relative path to the artifact.
   * @param {string} g0Hash The SHA-256 hash (64 hex characters).
   * @param {string} sourceUtility Utility/Subsystem that performed the sealing.
   */
  registerG0Seal(artifactPath, g0Hash, sourceUtility) {
    if (g0Hash.length !== G0_HASH_LENGTH) { 
      throw new Error(`Invalid G0 Hash length for ${artifactPath}. Expected ${G0_HASH_LENGTH}.`); 
    }
    
    // Integrity check: Prevent accidental re-sealing post-G0 phase
    if (this.sealedManifest[artifactPath]) {
        console.warn(`[GAR: WARN] Attempted to re-register existing G0 Seal for ${artifactPath}. Overriding.`);
    }

    this.sealedManifest[artifactPath] = { 
        g0_hash: g0Hash, 
        sealed_by: sourceUtility, 
        timestamp: new Date().toISOString() 
    };
    
    // Explicitly persist the change
    this._saveManifest();
  }

  /**
   * Performs active attestation against the runtime state.
   * Called by CDA during runtime checks or by PIM during GSEP-C transition.
   * @param {string} artifactPath Relative path to the artifact being attested.
   * @param {string} currentHash The calculated current hash of the artifact content.
   * @returns {boolean} True if the attestation passes.
   * @throws {Error} If the seal fails (P-M02) or if the artifact is unregistered (Integrity Halt).
   */
  attestG0Seal(artifactPath, currentHash) {
    const expected = this.sealedManifest[artifactPath];
    
    if (currentHash.length !== G0_HASH_LENGTH) { 
       throw new Error(`Invalid supplied Current Hash length for attestation of ${artifactPath}.`);
    }

    if (!expected) {
      // Unregistered critical artifact access attempt
      throw new Error(`INTEGRITY HALT: Artifact ${artifactPath} not found in G0 Seal Manifest.`);
    }
    
    const expectedHash = expected.g0_hash;

    if (currentHash !== expectedHash) {
      // P-M02: Configuration Drift Violation Trigger
      const expectedSnippet = expectedHash.substring(0, 8);
      const currentSnippet = currentHash.substring(0, 8);
      
      console.error(`[GAR: HALT] Mismatch detected: ${artifactPath}. E:${expectedSnippet}, G:${currentSnippet}`);
      
      throw new Error(`INTEGRITY HALT [P-M02]: Hash mismatch for ${artifactPath}. Expected ${expectedSnippet}... Got ${currentSnippet}...`);
    }
    
    // Attestation Success
    return true;
  }
  
  /**
   * Retrieve the sealed hash for a given artifact.
   * @param {string} artifactPath 
   * @returns {string | null} The expected hash or null if not registered.
   */
  getSealedHash(artifactPath) {
    const artifact = this.sealedManifest[artifactPath];
    return artifact ? artifact.g0_hash : null;
  }
}

module.exports = GovernanceArtifactsRegistrar;