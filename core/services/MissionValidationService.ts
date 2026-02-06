import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import mecSchemaDefinition from '../../schemas/MECSchemaDefinition.json';

interface EvolutionMission {
  missionId: string;
  evolutionSteps: any[]; 
}

// Initialize Ajv instance with necessary formats (UUID, date-time)
const ajv = new Ajv({ coerceTypes: true });
addFormats(ajv);

/**
 * Service responsible for rigorous structural and semantic validation of MEC configurations.
 * Ensures missions conform exactly to Sovereign AGI v94.1 protocols before execution.
 */
export class MissionValidationService {
  private readonly validator: Ajv.ValidateFunction<EvolutionMission>;

  constructor() {
    // Compile the definition immediately for performance
    this.validator = ajv.compile(mecSchemaDefinition as JSONSchemaType<EvolutionMission>);
  }

  /**
   * Validates a mission configuration object against the central MEC Schema.
   * @param missionConfig The mission configuration payload.
   * @returns boolean true if valid, throws error otherwise.
   */
  public validate(missionConfig: unknown): boolean {
    if (typeof missionConfig !== 'object' || missionConfig === null) {
      throw new Error('Mission configuration must be an object.');
    }

    const isValid = this.validator(missionConfig);

    if (!isValid) {
      const errors = this.validator.errors || [];
      // Detailed error reporting is crucial for AGI debugging
      const errorMessages = errors.map(err => 
        `Validation Error in path '${err.instancePath}': ${err.message}`
      ).join('\n');
      
      throw new Error(`MEC Schema Validation Failed:\n${errorMessages}`);
    }
    
    console.log(`Mission ${missionConfig.missionId} validated successfully against MECSchemaDefinition.`);
    return true;
  }
}