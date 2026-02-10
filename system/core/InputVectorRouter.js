/**
 * @module InputVectorRouter
 * @description High-efficiency module for ingress vector validation and dynamic routing, 
 * utilizing the IVM_InputVectorManifest for operational parameters.
 */

import IVM from '../../config/IVM_InputVectorManifest.json';

// Assume SchemaValidationService and RateLimitingService are globally available 
// via the AGI kernel/plugin system (AGI.SchemaValidationService, AGI.RateLimitingService)

interface VectorDefinition {
    sourceType: string;
    constraints: {
        rateLimit: { limit: number; windowMs: number } | false;
    };
    schemaReference: string;
    targetHandler: string;
    priority: number;
}

interface Manifest {
    definitions: Record<string, any>;
    vectors: Record<string, VectorDefinition>;
}

const ManifestData: Manifest = IVM as Manifest;

class InputVectorRouter {
    private manifest: Manifest;

    constructor() {
        this.manifest = ManifestData;

        // 1. Initialize and register schemas using SchemaValidationService
        // Assuming AGI.SchemaValidationService exists and supports schema registration.
        if (typeof AGI.SchemaValidationService?.registerDefinitions === 'function') {
             // Register definitions defined in the manifest for global reference
             Object.keys(this.manifest.definitions).forEach(defName => {
                AGI.SchemaValidationService.registerDefinitions(this.manifest.definitions[defName], `/#/definitions/${defName}`);
            });
        } else if (typeof AGI.SchemaCompilationAndValidationService?.registerDefinitions === 'function') {
             // Fallback for related service
             Object.keys(this.manifest.definitions).forEach(defName => {
                AGI.SchemaCompilationAndValidationService.registerDefinitions(this.manifest.definitions[defName], `/#/definitions/${defName}`);
            });
        } else {
             console.warn("Schema validation service not fully initialized or missing registration capability.");
        }


        // 2. Configure Rate Limits using RateLimitingService
        if (typeof AGI.RateLimitingService?.configureLimit === 'function') {
            Object.keys(this.manifest.vectors).forEach(vectorId => {
                const constraint = this.manifest.vectors[vectorId].constraints.rateLimit;
                if (constraint) {
                    AGI.RateLimitingService.configureLimit(vectorId, constraint.limit, constraint.windowMs);
                }
            });
        } else {
            console.error("RateLimitingService is missing or not fully initialized. Rate limits will be ignored.");
        }
    }

    async routeVector(inputPayload: any, sourceType: string) {
        // 1. Identify potential vectors based on sourceType
        const vectorId = this.identifyVector(inputPayload, sourceType);
        if (!vectorId) throw new Error(`Vector identification failed for source: ${sourceType}`);
        
        const vectorDef = this.manifest.vectors[vectorId];

        // 2. Apply Constraints (Rate Limiting)
        if (vectorDef.constraints.rateLimit) {
            if (typeof AGI.RateLimitingService?.check === 'function') {
                if (!AGI.RateLimitingService.check(vectorId)) {
                    throw new Error(`Rate limit exceeded for vector: ${vectorId}`);
                }
            } else {
                console.warn(`Rate limit constraint defined for ${vectorId}, but RateLimitingService is unavailable.`);
            }
        }

        // 3. Validation against Schema
        const schemaURI = vectorDef.schemaReference;
        
        const validatorService = AGI.SchemaValidationService || AGI.SchemaCompilationAndValidationService;

        if (typeof validatorService?.validate === 'function') {
            // The schema reference is expected to be a URI that resolves against the registered definitions
            const validationResult = validatorService.validate(inputPayload, { $ref: schemaURI });

            if (validationResult.errors && validationResult.errors.length > 0) {
                // NOTE: Schema validation results typically use an 'errors' array if validation fails.
                throw new Error(`Input validation failed for ${vectorId}: ${validationResult.errors.map((e: any) => e.stack || e.message || String(e)).join('; ')}`);
            }
        } else {
            throw new Error("Schema Validation Service is unavailable. Cannot guarantee input integrity.");
        }


        // 4. Successful Route
        console.log(`Vector ${vectorId} validated. Routing to ${vectorDef.targetHandler}`);
        return {
            success: true,
            target: vectorDef.targetHandler,
            priority: vectorDef.priority,
            payload: inputPayload
        };
    }

    identifyVector(payload: any, sourceType: string): string | null {
        // Placeholder logic: A full system would use context or defined headers to match inputs.
        for (const [key, def] of Object.entries(this.manifest.vectors)) {
            if (def.sourceType === sourceType) {
                return key;
            }
        }
        return null;
    }
}

export default new InputVectorRouter();