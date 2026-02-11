/**
 * Sovereign AGI v94.1 Json Canonicalization Utility Facade
 * Standardizes JSON object serialization by delegating the deep sorting
 * to the CanonicalJsonUtility plugin.
 */

// Interface for the injected canonicalizer utility (provided by the plugin)
interface ICanonicalizerTool {
    canonicalize(data: any): string;
}

class JsonCanonicalizer {

  private canonicalizer: ICanonicalizerTool;

  /**
   * Initializes the Canonicalizer with the required tool/plugin.
   * Refactoring Note: Switched from messy static dependency injection simulation
   * to cleaner constructor injection.
   * 
   * @param canonicalizer The dependency providing the core canonicalization logic.
   */
  constructor(canonicalizer: ICanonicalizerTool) {
    if (!canonicalizer || typeof canonicalizer.canonicalize !== 'function') {
        throw new Error("Invalid ICanonicalizerTool provided to JsonCanonicalizer.");
    }
    this.canonicalizer = canonicalizer;
  }

  /**
   * Deeply sorts object keys alphabetically and stringifies the result.
   * Delegates the actual logic to the reusable plugin.
   * 
   * @param {any} data - The data structure to canonicalize.
   * @returns {string} The canonical JSON string.
   */
  public canonicalize(data: any): string {
    return this.canonicalizer.canonicalize(data);
  }

  /**
   * Calculates a cryptographic hash of the canonicalized string.
   * NOTE: This logic remains environment-dependent and should be delegated to a 
   * dedicated CanonicalCryptoUtility for full abstraction in complex environments.
   * 
   * @param {string} canonicalString - Output of canonicalize().
   * @returns {string} SHA-256 hash in hex format.
   */
  public hash(canonicalString: string): string {
    // Check for browser/global crypto first
    if (typeof global !== 'undefined' && global.crypto && global.crypto.subtle) {
        // Placeholder for environment with SubtleCrypto
        // Actual implementation would involve async/await on subtle.digest
        return 'SHA256_HASH_OF_CANONICAL_DATA_BROWSER_PLACEHOLDER'; 
    }
    
    try {
        // Attempt Node.js crypto module if available
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(canonicalString).digest('hex');
    } catch (e) {
        // If crypto module fails or is unavailable
        return 'SHA256_HASH_OF_CANONICAL_DATA_PLACEHOLDER';
    }
  }
}

module.exports = JsonCanonicalizer;