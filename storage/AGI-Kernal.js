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

// --- START: AGI Averaging Manager Graft (TARGET) ---

/**
 * AveragingManager: Optimized Recursive Averaging Service
 * Implements Exponential Moving Average (EMA) for computationally efficient,
 * recursively abstracted tracking of metrics (e.g., latency, resource utilization).
 * This provides O(1) update complexity, crucial for high-frequency kernel operations.
 */
class AveragingManager {
    // Map<metricKey, { currentAverage: number, alpha: number, initialized: boolean }>
    metrics = new Map();
    defaultAlpha;

    /**
     * @param {number} defaultAlpha - The default smoothing factor (0 < alpha <= 1). 
     * A higher alpha means less smoothing (more responsive to recent data).
     * Typical values derived from period N: alpha = 2 / (N + 1).
     */
    constructor(defaultAlpha = 0.1) {
        if (defaultAlpha <= 0 || defaultAlpha > 1) {
            throw new Error("Alpha must be between 0 (exclusive) and 1 (inclusive).");
        }
        this.defaultAlpha = defaultAlpha;
    }

    /**
     * Initializes or resets a metric tracker.
     * @param {string} key - Unique identifier for the metric.
     * @param {number} [alpha] - Optional custom smoothing factor for this metric.
     */
    initializeMetric(key, alpha) {
        const effectiveAlpha = alpha !== undefined ? alpha : this.defaultAlpha;
        if (effectiveAlpha <= 0 || effectiveAlpha > 1) {
             throw new Error(`Invalid alpha (${effectiveAlpha}) provided for metric ${key}.`);
        }
        this.metrics.set(key, {
            currentAverage: 0,
            alpha: effectiveAlpha,
            initialized: false
        });
    }

    /**
     * Updates the Exponential Moving Average (EMA) for a given metric.
     * This is the core recursive abstraction logic.
     * 
     * EMA_t = alpha * Value_t + (1 - alpha) * EMA_{t-1}
     * 
     * @param {string} key - Unique identifier for the metric.
     * @param {number} newValue - The latest observed value.
     * @returns {number} The newly calculated average.
     */
    updateAverage(key, newValue) {
        const metric = this.metrics.get(key);

        if (!metric) {
            // Auto-initialize if not found, using default alpha
            this.initializeMetric(key);
            const newMetric = this.metrics.get(key);
            if (!newMetric) throw new Error(`Failed to initialize metric ${key}`); // Should not happen
            return this.updateAverage(key, newValue); // Recurse once to apply the value
        }

        const { currentAverage, alpha, initialized } = metric;

        let newAverage;

        if (!initialized) {
            // Initial state: Use the first value as the starting average (no smoothing applied yet)
            newAverage = newValue;
            metric.initialized = true;
        } else {
            // Recursive EMA calculation (O(1) complexity)
            newAverage = (alpha * newValue) + ((1 - alpha) * currentAverage);
        }

        metric.currentAverage = newAverage;
        return newAverage;
    }

    /**
     * Retrieves the current calculated average for a metric.
     * @param {string} key - Unique identifier for the metric.
     * @returns {number | null} The current average, or null if the metric is uninitialized.
     */
    getAverage(key) {
        const metric = this.metrics.get(key);
        if (metric && metric.initialized) {
            return metric.currentAverage;
        }
        return null;
    }

    /**
     * Checks if a metric has been initialized and received at least one update.
     */
    isInitialized(key) {
        const metric = this.metrics.get(key);
        return metric ? metric.initialized : false;
    }
}

// Export a singleton instance for internal KERNEL use
export const Averager = new AveragingManager(0.05); // Default alpha set low for high smoothing (N approx 39)

// --- END: AGI Averaging Manager Graft (TARGET) ---

// --- START: AGI Integrity Scanner Graft ---

/**
 * IntegrityScanner
 * Utility responsible for traversing the filesystem and identifying files that
 * should be included in an integrity manifest, typically filtered by directory or exclusion patterns.
 */
class IntegrityScanner {

