/**
 * ConfigurationAuthService.js
 * ----------------------------------------------------
 * Service responsible for securely loading sensitive governance policies (like IntegrityPolicy).
 * Ensures that configuration files are integrity-checked (e.g., hash verified or signed) against
 * a known Root-of-Trust value before they are parsed and utilized by the system.
 */

import { SystemFiles } from 'core/system/filesystem';
import { CRoTCrypto } from 'core/crypto/CRoT';
import { ContentIntegrityVerifier } from 'plugins/ContentIntegrityVerifier';

// This path defines the structure where we expect to find the checksum manifest for policies
const POLICY_MANIFEST_PATH = 'governance/config/PolicyManifest.json';

export class ConfigurationAuthService {

    static #manifestCache = null;

    // --- Synchronous Dependency Resolution Proxies ---

    static #resolveSystemFiles() { return SystemFiles; }
    static #resolveCRoTCrypto() { return CRoTCrypto; }
    static #resolveIntegrityVerifier() { return ContentIntegrityVerifier; }

    // --- Private I/O Proxies ---

    static async #readSystemFile(path) {
        return ConfigurationAuthService.#resolveSystemFiles().read(path);
    }

    static #parseJson(rawContent) {
        // Isolating potentially failing parsing operation based on external input
        return JSON.parse(rawContent);
    }

    static async #calculateHash(content, hashType) {
        return ConfigurationAuthService.#resolveCRoTCrypto().hash(content, hashType);
    }

    static #delegateToVerifierExecution(args) {
        return ConfigurationAuthService.#resolveIntegrityVerifier().execute(args);
    }

    static #logWarning(message) {
        console.warn(message);
    }

    // --- Public API (Static Methods) ---

    /**
     * Loads and validates the central Policy Manifest which dictates required integrity checks.
     */
    static async loadPolicyManifest() {
        if (ConfigurationAuthService.#manifestCache) {
            return ConfigurationAuthService.#manifestCache;
        }
        try {
            const rawManifest = await ConfigurationAuthService.#readSystemFile(POLICY_MANIFEST_PATH);
            const manifest = ConfigurationAuthService.#parseJson(rawManifest);
            ConfigurationAuthService.#manifestCache = manifest;
            // FUTURE: Add self-integrity check on the manifest itself (signed by AGI core key).
            return ConfigurationAuthService.#manifestCache;
        } catch (e) {
            throw new Error(`ConfigurationAuthService: Failed to load Policy Manifest from ${POLICY_MANIFEST_PATH}. ${(e as Error).message}`);
        }
    }

    /**
     * Securely retrieves and verifies the content of a target policy file.
     * @param {string} policyName - E.g., 'IntegrityPolicy'
     * @param {string} filePath - Absolute path to the configuration file (E.g., governance/config/IntegrityPolicy.json)
     * @returns {Promise<object>} The parsed and verified policy content.
     */
    static async getVerifiedPolicy(policyName, filePath) {
        const manifest = await ConfigurationAuthService.loadPolicyManifest();
        const requiredCheck = (manifest as any).policies?.[policyName];

        if (!requiredCheck) {
            throw new Error(`Policy 'POLICY_NOT_MANDATED': Policy ${policyName} is not listed in the PolicyManifest for verification.`);
        }

        if (requiredCheck.path !== filePath) {
             ConfigurationAuthService.#logWarning(`[ConfigAuth] Path deviation detected for ${policyName}. Expected: ${filePath}, Manifest: ${requiredCheck.path}`);
             // Note: In a hardened system, this should likely fail unless manifest is flexible.
        }

        try {
            const rawContent = await ConfigurationAuthService.#readSystemFile(filePath);
            const calculatedHash = await ConfigurationAuthService.#calculateHash(rawContent, requiredCheck.hash_type);

            // Delegate integrity verification and JSON parsing to the ContentIntegrityVerifier tool
            return ConfigurationAuthService.#delegateToVerifierExecution({
                rawContent: rawContent,
                calculatedHash: calculatedHash,
                expectedHash: requiredCheck.expected_hash,
                policyName: policyName
            });

        } catch (e) {
            // Catches SystemFiles/CRoT errors, or errors thrown by ContentIntegrityVerifier (INTEGRITY_VIOLATION/PARSING_ERROR)
            throw new Error(`Authentication Failure for Policy ${policyName} at ${filePath}. Details: ${(e as Error).message}`);
        }
    }
}

export default ConfigurationAuthService;
