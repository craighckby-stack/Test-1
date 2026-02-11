import intentSchema from '../../governance/m01_intent_schema_v1.json'; 

/**
 * Interface defining the required capabilities of the Kernel's Schema Validation Utility.
 * This formalizes the dependency contract, replacing implicit global lookups.
 */
interface ICriticalSchemaValidator {
    initialize(config: { schemas: any[] }): boolean;
    validate(schemaId: string, data: any): { valid: boolean, errors: any[] | null };
    isInitialized(): boolean;
}

// Define the expected schema ID based on governance metadata.
const INTENT_SCHEMA_ID = 'https://agi.sovereign/schemas/intent/v2';

export interface IntentPayload {
  intent_id: string;
  version: '2.0.0';
  type: string;
  goal: string;
  priority: string;
  status: string;
  timestamp_created: string;
  // NOTE: Schema validation handles all other required properties.
}

/**
 * IntentValidator: Centralizes intent validation, enforcing explicit Dependency Management 
 * (Dependency Injection) and guaranteeing initialization of the critical governance schema
 * before execution.
 * 
 * This class replaces brittle global dependency reliance, implicit typing via `declare const`,
 * and module-level IIFE initialization.
 */
export class IntentValidator {
    // Private fields for strict encapsulation and structural integrity.
    #validator: ICriticalSchemaValidator;
    #schemaId: string = INTENT_SCHEMA_ID;
    
    /**
     * @param validator The kernel's ICriticalSchemaValidator instance (Dependency Injection).
     */
    constructor(validator: ICriticalSchemaValidator) {
        if (!validator || typeof validator.validate !== 'function') {
            throw new Error("IntentValidator instantiation failed: A valid ICriticalSchemaValidator instance must be provided via constructor injection.");
        }
        this.#validator = validator;
        
        // Guarantee the schema is loaded immediately upon instantiation.
        this.#initializeSchema();
    }

    /**
     * Ensures the critical intent validation schema is loaded and compiled once.
     * @private
     */
    #initializeSchema(): void {
        // Check initialization status defensively.
        if (!this.#validator.isInitialized || !this.#validator.isInitialized()) {
            this.#validator.initialize({
                schemas: [intentSchema]
            });
        }
    }

    /**
     * Validates an incoming Intent object against the V2 governance schema using the Kernel's integrated validator.
     * @param intent The raw intent object.
     * @returns True if valid.
     * @throws Error with detailed validation errors if invalid.
     */
    public validateIntent(intent: any): intent is IntentPayload {
        
        const validationResult = this.#validator.validate(this.#schemaId, intent);
        
        if (!validationResult.valid) {
            const errors = validationResult.errors;
            
            // Log detailed errors for debugging
            console.error(`Intent validation failed against schema ${this.#schemaId}.`, errors);
            
            // Throw a structured error message detailing the failure source and errors.
            const errorDetails = errors ? JSON.stringify(errors, null, 2) : "Unknown schema validation failure.";
            
            throw new Error(`Intent validation failed: The submitted intent object did not conform to the required schema (${this.#schemaId}). Details: ${errorDetails}`);
        }
        
        return true;
    }
}