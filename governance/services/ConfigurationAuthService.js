import { SystemFiles } from 'core/system/filesystem';
import { CRoTCrypto } from 'core/crypto/CRoT';
import { ContentIntegrityVerifier } from 'plugins/ContentIntegrityVerifier';

const POLICY_MANIFEST_PATH = 'governance/config/PolicyManifest.json';

/**
 * Service responsible for securely loading sensitive governance policies.
 * Ensures that configuration files are integrity-checked against a known
 * Root-of-Trust value before they are parsed and utilized by the system.
 */
export class ConfigurationAuthService {
    static #manifestCache = null;
    static #systemFiles = null;
    static #cryptoService = null;
    static #integrityVerifier = null;

    static #getSystemFiles() {
        return ConfigurationAuthService.#systemFiles ??= SystemFiles;
    }

    static #getCryptoService() {
        return ConfigurationAuthService.#cryptoService ??= CRoTCrypto;
    }

    static #getIntegrityVerifier() {
        return ConfigurationAuthService.#integrityVerifier ??= ContentIntegrityVerifier;
    }

    static async #readFile(path) {
        return ConfigurationAuthService.#getSystemFiles().read(path);
    }

    static #parseJson(rawContent) {
        return JSON.parse(rawContent);
    }

    static async #calculateHash(content, hashType) {
        return ConfigurationAuthService.#getCryptoService().hash(content, hashType);
    }

    /**
     * Loads and validates the central Policy Manifest which dictates required integrity checks.
     * @returns {Promise<object>} The parsed policy manifest.
     */
    static async loadPolicyManifest() {
        if (ConfigurationAuthService.#manifestCache) {
            return ConfigurationAuthService.#manifestCache;
        }

        try {
            const rawManifest = await ConfigurationAuthService.#readFile(POLICY_MANIFEST_PATH);
            ConfigurationAuthService.#manifestCache = ConfigurationAuthService.#parseJson(rawManifest);
            return ConfigurationAuthService.#manifestCache;
        } catch (error) {
            throw new Error(`Failed to load Policy Manifest from ${POLICY_MANIFEST_PATH}: ${error.message}`);
        }
    }

    /**
     * Securely retrieves and verifies the content of a target policy file.
     * @param {string} policyName - The name of the policy (e.g., 'IntegrityPolicy').
     * @param {string} filePath - Absolute path to the configuration file.
     * @returns {Promise<object>} The parsed and verified policy content.
     */
    static async getVerifiedPolicy(policyName, filePath) {
        const manifest = await ConfigurationAuthService.loadPolicyManifest();
        const policyCheck = manifest.policies?.[policyName];

        if (!policyCheck) {
            throw new Error(`Policy '${policyName}' is not listed in the PolicyManifest for verification.`);
        }

        if (policyCheck.path !== filePath) {
            console.warn(`[ConfigAuth] Path deviation detected for ${policyName}. Expected: ${filePath}, Manifest: ${policyCheck.path}`);
        }

        try {
            const rawContent = await ConfigurationAuthService.#readFile(filePath);
            const calculatedHash = await ConfigurationAuthService.#calculateHash(rawContent, policyCheck.hash_type);

            return ConfigurationAuthService.#getIntegrityVerifier().execute({
                rawContent,
                calculatedHash,
                expectedHash: policyCheck.expected_hash,
                policyName
            });
        } catch (error) {
            throw new Error(`Authentication Failure for Policy ${policyName} at ${filePath}: ${error.message}`);
        }
    }
}

export default ConfigurationAuthService;
