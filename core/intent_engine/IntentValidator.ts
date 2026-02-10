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

const SCHEMA_ID = 'https://agi.sovereign/schemas/intent/v2';

// Initialize the validator with required schemas upon module load.
// This ensures the schema is loaded and compiled exactly once.
(function initializeValidator() {
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
  // ... other properties ...
}

/**
 * Validates an incoming Intent object against the V2 governance schema using the Kernel's integrated validator.
 * @param intent The raw intent object.
 * @returns True if valid, throws an error with details if invalid.
 */
export function validateIntent(intent: any): intent is IntentPayload {
  
  const validationResult = CriticalSchemaValidatorUtility.validate(SCHEMA_ID, intent);
  
  if (!validationResult.valid) {
    console.error("Intent Validation Errors:", validationResult.errors);
    
    const errors = validationResult.errors ? JSON.stringify(validationResult.errors) : "Unknown validation failure.";
    
    throw new Error(`Intent validation failed: ${errors}`);
  }
  
  return true;
}