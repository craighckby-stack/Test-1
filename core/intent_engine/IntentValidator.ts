import intentSchema from '../../governance/m01_intent_schema_v1.json'; 

// Note: Ajv functionality is now abstracted into the CriticalSchemaValidatorUtility plugin.

/**
 * Conceptual import of the extracted plugin tool.
 * In a kernel environment, this object is typically injected or resolved via a plugin registry.
 */
declare const CriticalSchemaValidatorUtility: {
    initialize(config: { schemas: any[] }): boolean;
    validate(schemaId: string, data: any): { valid: boolean, errors: any[] | null };
    isInitialized(): boolean;
};

// Define the expected schema ID based on governance metadata.
const INTENT_SCHEMA_ID = 'https://agi.sovereign/schemas/intent/v2';

/**
 * Ensures the critical intent validation schema is loaded and compiled once upon module initialization.
 * This is crucial for performance and availability checks.
 */
(function initializeValidator() {
  // Check initialization status defensively.
  if (!CriticalSchemaValidatorUtility.isInitialized || !CriticalSchemaValidatorUtility.isInitialized()) {
    CriticalSchemaValidatorUtility.initialize({
      schemas: [intentSchema]
    });
  }
})();

interface IntentPayload {
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
 * Validates an incoming Intent object against the V2 governance schema using the Kernel's integrated validator.
 * @param intent The raw intent object.
 * @returns True if valid, throws an error with details if invalid.
 */
export function validateIntent(intent: any): intent is IntentPayload {
  
  const validationResult = CriticalSchemaValidatorUtility.validate(INTENT_SCHEMA_ID, intent);
  
  if (!validationResult.valid) {
    const errors = validationResult.errors;
    
    // Log detailed errors for debugging
    console.error(`Intent validation failed against schema ${INTENT_SCHEMA_ID}.`, errors);
    
    // Throw a structured error message detailing the failure source and errors.
    const errorDetails = errors ? JSON.stringify(errors, null, 2) : "Unknown schema validation failure.";
    
    throw new Error(`Intent validation failed: The submitted intent object did not conform to the required schema (${INTENT_SCHEMA_ID}). Details: ${errorDetails}`);
  }
  
  return true;
}