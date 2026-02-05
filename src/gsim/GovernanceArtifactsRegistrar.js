/**
 * Governance Artifacts Registrar (GAR)
 * Enforces GAX III (Immutability) by managing and validating the G0 Seals
 * (initial hash-locks) for all critical configuration artifacts.
 */
class GovernanceArtifactsRegistrar {
  constructor(manifestPath = 'protocol/artifact_manifest.json') {
    this.manifestPath = manifestPath;
    this.sealedManifest = this.loadManifest(manifestPath);
  }

  loadManifest(path) {
    // Implementation must synchronously load the SEALED artifact manifest
    // and fail fast if file integrity is compromised or unreadable.
    // Placeholder: Return a pre-parsed manifest object.
    console.log(`GAR: Loading immutable artifact manifest from ${path}`);
    return require(path);
  }

  /**
   * Register a new G0 Seal hash during system sealing (G0 Phase).
   * This function updates the internal state/manifest file if authorized.
   */
  registerG0Seal(artifactPath, g0Hash, sourceUtility) {
    if (g0Hash.length !== 64) { throw new Error("Invalid G0 Hash length."); }
    this.sealedManifest[artifactPath] = { g0_hash: g0Hash, sealed_by: sourceUtility, timestamp: Date.now() };
    // Persistence mechanism would write this change back to the physical manifest file
  }

  /**
   * Performs active attestation against the runtime state.
   * Called by CDA during runtime checks or by PIM during GSEP-C transition.
   */
  attestG0Seal(artifactPath, currentHash) {
    const expected = this.sealedManifest[artifactPath];
    if (!expected) {
      throw new Error(`Integrity Halt: Artifact ${artifactPath} not found in G0 Seal Manifest.`);
    }
    if (currentHash !== expected.g0_hash) {
      // P-M02: Configuration Drift Violation Trigger
      throw new Error(`INTEGRITY HALT [P-M02]: Hash mismatch for ${artifactPath}. Expected ${expected.g0_hash.substring(0, 8)}, Got ${currentHash.substring(0, 8)}`);
    }
    return true;
  }
}

module.exports = GovernanceArtifactsRegistrar;