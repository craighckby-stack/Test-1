/**
 * GSIM Map Resolver v1.0
 * Handles integrity verification and dependency pre-loading for GSIM Enforcement Maps.
 */

import { GsimEnforcementMap, EnforcementRule } from '../types/gsim_types';

/**
 * Define the interface for the extracted tools.
 */
interface IPayloadIntegrityVerifier {
    verify(args: { payload: any, expectedChecksum: string }): Promise<{ isValid: boolean, calculatedChecksum: string | null }>;
}

/**
 * New interface for Dependency Resolution.
 * Abstracts the logic for fetching schemas, configs, and key references.
 */
interface IDependencyResolver {
    resolveDependencies(dependencies: EnforcementRule['dependencies']): Promise<void>;
}


interface GSIMResolverTools {
    payloadIntegrityVerifier: IPayloadIntegrityVerifier;
    dependencyResolver: IDependencyResolver;
}

export class GSIMMapResolver {
    private integrityVerifier: IPayloadIntegrityVerifier;
    private dependencyResolver: IDependencyResolver;

    constructor(tools: GSIMResolverTools) {
        this.integrityVerifier = tools.payloadIntegrityVerifier;
        this.dependencyResolver = tools.dependencyResolver;
    }

    /**
     * 1. Validates the integrity of the map data against the declared checksum (using tool).
     * 2. Pre-resolves and caches required external dependencies based on type.
     * @param mapData The parsed GSIM enforcement map.
     */
    public async resolve(mapData: GsimEnforcementMap): Promise<EnforcementRule[]> {
        console.log(`[GSIM] Attempting resolution for map ID: ${mapData.map_id}`);

        // 1. Integrity Verification (Now using the abstracted tool)
        const verificationResult = await this.integrityVerifier.verify({
            payload: mapData.enforcement_map,
            expectedChecksum: mapData.metadata.checksum
        });

        if (!verificationResult.isValid) {
            const calculated = verificationResult.calculatedChecksum || 'N/A';
            throw new Error(`Integrity Check Failed for ${mapData.map_id}. Hash mismatch. Expected: ${mapData.metadata.checksum}, Calculated: ${calculated}.`);
        }

        // 2. Dependency Resolution Loop (Delegated to plugin)
        for (const rule of mapData.enforcement_map) {
            if (rule.dependencies) {
                await this.dependencyResolver.resolveDependencies(rule.dependencies);
            }
        }

        console.log(`[GSIM] Map ${mapData.map_id} resolved successfully.`);
        return mapData.enforcement_map;
    }
}