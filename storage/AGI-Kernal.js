/** AGI-KERNAL RECOVERY v6.9.6 **/
const os = require('os');
const KERNEL_SYNC_FS = require('fs');
import FS_PROMISES from 'fs/promises';
import path from 'path';

// --- START: AGI Configuration Service Graft ---

/**
 * ConfigService: Centralized Configuration and Environment Management
 * Role: Defines global application constants, manages environment variables,
 * and provides standardized path resolution using the native 'path' module.
 */
class ConfigService {
    constructor() {
        // Environment initialization
        this.NODE_ENV = process.env.NODE_ENV || 'development';
        this.IS_PRODUCTION = this.NODE_ENV === 'production';
        this.IS_DEVELOPMENT = this.NODE_ENV === 'development';

        // Path initialization (using path.resolve for robustness)
        this.ROOT_DIR = path.resolve(process.cwd());
        this.SRC_DIR = path.join(this.ROOT_DIR, 'src');
        this.CONFIG_DIR = path.join(this.SRC_DIR, 'config');
        this.LOGS_DIR = path.join(this.ROOT_DIR, 'logs');
    }

    /**
     * Retrieves the current environment string.
     */
    getEnvironment() {
        return this.NODE_ENV;
    }

    /**
     * Standardizes critical application paths.
     * @param {string} filename The name of the config file (e.g., 'governance').
     * @param {string} [extension='.yaml'] The expected file extension.
     * @returns {string} The full path to the configuration file.
     */
    getConfigPath(filename, extension = '.yaml') {
        // Note: Assumes config files are within src/config/ for AGI standard configuration
        return path.join(this.CONFIG_DIR, `${filename}${extension}`);
    }

    /**
     * Converts a string value from process.env into its native type (boolean, number, string).
     * @param {string} value The environment variable string value.
     * @returns {*} The parsed value.
     */
    _parseEnvValue(value) {
        if (typeof value !== 'string') return value;
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        
        // Check if numeric, avoiding parsing empty strings as 0
        if (!isNaN(Number(value)) && value.trim() !== '') return Number(value);
        return value;
    }

    /**
     * Gets a variable based on environment preference or default, with type parsing.
     * @param {string} key The environment variable key.
     * @param {*} defaultValue The fallback value.
     * @returns {string|number|boolean|*} The retrieved and parsed value.
     */
    getEnv(key, defaultValue) {
        const envValue = process.env[key];

        if (envValue !== undefined) {
            return this._parseEnvValue(envValue);
        }

        // Ensure the default value is also run through parsing if it is a string representation
        if (typeof defaultValue === 'string') {
             return this._parseEnvValue(defaultValue);
        }

        return defaultValue;
    }

    /**
     * Helper to get a strictly typed boolean environment variable.
     */
    getBool(key, defaultValue = false) {
        return this.getEnv(key, defaultValue) === true;
    }
}

// Export a singleton instance for internal KERNEL use
export const Config = new ConfigService();

// --- END: AGI Configuration Service Graft ---

// --- START: AGI Crypto Service Graft ---

/**
 * src/security/CryptoService.js
 * Provides robust cryptographic hashing services for pseudonymization and data integrity.
 * NOTE: In a Node.js environment, this would utilize the built-in 'crypto' module.
 */
class CryptoService {
    /**
     * Securely hashes a string payload using a specified algorithm.
     * @param {string} payload The data to hash.
     * @param {string} algorithm The hashing algorithm (e.g., 'SHA256', 'MD5').
     * @returns {string} The resulting hex-encoded hash.
     */
    hash(payload, algorithm = 'SHA256') {
        if (typeof payload !== 'string' || payload.length === 0) {
            return '';
        }
        
        try {
            // Placeholder implementation simulating secure hashing (replace with actual crypto module usage)
            const hash = `${algorithm}_${btoa(payload).substring(0, 12)}...`;
            
            // Example of real implementation using node: 
            /*
            const crypto = require('crypto');
            return crypto.createHash(algorithm.toLowerCase()).update(payload).digest('hex');
            */
            
            return hash;
        } catch (error) {
            console.error(`CryptoService error hashing data with ${algorithm}:`, error);
            // Fail safe, return empty string or non-identifiable placeholder
            return `HASHING_FAILED_${algorithm}`;
        }
    }
}

// Export a singleton instance for internal KERNEL use
export const Crypto = new CryptoService();

// --- END: AGI Crypto Service Graft ---

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

// Policy path for Root-of-Trust configuration verification
const INTEGRITY_POLICY_PATH = 'governance/config/IntegrityPolicy.json';

// --- START: Governance Configuration Graft (TARGET) ---

/**
 * Default location identifier for the primary governance schema file.
 * NOTE: Actual path resolution (e.g., using path.resolve) should occur in the loader utility, 
 * allowing this file to focus solely on definitions and abstract identification.
 */
export const GOVERNANCE_SCHEMA_IDENTIFIER = 'config/governanceSchema.json';

/**
 * Base configuration parameters for the AJV validator instance.
 * Enables strict structural enforcement essential for compliance verification.
 */
export const AJV_CONFIG_STRICT = {
    // Report all structural discrepancies rather than failing fast on the first error.
    allErrors: true,
    // Enforce stricter JSON schema rules (e.g., prohibiting unknown format usages).
    strict: true,
    // Allows AJV to cast data types to match schema types (e.g., "5" -> 5)
    coerceTypes: true,
    // Enable validation for standard formats (e.g., email, uuid, date-time)
    formats: true,
};

// --- Reusable Schema Fragments (Definitions) ---

/**
 * Standard reusable definitions ($defs) for common compliance properties,
 * promoting consistency across larger governance schemas.
 */
export const COMMON_SCHEMA_DEFS = {
    SeverityLevel: {
        type: "string",
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL", "DEBUG"], 
        description: "Standardized operational severity level indicating impact or urgency."
    },
    VetoTriggerSource: {
        type: "string",
        enum: ["POLICY_BREACH", "RESOURCE_EXHAUSTION", "SECURITY_EVENT", "MANUAL_OVERRIDE", "ANOMALY_DETECTION", "INIT_FAILURE"], 
        description: "The originating cause for a veto action, leading to system halt."
    },
    EntityIdentifier: {
        type: "string",
        format: "uuid", // Assumes standard UUID structure for traceability
        description: "A unique identifier for a monitored entity or resource."
    }
};

// --- Fallback Schema Definition ---

/**
 * Defines a minimal, operational schema ensuring system continuity
 * if the primary configuration file is missing or inaccessible during initialization.
 * Utilizes common definitions for internal standardization.
 */
export const MINIMAL_FALLBACK_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://v94.1/schemas/minimal-compliance.json",
    $defs: COMMON_SCHEMA_DEFS,
    type: "object",
    description: "Minimal necessary compliance structure required for core operational continuity.",
    properties: {
        system_uuid: { $ref: "#/$defs/EntityIdentifier" },
        compliance_level_mandate: {
            $ref: "#/$defs/SeverityLevel",
            description: "The mandated baseline operational severity required (e.g., HIGH)."
        },
        veto_triggers: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    source: { $ref: "#/$defs/VetoTriggerSource" },
                    description: { type: "string", minLength: 10, pattern: "^[A-Z].*"}
                }
            }
        }
    }
};