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
import { ulid, decodeTime } from 'ulid'; // Assumes \'ulid\' package is installed

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

// NOTE: protocolSchema must be mocked as external JSON cannot be imported in this sandbox environment.
// Mocking P01_VEC_Protocol.json
const protocolSchema = {
    protocol_id: "P01_VEC",
    definitions: {
        VectorPayload: { type: "object", properties: { vector: { type: "array" } }, required: ["vector"] },
        ResponseFrame: { type: "object", properties: { status: { type: "string" } }, required: ["status"] }
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