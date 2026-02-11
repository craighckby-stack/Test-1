import { IndexedConstraintMap, ConstraintDefinition } from './GaxConstraintEnforcer';
import { GaxIndexingFallback } from './GaxIndexingFallback'; // Assuming the plugin is imported

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

/**
 * GaxConstraintIndexer is responsible for delegating the parsing and transformation
 * of raw, inherited constraint configurations to an external utility, providing a
 * basic index via a fallback mechanism if the utility is not initialized.
 */
export class GaxConstraintIndexer {
  
  private static getIndexerUtility(): ConfigIndexingAndFlattenerUtility | undefined {
    // Dependency injection/access to the global tool instance
    return (globalThis as any).ConfigIndexingAndFlattenerUtilityInstance;
  }
  
  /**
   * Processes raw constraint configuration to create an efficient runtime index.
   * This method delegates the complex inheritance, defaults application, and conflict resolution
   * logic to the dedicated ConfigIndexingAndFlattenerUtility.
   */
  public static buildIndex(config: ConstraintConfig): IndexedConstraintMap {
    const configIndexer = GaxConstraintIndexer.getIndexerUtility();

    if (configIndexer && typeof configIndexer.flattenAndIndex === 'function') {
        // Delegate complex indexing and flattening to the dedicated utility
        return configIndexer.flattenAndIndex(config);
    }

    // CRITICAL FALLBACK / Initialization Error Handling:
    console.error("ConfigIndexingAndFlattenerUtility is not initialized. Using basic fallback stub.");

    // Delegate fallback index creation to the specialized utility plugin.
    // We pass the required constructor (Map) as IndexedConstraintMap is derived from Map.
    return GaxIndexingFallback.createBasicIndex(
        config,
        Map as new () => IndexedConstraintMap
    );
  }
}