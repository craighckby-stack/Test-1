import * as fs from 'fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const CONTRACT_PATH = 'config/TEDS_event_contract.json';

interface ValidationResult {
  isValid: boolean;
  errors: Ajv.ErrorObject[] | null;
}

export class EventContractValidator {
  private ajv: Ajv;
  private contract: any;

  constructor() {
    const ajv = new Ajv({ allErrors: true, useDefaults: true, allowUnionTypes: true });
    addFormats(ajv);
    this.ajv = ajv;
    this.loadContract();
  }

  private loadContract(): void {
    try {
      const contractContent = fs.readFileSync(CONTRACT_PATH, 'utf-8');
      this.contract = JSON.parse(contractContent);
      this.compileSchemas();
    } catch (e) {
      console.error(`Error loading or parsing contract file ${CONTRACT_PATH}:`, e);
      process.exit(1);
    }
  }

  private compileSchemas(): void {
    const eventTypes = this.contract.eventTypes || {};
    for (const eventName in eventTypes) {
      if (eventTypes.hasOwnProperty(eventName)) {
        const fullSchema = {
          type: 'object',
          properties: {
            metadata: this.contract.defaultMetadataSchema,
            payload: eventTypes[eventName].payloadSchema
          },
          required: ['metadata', 'payload']
        };
        this.ajv.addSchema(fullSchema, eventName);
      }
    }
  }

  public validate(eventName: string, data: object): ValidationResult {
    const validate = this.ajv.getSchema(eventName);
    if (!validate) {
      return { isValid: false, errors: [{ message: `Schema not found for event type: ${eventName}`, keyword: 'missingContract' } as Ajv.ErrorObject] };
    }
    
    const isValid = validate(data);
    
    return {
      isValid,
      errors: validate.errors
    };
  }

  public getContract(): any {
      return this.contract;
  }
}