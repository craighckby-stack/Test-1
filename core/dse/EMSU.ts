/**
 * Epoch Manifest & Sealing Utility (EMSU)
 * Core responsibility: Enforce GAX III (Policy Immutability) and manage the G0 Pre-Flight Lock.
 *
 * The EMSU generates, hashes, and cryptographically seals the Epoch Manifest (EMS) based on:
 * 1. Current ACVM configuration hash.
 * 2. PCRE policy hash set.
 * 3. Environment variables critical to DSE instantiation.
 * 4. The initial system baseline integrity (CHR).
 *
 * Failure to generate or seal the EMS results in an immediate P-M02 Critical Fault, triggering IH.
 */

import { AASS } from './AASS';
import { ConfigurationRegistry } from '../registry/ConfigurationRegistry';

// Define the interface for the injected utility based on the plugin structure
interface ManifestSealResult {
    manifestHash: string;
    ems_signature: string;
    canonicalPayload: string;
}

interface ManifestSealingUtility {
    execute: (args: { payload: object, hasherFn: (data: string) => string, signerFn: (hash: string, context: string) => Promise<string>, sealContext: string }) => Promise<ManifestSealResult>;
}


export class EMSU {
    private configRegistry: ConfigurationRegistry;
    private manifestSealingUtility: ManifestSealingUtility;

    constructor(registry: ConfigurationRegistry, manifestSealingUtility: ManifestSealingUtility) {
        this.configRegistry = registry;
        this.manifestSealingUtility = manifestSealingUtility;
    }

    /**
     * S00: Executes the Pre-Flight Lock sequence (G0).
     * @returns The Sequence Authorization Token (SAT) containing the EMS signature.
     */
    public async generateAndSealManifest(chr_checksum: string): Promise<string> {
        // 1. Load critical hash dependencies (GAX III inputs)
        const acvmHash = await this.configRegistry.getHash('config/acvm.json');
        const policyHash = await this.configRegistry.getHash('config/pcre_policies.json');
        
        // 2. Compile the Epoch Manifest payload
        const manifestPayload = {
            timestamp: new Date().toISOString(),
            dse_version: 'v94.1',
            input_checksum_baseline: chr_checksum,
            governance_hashes: { acvmHash, policyHash }
        };

        // 3. Utilize ManifestSealingUtility for canonicalization, hashing, and signing.
        // This enforces a standardized integrity flow (GAX III inputs -> Manifest -> Seal).
        
        const sealResult = await this.manifestSealingUtility.execute({
            payload: manifestPayload,
            // AASS provides the necessary cryptographic primitives
            hasherFn: AASS.generateHash, 
            signerFn: AASS.sign, 
            sealContext: 'EpochManifestSeal'
        });

        const manifestHash = sealResult.manifestHash;
        const ems_signature = sealResult.ems_signature;
        
        // 4. Construct Sequence Authorization Token (SAT)
        const SAT = `${manifestHash}:${ems_signature}`;

        // 5. Store sealed manifest for P-R03 auditing
        await this.configRegistry.storeArtifact('protocol/epoch_manifest.json', manifestPayload);

        console.log(`[EMSU] G0 Lock Success. Manifest Hash: ${manifestHash}`);
        return SAT;
    }
}