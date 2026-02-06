/**
 * Sovereign AGI v94.1 - Intent Validator Utility
 * Validates incoming Intents against the M-01 Schema before they enter the processing queue.
 */

import Ajv from 'ajv';
// Assumes the schema is resolvable relative to the core path structure.
import intentSchema from '../governance/M-01_Intent_Schema.json';

const ajv = new Ajv({
    allErrors: true,
    removeAdditional: true // Remove extraneous fields not defined in the schema
});

const validateIntent = ajv.compile(intentSchema);

export function validate(intentObject) {
    const valid = validateIntent(intentObject);
    if (!valid) {
        return {
            valid: false,
            errors: validateIntent.errors
        };
    }
    return { valid: true };
}

export function assertValid(intentObject) {
    const result = validate(intentObject);
    if (!result.valid) {
        const errorString = JSON.stringify(result.errors, null, 2);
        console.error('Validation Error Details:', errorString);
        throw new Error(`CRITICAL: Intent validation failed for M-01 schema compliance.`);
    }
    return true;
}