    /**
     * Recursively scans a directory and returns a list of paths for files
     * that should be included in the manifest.
     * Paths returned are relative to the provided rootDir.
     * 
     * NOTE: This basic implementation skips symbolic links in directories and offers only basic string inclusion filtering.
     * 
     * @param {string} rootDir The starting directory for the scan.
     * @param {string[]} [ignorePatterns=[]] Optional array of partial path strings (e.g., 'node_modules', '.git') to skip.
     * @returns {Promise<string[]>} List of file paths, relative to rootDir.
     */
    static async scanDirectory(rootDir, ignorePatterns = []) {
        const fullRootPath = path.resolve(rootDir);
        const filesToHash = [];

        async function traverse(currentDir, relativePath) {
            try {
                const entries = await FS_PROMISES.readdir(currentDir, { withFileTypes: true });

                for (const entry of entries) {
                    const entryPath = path.join(currentDir, entry.name);
                    const entryRelativePath = path.join(relativePath, entry.name);

                    // Simple path inclusion check against ignore patterns
                    if (ignorePatterns.some(pattern => entryRelativePath.includes(pattern))) {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        // Standard practice: Skip symbolic links to prevent loop risks
                        if (!entry.isSymbolicLink()) {
                            await traverse(entryPath, entryRelativePath);
                        }
                    } else if (entry.isFile()) {
                        filesToHash.push(entryRelativePath);
                    }
                }
            } catch (e) {
                // If we hit permission issues or read errors, warn and continue traversing.
                console.warn(`Integrity Scanner Warning: Could not read directory ${currentDir}: ${e.message}`);
            }
        }

        // The root relative path is initialized as empty string
        await traverse(fullRootPath, '');
        return filesToHash;
    }
}

export { IntegrityScanner };

// --- END: AGI Integrity Scanner Graft ---

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
                },
                required: ["source", "description"],
                additionalProperties: false
            }
        }
    },
    required: ["system_uuid", "compliance_level_mandate"],
    additionalProperties: false
};

// --- END: Governance Configuration Graft (TARGET) ---

// --- START: AGI Constraint Enforcement Graft (TARGET) ---

export class ConstraintViolationError extends Error {
  constraintType;
  
  constructor(message, constraintType) {
    super(`Constraint violation detected: ${message}`);
    this.name = 'ConstraintViolationError';
    this.constraintType = constraintType;
  }
}

// Defines the optimized lookup structure: Map<"serviceName/methodName", ConstraintDefinition[]>
export class GaxConstraintEnforcer {
  // The enforcer relies on a pre-indexed, strongly typed constraint map.
  indexedConstraints;

  /**
   * Initializes the enforcer with a pre-indexed map of constraints.
   * Indexing logic (inheritance, merging) must occur externally.
   */
  constructor(indexedConstraints) {
    this.indexedConstraints = indexedConstraints;
  }

  /**
   * Retrieves and enforces all relevant constraints for a specific API call.
   */
  enforce(serviceName, methodName, request) {
    const constraints = this.getEffectiveConstraints(serviceName, methodName);

    if (constraints.length === 0) {
      return; 
    }

    for (const constraint of constraints) {
      switch (constraint.type) {
        case 'rate_limit':
          // Implementation requires integrating a stateful rate limiter utility.
          if (!this.checkRateLimit(serviceName, methodName)) {
            throw new ConstraintViolationError('Rate limit exceeded for method call', constraint.type);
          }
          break;
        case 'payload_size':
          const limit = constraint.value;
          // Note: checkPayloadSize returns TRUE if violation occurs.
          if (this.checkPayloadSize(request, limit, constraint.unit)) {
             throw new ConstraintViolationError(`Payload size (${limit} ${constraint.unit || 'bytes'}) exceeded limit`, constraint.type);
          }
          break;
        // Further validation cases (e.g., 'timeout', 'field_pattern') can be added here.
        default:
          console.warn(`[GaxConstraintEnforcer] Skipping unknown constraint type: ${constraint.type}`);
      }
    }
  }

