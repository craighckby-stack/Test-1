import { ErrorObject } from 'ajv';
import mecSchemaDefinition from '../../schemas/MECSchemaDefinition.json';
import { EvolutionMission } from '../types/MissionTypes';
import { ajvValidator } from '../plugins/SchemaValidatorPlugin';

// CRITICAL: We rely on the AjvErrorFormatterTool plugin to handle the formatting of validation errors.
declare const AjvErrorFormatterTool: {
    format: (errors: ErrorObject[]) => string;
};

/**
 * Custom Error Class for standardized Mission Validation Failures.
 * Includes detailed AJV error objects for internal debugging.
 */
export class MissionValidationError extends Error {
  public validationErrors: ErrorObject[];
  
  constructor(message: string, errors: ErrorObject[]) {
    super(message);
    this.name = 'MissionValidationError';
    this.validationErrors = errors;
  }
}

/**
 * Service responsible for rigorous structural and semantic validation of MEC configurations.
 * Ensures missions conform exactly to Sovereign AGI v94.1 protocols before execution.
 */
export class MissionValidationService {
  private readonly validateMission: (data: unknown, identifier?: string) => EvolutionMission;
  private readonly schemaTitle: string;

  constructor() {
    if (!mecSchemaDefinition || typeof mecSchemaDefinition !== 'object') {
        throw new Error("MEC Schema definition could not be loaded or is invalid.");
    }

    this.schemaTitle = (mecSchemaDefinition as any).title || 'MEC Schema Definition';

    // Compile the definition using the centralized plugin instance
    try {
        this.validateMission = ajvValidator.compile<EvolutionMission>(
            mecSchemaDefinition as any,
            this.schemaTitle
        );
    } catch (e) {
        // Catch fatal compilation failures originating from the plugin
        console.error("AJV Schema Compilation Failed during Service initialization:", e);
        throw e; 
    }
  }

  /**
   * Validates a mission configuration object against the central MEC Schema.
   * @param missionConfig The mission configuration payload (unknown input type).
   * @returns EvolutionMission The validated and strictly typed mission configuration.
   * @throws {MissionValidationError} If validation fails.
   */
  public validate(missionConfig: unknown): EvolutionMission {
    let validatedMission: EvolutionMission;
    let missionId: string = 'N/A';
    
    // Attempt to extract mission ID early for logging purposes
    if (typeof missionConfig === 'object' && missionConfig !== null && 'missionId' in missionConfig) {
        missionId = (missionConfig as Partial<EvolutionMission>).missionId as string || 'N/A';
    }

    try {
        // Delegate validation execution to the compiled plugin function
        validatedMission = this.validateMission(missionConfig, missionId);
    } catch (e) {
        // The plugin throws a generic internal error (SchemaValidationError) with attached validationErrors.
        const validationError = e as any;
        
        // Convert the generic internal error into the domain-specific MissionValidationError
        if (validationError && validationError.message) {
            throw new MissionValidationError(
                validationError.message, 
                validationError.validationErrors || []
            );
        }
        
        // Re-throw if it's an unexpected system error
        throw e; 
    }
    
    return validatedMission;
  }
}