/**
 * ConfigurationAuthService.js
 * ----------------------------------------------------
 * Service responsible for securely loading sensitive governance policies (like IntegrityPolicy).
 * Ensures that configuration files are integrity-checked (e.g., hash verified or signed) against
 * a known Root-of-Trust value before they are parsed and utilized by the system.
 */

import { SystemFiles } from 'core/system/filesystem';
import { CRoTCrypto } from 'core/crypto/CRoT';
// import { ContentIntegrityVerifier } from 'governance/tools/ContentIntegrityVerifier'; // Implicit Tool Import

// This path defines the structure where we expect to find the checksum manifest for policies
const POLICY_MANIFEST_PATH = 'governance/config/PolicyManifest.json';

// Placeholder for the external tool reference defined in the plugin block
declare const ContentIntegrityVerifier: {
    execute: (args: { rawContent: string, calculatedHash: string, expectedHash: string, policyName: string }) => object;
};

export class ConfigurationAuthService {
    
    static _manifestCache: object | null = null;

    /**
     * Loads and validates the central Policy Manifest which dictates required integrity checks.
     */
    static async loadPolicyManifest(): Promise<object> {
        if (ConfigurationAuthService._manifestCache) {
            return ConfigurationAuthService._manifestCache;
        }
        try {
            const rawManifest = await SystemFiles.read(POLICY_MANIFEST_PATH);
            ConfigurationAuthService._manifestCache = JSON.parse(rawManifest);
            // FUTURE: Add self-integrity check on the manifest itself (signed by AGI core key).
            return ConfigurationAuthService._manifestCache;
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
    static async getVerifiedPolicy(policyName: string, filePath: string): Promise<object> {
        const manifest = await ConfigurationAuthService.loadPolicyManifest();
        const requiredCheck = (manifest as any).policies?.[policyName];

        if (!requiredCheck) {
            throw new Error(`Policy 'POLICY_NOT_MANDATED': Policy ${policyName} is not listed in the PolicyManifest for verification.`);
        }

        if (requiredCheck.path !== filePath) {
             console.warn(`[ConfigAuth] Path deviation detected for ${policyName}. Expected: ${filePath}, Manifest: ${requiredCheck.path}`);
             // Note: In a hardened system, this should likely fail unless manifest is flexible.
        }

        try {
            const rawContent = await SystemFiles.read(filePath);
            const calculatedHash = await CRoTCrypto.hash(rawContent, requiredCheck.hash_type);
            
            // Delegate integrity verification and JSON parsing to the ContentIntegrityVerifier tool
            return ContentIntegrityVerifier.execute({
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