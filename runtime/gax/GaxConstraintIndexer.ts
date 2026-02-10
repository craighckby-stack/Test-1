import { IndexedConstraintMap, ConstraintDefinition } from './GaxConstraintEnforcer';

// Interface representing the raw input configuration file (often nested/inherited structure)
export interface ConstraintConfig {
  // Structure will vary based on GAX configuration schema, typically indexed by services.
  services: Record<string, any>; 
  defaults: ConstraintDefinition[];
}

// Global augmentation to declare the external tool interface
declare global {
    /**
     * Utility for processing hierarchical constraint configurations and flattening them
     * into an optimized, keyed index (serviceName/methodName -> constraints).
     */
    interface ConfigIndexingAndFlattenerUtility {
        /**
         * Takes hierarchical constraint configuration and applies inheritance rules
         * to produce a flat map keyed by 'serviceName/methodName'.
         * @param config The raw input constraint configuration.
         * @returns The flattened index map.
         */
        flattenAndIndex(config: ConstraintConfig): IndexedConstraintMap;
    }
}

// Assume dependency injection or access to the global tool instance
const configIndexer: ConfigIndexingAndFlattenerUtility = (globalThis as any).ConfigIndexingAndFlattenerUtilityInstance;

/**
 * GaxConstraintIndexer is responsible for delegating the parsing and transformation
 * of raw, inherited constraint configurations to the ConfigIndexingAndFlattenerUtility
 * to produce the optimized, flat Index utilized by the Enforcer.
 */
export class GaxConstraintIndexer {
  /**
   * Processes raw constraint configuration to create an efficient runtime index.
   * This method delegates the complex inheritance, defaults application, and conflict resolution
   * logic to the dedicated ConfigIndexingAndFlattenerUtility.
   */
  public static buildIndex(config: ConstraintConfig): IndexedConstraintMap {
    if (configIndexer && typeof configIndexer.flattenAndIndex === 'function') {
        // Delegate complex indexing and flattening to the dedicated utility
        return configIndexer.flattenAndIndex(config);
    }

    // CRITICAL FALLBACK / Initialization Error Handling:
    console.error("ConfigIndexingAndFlattenerUtility is not initialized. Using basic fallback stub.");
    const index: IndexedConstraintMap = new Map();
    
    const services = config.services || {};
    const defaults = config.defaults || [];
    
    // Fallback stub logic (matching the original functionality sketch)
    for (const [serviceName, serviceConfig] of Object.entries(services)) {
        if (serviceConfig && serviceConfig.methods) {
            for (const methodName in serviceConfig.methods) {
                const key = `${serviceName}/${methodName}`;
                // Default application only
                index.set(key, defaults);
            }
        }
    }
    
    return index;
  }
}