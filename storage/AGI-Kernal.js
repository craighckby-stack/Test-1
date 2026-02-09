/** AGI-KERNAL RECOVERY v6.9.6 **/
const os = require('os');
const KERNEL_SYNC_FS = require('fs');
import FS_PROMISES from 'fs/promises';
import path from 'path';

// KERNEL Imports (React/Firebase)
import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Activity, ShieldCheck, Zap, ScanText, AlertTriangle, KeyRound, Globe, Lock, ThermometerSnowflake, Binary, Cpu, GitMerge, Gauge } from 'lucide-react';

// TARGET Imports
import Ajv from 'ajv';
import { validate } from 'fast-json-validator';
import { ulid, decodeTime } from 'ulid'; // Assumes 'ulid' package is installed

// === START: Security Utilities Graft (AGI-C-07) ===

/**
 * Mock CryptographicUtil for SecureConfigProvider dependency.
 * Provides deterministic mock encryption/decryption for structural testing.
 */
class CryptographicUtil {
    /**
     * Mock decryption: Reverses the mock encryption process.
     * @param {string} encryptedValue - Format: MOCK_IV:MOCK_CIPHERTEXT:MOCK_TAG
     * @param {string} key - The MEK (ignored in mock)
     * @returns {string} The original plaintext (mocked as the ciphertext part)
     */
    static decryptData(encryptedValue, key) {
        if (!encryptedValue || typeof encryptedValue !== 'string') {
            throw new Error("Invalid encrypted value format.");
        }
        const parts = encryptedValue.split(':');
        if (parts.length !== 3 || parts[0] !== 'MOCK_IV' || parts[2] !== 'MOCK_TAG') {
            // Simulate failure if format is wrong or key mismatch (mocked by format check)
            throw new Error("Decryption failed: Invalid mock format or bad key.");
        }
        // The ciphertext part is the original data in this mock
        return parts[1];
    }

    /**
     * Mock encryption: Wraps data in a deterministic mock format.
     * @param {string} data - Plaintext data.
     * @param {string} key - The MEK (ignored in mock)
     * @returns {string} Mock encrypted string (IV:Ciphertext:Tag)
     */
    static encryptData(data, key) {
        // In a real scenario, this would generate IV, encrypt, and generate Tag.
        return `MOCK_IV:${data}:MOCK_TAG`;
    }
}

/**
 * Mock implementation for IsolatedFailureReporter to satisfy CriticalPaths initialization dependency.
 * In a real system, this handles synchronous, non-blocking logging for critical failures.
 */
class IsolatedFailureReporter {
    static #logPath = null;

    static setLogPath(path) {
        IsolatedFailureReporter.#logPath = path;
        // console.log(`[AGI-KERNAL] Isolated Failure Logging path set to: ${path}`);
    }

    static reportFailure(message, severity = 'CRITICAL') {
        // Mock implementation: In a real scenario, this would use KERNEL_SYNC_FS to append synchronously.
        // if (IsolatedFailureReporter.#logPath) { ... }
    }
}

/**
 * Manages access to secrets/configuration data encrypted using the system's Master Encryption Key (MEK).
 * This provider enforces the use of the MEK (expected via environment variables) for centralized security management.
 * The MEK is retrieved and validated only once upon the first access, ensuring application failure
 * if security configuration is missing or invalid at runtime.
 */
export class SecureConfigProvider {

    /**
     * @type {string | null} Cached Master Encryption Key (AGI_MEK).
     */
    static #masterEncryptionKey = null;

    /**
     * Private constructor to prevent instantiation, emphasizing its static utility nature.
     */
    constructor() {
        throw new Error("SecureConfigProvider is a static utility class and cannot be instantiated.");
    }
    
    /**
     * Retrieves and validates the MEK from environment variables, caching it on first access.
     * Throws a fatal error if the key is missing or invalid, halting system initialization.
     * @returns {string} The validated 32-byte (64 char hex) encryption key.
     * @private
     */
    static #getEncryptionKey() {
        if (SecureConfigProvider.#masterEncryptionKey) {
            return SecureConfigProvider.#masterEncryptionKey;
        }

