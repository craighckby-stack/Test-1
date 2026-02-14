import { Logger } from './Logger';
import TEDS_SCHEMA from '../schema/teds_field_definitions.json';
import { ZodSchema, z } from 'zod';
import { executeValidation, ValidationResult } from './plugins/ValidationExecutionUtility';

/**
 * TEDSFieldValidator: Runtime engine consuming teds_field_definitions.json
 * to generate validation and normalization pipelines (using Zod internally).
 */
export class TEDSFieldValidator {
  #compiledSchema: ZodSchema<any>;

  constructor() {
    this.#initializeEngine();
  }

  // --- Initialization and Setup ---

  /**
   * Extracts synchronous initialization logic from the constructor.
   */
  #initializeEngine(): void {
    // TEDS_SCHEMA consumption and schema compilation logic delegated to private methods.
    this.#compiledSchema = this.#compileTedsSchema(TEDS_SCHEMA.domains) as ZodSchema<any>;
    this.#logInfo('TEDS Schema compiled successfully.');
  }

  // --- Private Proxies (I/O & Internal Logic) ---

  /**
   * Proxy for Logger.info, strictly isolating logging operations.
   */
  #logInfo(message: string): void {
    Logger.info(message);
  }

  /**
   * Proxy for Zod Schema compilation logic, using external Zod dependency.
   * (Requires extensive domain mapping logic not fully detailed here).
   */
  #compileTedsSchema(domains: any): ZodSchema {
    let primaryDomainSchema: { [key: string]: ZodSchema } = {};

    // For demonstration, return a basic, conceptual compilation wrapper:
    return z.object({
      // Runtime generation happens here based on TEDS_SCHEMA
      core_transaction: z.record(z.string(), z.any())
    }).passthrough();
  }

  /**
   * Proxy for external ValidationExecutionUtility tool, strictly isolating
   * the delegation to the external execution environment.
   */
  #delegateToValidationExecution(validatorFn: (data: unknown) => unknown, rawData: unknown): ValidationResult<any> {
    // Note: The Logger dependency is passed through this proxy.
    return executeValidation(validatorFn, rawData, Logger);
  }

  /**
   * Validates and attempts to normalize raw input data against the TEDS standard.
   */
  public processAndValidate(rawData: unknown): ValidationResult<any> {

    // 1. Define the specific validation function (Zod parsing logic).
    const zodValidatorFunction = (data: unknown) => {
        // The validator must throw the exception (ZodError) for the utility to catch and parse.
        return this.#compiledSchema.parse(data);
    };

    // 2. Delegate execution, standardized error handling, and result formatting
    // using the I/O proxy.
    return this.#delegateToValidationExecution(zodValidatorFunction, rawData);
  }
}
