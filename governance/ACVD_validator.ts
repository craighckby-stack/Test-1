import { ACVD_SCHEMA } from './ACVD_schema.json';
import Ajv from 'ajv';
import crypto from 'crypto';

const ajv = new Ajv();
const validateSchema = ajv.compile(ACVD_SCHEMA);

/**
 * Validates an ACVD record against the canonical schema and performs cryptographic integrity checks.
 * @param record The ACVD object to validate.
 * @param inputContext The actual system context snapshot used to generate the context_hash.
 * @returns Validation results.
 */
export function validateACVD(record: any, inputContext: string): {
  isValid: boolean;
  errors: any[] | null;
} {
  // 1. Structural Validation
  const isValidStructure = validateSchema(record);
  if (!isValidStructure) {
    return { isValid: false, errors: validateSchema.errors };
  }

  // 2. Context Hash Integrity Check
  const computedContextHash = crypto.createHash('sha256').update(inputContext).digest('hex');
  if (computedContextHash !== record.context_hash) {
    return {
      isValid: false,
      errors: [
        { message: `Context hash mismatch. Expected ${computedContextHash}, found ${record.context_hash}. Input context was tampered or incorrectly hashed.` },
      ],
    };
  }

  // 3. ACVD_ID Calculation Check (Must match the hash of the full record content excluding the ACVD_ID itself)
  // NOTE: This implementation assumes ACVD_ID is the SHA256 of the canonical JSON string of the rest of the record.
  const temporaryRecord = { ...record };
  delete temporaryRecord.ACVD_ID;
  const expectedACVDId = crypto.createHash('sha256').update(JSON.stringify(temporaryRecord)).digest('hex');

  if (expectedACVDId !== record.ACVD_ID) {
    return {
      isValid: false,
      errors: [
        { message: `ACVD_ID integrity check failed. Expected ${expectedACVDId}, found ${record.ACVD_ID}.` },
      ],
    };
  }

  return { isValid: true, errors: null };
}