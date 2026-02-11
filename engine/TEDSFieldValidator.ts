import { Logger } from './Logger';
import TEDS_SCHEMA from '../schema/teds_field_definitions.json';
import { ZodSchema, z } from 'zod';
import { executeValidation, ValidationResult } from './plugins/ValidationExecutionUtility';

/**
 * TEDSFieldValidator: Runtime engine consuming teds_field_definitions.json
 * to generate validation and normalization pipelines (using Zod internally).
 */
export class TEDSFieldValidator {
  private compiledSchema: ZodSchema<any>;

  constructor() {
    // Casting to ZodSchema<any> to satisfy internal typing, as the compileSchema placeholder is generic.
    this.compiledSchema = this.compileSchema(TEDS_SCHEMA.domains) as ZodSchema<any>;
    Logger.info('TEDS Schema compiled successfully.');
  }

  /**
   * Iteratively compiles the JSON definitions into a robust Zod validation schema.
   * (Requires extensive domain mapping logic not fully detailed here).
   */
  private compileSchema(domains: any): ZodSchema {
    let primaryDomainSchema: { [key: string]: ZodSchema } = {};

    // For demonstration, return a basic, conceptual compilation wrapper:
    return z.object({ 
      // Runtime generation happens here based on TEDS_SCHEMA
      core_transaction: z.record(z.string(), z.any())
    }).passthrough();
  }

  /**
   * Validates and attempts to normalize raw input data against the TEDS standard.
   */
  public processAndValidate(rawData: unknown): ValidationResult<any> {
    
    // 1. Define the specific validation function (Zod parsing logic).
    const zodValidatorFunction = (data: unknown) => {
        // The validator must throw the exception (ZodError) for the utility to catch and parse.
        return this.compiledSchema.parse(data);
    };

    // 2. Delegate execution, standardized error handling, and result formatting
    // to the external ValidationExecutionUtility plugin.
    // Note: We pass the local Logger instance to the utility for internal error logging.
    return executeValidation(zodValidatorFunction, rawData, Logger);
  }
}