        // NOTE: process.env is assumed available in this Node/React environment context.
        const key = process.env.AGI_MEK;
        
        // A 32-byte key is required to be 64 characters in hex format
        if (!key || key.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(key)) {
            // Standardizing FATAL message format for visibility during bootstrap
            throw new Error(
                '[FATAL CONFIGURATION ERROR] AGI_MEK environment variable is required and must be a 64 character hexadecimal key (32 bytes).'
            );
        }
        
        // Cache the validated key securely in memory
        SecureConfigProvider.#masterEncryptionKey = key;
        return key;
    }

    /**
     * Decrypts a specific encrypted configuration value using the MEK.
     * Automatically attempts to parse the resulting plaintext as JSON if structure indicates.
     * @param {string} encryptedValue - The encrypted string (format: IV:Ciphertext:Tag).
     * @returns {any} The decrypted configuration value (string, object, array, etc.).
     * @throws {Error} If decryption fails (e.g., bad format, wrong key).
     */
    static getSecret(encryptedValue) {
        if (typeof encryptedValue !== 'string' || encryptedValue.trim() === '') {
            // Return non-string/empty inputs as is, preventing unnecessary key loading/crypto calls.
            return encryptedValue; 
        }
        
        const key = SecureConfigProvider.#getEncryptionKey();
        
        try {
            const decrypted = CryptographicUtil.decryptData(encryptedValue, key);
            
            // Attempt JSON parsing only if the result structurally resembles JSON
            const trimmed = decrypted.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                    return JSON.parse(decrypted);
                } catch (e) {
                    // If JSON parse fails but the structure looked right, return raw string fallback.
                }
            }

            return decrypted;
            
        } catch (error) {
            // Re-throw with clear contextual security failure message
            throw new Error(`[SECURITY DECRYPTION FAILED] Secret decryption failed. Input might be corrupted or encrypted with an incompatible AGI_MEK. Details: ${error.message}`);
        }
    }

    /**
     * Encrypts a configuration value for persistent storage.
     * @param {string|Object|Array|number|boolean} data - The data to encrypt. If non-string, it is serialized to JSON first.
     * @returns {string} The encrypted string (format: IV:Ciphertext:Tag).
     */
    static encryptSecret(data) {
        const key = SecureConfigProvider.#getEncryptionKey();
        
        // Ensure data is stringified for consistent encryption input and matching expected decryption output (JSON.parse attempt)
        const dataToEncrypt = (typeof data === 'object' && data !== null) || typeof data === 'number' || typeof data === 'boolean'
            ? JSON.stringify(data)
            : String(data);

        return CryptographicUtil.encryptData(dataToEncrypt, key);
    }
}

// === END: Security Utilities Graft ===

// === START: Critical Paths Graft (AGI-C-08) ===

/**
 * Defines non-negotiable, mission-critical file system paths and endpoints 
 * required by isolated system components (like IsolatedFailureReporter) immediately 
 * upon boot, independent of the main configuration system.
 */
export const CriticalPaths = {
    // Path used by IsolatedFailureReporter for synchronous, append-only security logging.
    ISOLATED_FAILURE_LOG: process.env.AGI_ISOLATED_LOG_PATH || '/var/log/agi/isolated_failures.log',
    
    // Path for the secure, read-only recovery script repository.
    RECOVERY_SCRIPTS_ROOT: '/etc/agi/recovery_scripts/',

    // Optional: Low-level telemetry endpoint (if synchronous network I/O is possible).
    SECURE_TELEMETRY_ENDPOINT: null,
};

// --- Initialization ---
// This configuration must be loaded very early during the system bootstrap.
// The system startup should ensure these environment variables/paths are set and accessible.

if (CriticalPaths.ISOLATED_FAILURE_LOG) {
    // In the monolithic KERNEL structure, we use the defined class directly.
    IsolatedFailureReporter.setLogPath(CriticalPaths.ISOLATED_FAILURE_LOG);
}

// === END: Critical Paths Graft ===