  /**
   * Calculates the effective constraints. O(1) lookup since constraints are pre-indexed by method.
   */
  getEffectiveConstraints(serviceName, methodName) {
    const key = `${serviceName}/${methodName}`;
    return this.indexedConstraints.get(key) || [];
  }

  // --- Stub Implementations for Runtime Checks ---

  checkRateLimit(serviceName, methodName) {
    // TRUE if the call is allowed.
    // Requires external RateLimiter instance injection.
    return true; 
  }
  
  checkPayloadSize(request, limit, unit) {
    // TRUE if the request violates the size limit.
    try {
      // Assuming Buffer is available in this Node-like environment context.
      const bytes = Buffer.byteLength(JSON.stringify(request), 'utf8');
      // TODO: Add unit conversion logic (KB, MB, GB)
      return bytes > limit; 
    } catch (e) {
      // Handle serialization errors gracefully
      return true; // Assume violation if size cannot be determined safely
    }
  }
}

// --- END: AGI Constraint Enforcement Graft (TARGET) ---

// --- START: Core Failure Thresholds Manifest Accessor Graft (TARGET) ---

/**
 * Custom error type for configuration issues related to the CFTM.
 */
class CFTMConfigurationError extends Error {
    constructor(message, key) {
        super(`CFTM Error: ${message}${key ? ` (Key: ${key})` : ''}`);
        this.name = 'CFTMConfigurationError';
        this.key = key;
    }
}

/**
 * CFTMAccessor (Core Failure Thresholds Manifest Accessor)
 * Implements strict, read-only access to immutable governance constants.
 * Pre-processes the config to ensure type-safe, optimized constant access.
 */
class CFTMAccessor {
    /**
     * @param {object} cftmConfig - The configuration object, expected to contain cftmConfig.thresholds.
     */
    constructor(cftmConfig) {
        if (!cftmConfig || !cftmConfig.thresholds) {
            throw new CFTMConfigurationError("Missing or invalid 'thresholds' configuration object.");
        }

        const processedThresholds = {};
        const rawThresholds = cftmConfig.thresholds;

        // Phase 1: Pre-process, validate structure, and flatten thresholds map.
        for (const key in rawThresholds) {
            if (Object.prototype.hasOwnProperty.call(rawThresholds, key)) {
                const constant = rawThresholds[key];
                
                // Enforce structure: Must be an object with a numerical 'value' property.
                if (constant === null || typeof constant !== 'object' || typeof constant.value !== 'number' || isNaN(constant.value)) {
                    throw new CFTMConfigurationError(
                        `Malformed constant entry. Expected { value: number, ... }, received invalid structure or non-finite number.`,
                        key
                    );
                }
                
                // Flatten the structure for direct numerical access efficiency
                processedThresholds[key] = constant.value;
            }
        }

        // Phase 2: Freeze the optimized, flattened map to enforce immutability.
        this.thresholds = Object.freeze(processedThresholds);
    }

    /**
     * @param {string} key - The constant identifier.
     * @returns {number} The immutable numerical value.
     * @throws {CFTMConfigurationError} If the constant is not defined.
     */
    getThreshold(key) {
        const value = this.thresholds[key];
        
        if (value === undefined) {
            // All structure/type checks were performed in the constructor, we only check for key existence here.
            throw new CFTMConfigurationError(`Constant key not found.`, key);
        }
        
        return value;
    }

    /**
     * Specialized accessor for Stability Tau (for GAX-S-02.1).
     * @returns {number}
     */
    getStabilityTau() {
        return this.getThreshold('DENOMINATOR_STABILITY_TAU');
    }

    /**
     * Specialized accessor for Efficacy Safety Margin (for GAX-P-01.2).
     * @returns {number}
     */
    getEfficacySafetyMargin() {
        return this.getThreshold('MINIMUM_EFFICACY_SAFETY_MARGIN_EPSILON');
    }
}

// Export the components for use by the KERNEL loader
export { CFTMAccessor, CFTMConfigurationError };

// --- END: Core Failure Thresholds Manifest Accessor Graft (TARGET) ---