// === START: Schema Validation Utility Graft (AGI-C-09) ===

/**
 * Sovereign AGI v94.1 Schema Validator Utility
 * Provides standardized, high-performance schema validation for internal data structures. 
 * Ensures data integrity across sensitive service boundaries by centralizing schema definitions.
 */
class SchemaValidator_Util {

  constructor() {
    // Centralized schema definitions for critical data flows
    this.schemas = {
      'FailureTraceLog': {
        timestamp: { type: 'string', required: true },
        component: { type: 'string', required: true },
        trace_id: { type: 'string', required: true, description: 'Unique ID for error correlation' },
        error_details: { type: 'object', required: true }
      },
      // Future schemas: 'TelemetryEvent', 'ConfigurationUpdate'
    };
  }

  /**
   * Validates input data against a defined schema.
   * NOTE: This is a robust mock. A true AGI implementation would utilize Zod/Joi.
   * @param {string} schemaName - The name of the schema to use.
   * @param {Object} data - The data payload to validate.
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate(schemaName, data) {
    const schema = this.schemas[schemaName];
    const errors = [];

    if (!schema) {
      return { isValid: false, errors: [`Schema definition '${schemaName}' not found.`] };
    }

    for (const field in schema) {
      const definition = schema[field];
      const fieldValue = data[field];

      // 1. Required Check
      if (definition.required && (typeof fieldValue === 'undefined' || fieldValue === null)) {
        errors.push(`Missing required field: ${field}`);
        continue; 
      }

      // 2. Type Check (only if value is present)
      if (typeof fieldValue !== 'undefined' && definition.type && typeof fieldValue !== definition.type) {
        // Handle typeof null === 'object' edge case, and allow generic object structure.
        if (definition.type === 'object' && fieldValue !== null) continue;
        errors.push(`Field '${field}' type mismatch. Expected ${definition.type}, got ${typeof fieldValue}.`);
      }
    }
    
    return { 
      isValid: errors.length === 0, 
      errors 
    };
  }
}

/** Export the instantiated utility for use across the kernel. */
export const SchemaValidator = new SchemaValidator_Util();

// === END: Schema Validation Utility Graft ===

// === START: Telemetry Event Registry Graft (AGI-C-10) ===

/**
 * Standardized Event Names for the GAX Telemetry Service (Global Autonomous X-System).
 * Structure: NAMESPACE:SUBDOMAIN:ACTION
 */
export const GAXEventRegistry = Object.freeze({
    // ----------------------------------------
    // System Lifecycle (SYS)
    // ----------------------------------------
    SYS_INIT_START: 'SYS:INIT:START',
    SYS_INIT_COMPLETE: 'SYS:INIT:COMPLETE',
    SYS_EXECUTION_START: 'SYS:EXECUTION:START',
    SYS_EXECUTION_END: 'SYS:EXECUTION:END',
    SYS_SHUTDOWN: 'SYS:SHUTDOWN',

    // ----------------------------------------
    // Policy & Verification (PV)
    // ----------------------------------------
    PV_REQUEST_INITIATED: 'PV:REQUEST:INITIATED',
    PV_RULE_CHECK_SUCCESS: 'PV:RULE:CHECK:SUCCESS',
    PV_RULE_CHECK_FAILURE: 'PV:RULE:CHECK:FAILURE',
    PV_ACCESS_DENIED: 'PV:ACCESS:DENIED', // Added: Explicit policy rejection

    // ----------------------------------------
    // Autonomous Evolution (AXIOM)
    // ----------------------------------------
    AXIOM_GENERATION_START: 'AXIOM:GENERATION:START',
    AXIOM_EVOLUTION_STEP_PERFORMED: 'AXIOM:EVOLUTION:STEP_PERFORMED',
    AXIOM_CODE_COMMITTED: 'AXIOM:CODE:COMMITTED',
    AXIOM_CODE_REVERTED: 'AXIOM:CODE:REVERTED',
    AXIOM_TEST_RUN_SUCCESS: 'AXIOM:TEST:RUN_SUCCESS', // Added: Critical for self-correction loops
    AXIOM_TEST_RUN_FAILURE: 'AXIOM:TEST:RUN_FAILURE', // Added

    // ----------------------------------------
    // Planning and Context Management (PLAN)
    // ----------------------------------------
    PLAN_GOAL_DEFINED: 'PLAN:GOAL:DEFINED',
    PLAN_STEP_GENERATED: 'PLAN:STEP:GENERATED',
    PLAN_STEP_COMPLETED: 'PLAN:STEP:COMPLETED', // Added
    PLAN_CONTEXT_RETRIEVAL_START: 'PLAN:CONTEXT:RETRIEVAL_START',
    PLAN_CONTEXT_RETRIEVAL_COMPLETE: 'PLAN:CONTEXT:RETRIEVAL_COMPLETE',

    // ----------------------------------------
    // External API Interaction (API)
    // ----------------------------------------
    API_REQUEST_SENT: 'API:EXTERNAL:REQUEST_SENT', // Added
    API_RESPONSE_RECEIVED: 'API:EXTERNAL:RESPONSE_RECEIVED', // Added
    API_RATE_LIMIT_HIT: 'API:EXTERNAL:RATE_LIMIT_HIT', // Added: Essential for resource management

    // ----------------------------------------
    // Data/Context Storage (DATA)
    // ----------------------------------------
    DATA_CACHE_HIT: 'DATA:CACHE:HIT', // Added
    DATA_CACHE_MISS: 'DATA:CACHE:MISS', // Added
    DATA_STORAGE_WRITE_FAILURE: 'DATA:STORAGE:WRITE_FAILURE', // Added

    // ----------------------------------------
    // System Diagnostics, Errors, and Warnings (DIAG)
    // ----------------------------------------
    DIAG_CONFIGURATION_FAULT: 'DIAG:CONFIGURATION:FAULT',
    DIAG_CONTEXT_RESOLUTION_MISSING: 'DIAG:CONTEXT:RESOLUTION_MISSING',
    DIAG_COMPONENT_FATAL_ERROR: 'DIAG:COMPONENT:FATAL_ERROR',
    DIAG_WARNING_THRESHOLD_EXCEEDED: 'DIAG:WARNING:THRESHOLD_EXCEEDED',

    // ----------------------------------------
    // Telemetry Infrastructure (TEL)
    // ----------------------------------------
    TEL_PUBLISH_SUCCESS: 'TEL:PUBLISH:SUCCESS',
    TEL_PUBLISH_FAILURE: 'TEL:PUBLISH:FAILURE',
    TEL_DATA_DROPPED: 'TEL:DATA:DROPPED'
});

// === END: Telemetry Event Registry Graft ===

// NOTE: protocolSchema must be mocked as external JSON cannot be imported in this sandbox environment.
// Mocking P01_VEC_Protocol.json
const protocolSchema = {
    protocol_id: "P01_VEC",
    definitions: {
        VectorPayload: { type: "object", properties: { vector: { type: "array" } }, required: [
"vector"] },
        ResponseFrame: { type: "object", properties: { status: { type: "string" } }, required: [
"status"] }
    }
};

const ajv = new Ajv({ schemas: [protocolSchema] });

// Compile schemas from the definitions section for direct use
const validatePayload = ajv.compile(protocolSchema.definitions.VectorPayload);
const validateResponse = ajv.compile(protocolSchema.definitions.ResponseFrame);

export function isValidPayload(data) {
  const valid = validatePayload(data);
  if (!valid) {
    // console.error('Vector Payload Validation Failed:', validatePayload.errors);
  }
  return valid;
}

export function isValidResponse(data) {
  const valid = validateResponse(data);
  if (!valid) {
    // console.error('Response Frame Validation Failed:', validateResponse.errors);
  }
  return valid;
}

// Utility function for retrieving required protocol constants
export const VEC_PROTOCOL_ID = protocolSchema.protocol_id;

// Mock the policy schema, as external JSON import is not possible here.
const STDM_V99_POLICY = {
    type: "object",
    properties: {
        componentId: { type: "string" },
        version: { type: "string\