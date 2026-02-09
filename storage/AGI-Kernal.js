/** AGI-KERNAL RECOVERY v6.9.6 **/
const os = require('os');
const KERNEL_SYNC_FS = require('fs');
import FS_PROMISES from 'fs/promises';
import path from 'path';

// --- START: Minimal Logger Graft ---

/**
 * Minimal Logger implementation to satisfy SpecificationLoader dependency.
 * Uses standard console logging with context and basic ANSI colors.
 */
class Logger {
    constructor(context = 'AGI-KERNAL') {
        this.context = context;
    }
    _log(level, message, color = '\x1b[0m') {
        const timestamp = new Date().toISOString();
        // Use console.log for all levels to ensure output, relying on color for distinction
        console.log(`${color}[${timestamp}] [${this.context}] [${level}] ${message}\x1b[0m`);
    }
    info(message) { this._log('INFO', message, '\x1b[34m'); } // Blue
    warn(message) { this._log('WARN', message, '\x1b[33m'); } // Yellow
    fatal(message) { this._log('FATAL', message, '\x1b[31m'); } // Red
    success(message) { this._log('SUCCESS', message, '\x1b[32m'); } // Green
}

// --- END: Minimal Logger Graft ---

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

// --- START: AGI External API Metric Handler Graft ---

/**
 * ExternalApiMetricHandler
 * Specific handler implementation for fetching metrics via external REST APIs.
 * Implements the required execute(template) interface for MetricEngineCollector.
 */
class ExternalApiMetricHandler {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Executes the metric collection based on the template source configuration.
     * @param {object} template - The metric definition template containing source_config.
     * @returns {Promise<any>} The raw value returned by the external API.
     */
    async execute(template) {
        if (!template.source_config) {
            throw new Error("API Metric handler requires 'source_config' in the template.");
        }
        
        // The internal apiClient handles network, authentication, and structured error propagation.
        return this.apiClient.fetch(template.source_config);
    }
}

export { ExternalApiMetricHandler };

// --- END: AGI External API Metric Handler Graft ---

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

// --- START: AGI Specification Loader Graft ---

const DEFAULT_SPEC_PATH = path.resolve(process.cwd(), 'config/XEL_Specification.json');

/**
 * Specification Loader Service (Async): Manages the loading, parsing, and version control 
 * of XEL Specifications.
 * 
 * Decouples I/O from component execution via asynchronous loading and uses explicit 
 * initialization.
 */
class SpecificationLoader {
    /**
     * @param {{ specPath?: string }} config Configuration object.
     */
    constructor(config = {}) {
        this.specPath = config.specPath || DEFAULT_SPEC_PATH;
        this.specification = null;
        this.logger = new Logger('SpecificationLoader');
        this.isLoaded = false;
    }

    /**
     * Initializes the loader by asynchronously reading and parsing the specification file.
     * Must be awaited by the system bootstrapping process.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isLoaded) {
            this.logger.warn("Attempted multiple initialization calls.");
            return;
        }

        this.logger.info(`Attempting to load specification from: ${this.specPath}`);
        
        try {
            const data = await FS_PROMISES.readFile(this.specPath, 'utf8');
            this.specification = JSON.parse(data);
            this.isLoaded = true;
            this.logger.success("XEL Specification loaded successfully.");
        } catch (error) {
            this.logger.fatal(`Failed to load XEL Specification: ${error.message}. Using fallback structure.`);
            // Ensure robustness: Provide a safe, minimal fallback structure
            this.specification = { ComponentSchemas: {} };
            this.isLoaded = true; // Mark as loaded, even if with fallback
            throw new Error(`SPEC_LOAD_FAILURE: Initialization failed: ${error.message}`); 
        }
    }

    /**
     * Retrieves the complete specification object (deep cloned for safety).
     * @returns {object}
     */
    getSpecification() {
        if (!this.isLoaded) {
            throw new Error("Specifications not initialized. Call initialize() first.");
        }
        // Return a clone to protect the internal state from mutation
        return JSON.parse(JSON.stringify(this.specification)); 
    }

    /**
     * Retrieves the Component Schemas section of the specification.
     * @returns {object}
     */
    getComponentSchemas() {
        const spec = this.getSpecification(); 
        if (!spec.ComponentSchemas) {
             throw new Error("Specifications initialized but ComponentSchemas structure is missing.");
        }
        return spec.ComponentSchemas;
    }

    // FUTURE: Implement checkSpecificationVersion(v), hotReload(newPath), validateSelf()...
}

// Export the class definition for external lifecycle management (initiation and awaiting).
export { SpecificationLoader };

// --- END: AGI Specification Loader Graft ---

// --- START: AGI Utility Efficacy Monitor Graft ---

/**
 * UtilityEfficacyMonitor
 * Monitors operational metrics against defined thresholds and initiates policy actions
 * (escalation, failover) upon violation.
 */
class UtilityEfficacyMonitor {
  constructor(specConfigPath) {
    // Uses synchronous require as per TARGET specification, assuming configuration is local.
    this.config = require(specConfigPath);
    this.runtimeMetrics = {}; // Data store for live operational metrics
    console.log(`Efficacy Monitor v94.1 initialized.`)
  }

  /**
   * Checks current operational metrics against utility-specific compliance specifications.
   * @param {string} domain The operational domain (e.g., 'network', 'storage').
   * @param {string} utilityId The ID of the utility being monitored.
   * @param {object} currentMetrics Key-value pairs of live metric data.
   */
  async checkUtilityCompliance(domain, utilityId, currentMetrics) {
    const domainConfig = this.config.operational_domains[domain];
    if (!domainConfig) return;

    const utilitySpec = domainConfig.utilities[utilityId];
    if (!utilitySpec) return;

    for (const metricSpec of utilitySpec.metrics) {
      const currentValue = currentMetrics[metricSpec.name];
      let violation = false;

      // [Detailed comparator logic here]
      if (metricSpec.comparator === 'LESS_THAN' && currentValue >= metricSpec.threshold) {
        violation = true;
      }
      // ... other comparators ...

      if (violation) {
        const policyId = metricSpec.failure_policy_id || this.config.default_policy_id;
        this.escalateViolation(utilityId, metricSpec.name, policyId, currentValue);
        
        if (utilitySpec.failover && utilitySpec.failover.enabled) {
          this.initiateFailover(utilitySpec.failover.target_utility_id);
        }
      }
    }
  }

  /**
   * Stub: Handles policy violation reporting and logging.
   */
  escalateViolation(utilityId, metricName, policyId, value) {
    console.warn(`[Efficacy Monitor] VIOLATION detected for ${utilityId}/${metricName}. Policy: ${policyId}. Value: ${value}`);
  }

  /**
   * Stub: Triggers the switch to a designated failover utility.
   */
  initiateFailover(targetUtilityId) {
    console.error(`[Efficacy Monitor] Initiating failover to utility: ${targetUtilityId}`);
  }
}

export { UtilityEfficacyMonitor };

// --- END: AGI Utility Efficacy Monitor Graft ---

// --- START: AGI Secure Configuration Resolver Graft (TARGET) ---

/**
 * SecureConfigurationResolver
 * Role: Asynchronously loads, validates, and resolves critical, secure configuration files
 * (e.g., governance policies, security manifests) from the filesystem.
 *
 * Optimization applied: Improved error handling, streamlined resolve method, enhanced readability.
 */
class SecureConfigurationResolver {
    constructor() {
        // Enhanced readability: Use a dedicated logger instance
        this.logger = new Logger('SecureConfigResolver');
    }

    /**
     * Streamlined method to asynchronously read, parse, and resolve a configuration file.
     *
     * @param {string} configName The base name of the configuration file (e.g., 'governance').
     * @param {string} [extension='.json'] The expected file extension.
     * @returns {Promise<object>} The parsed configuration object.
     * @throws {Error} If the file cannot be read, parsed, or is invalid.
     */
    async resolve(configName, extension = '.json') {
        // Streamlined path resolution using the global Config service
        const fullPath = Config.getConfigPath(configName, extension);
        this.logger.info(`Attempting to resolve secure configuration: ${configName} at ${fullPath}`);

        try {
            // 1. Read the file content
            const rawData = await FS_PROMISES.readFile(fullPath, 'utf8');

            // 2. Parse the content (assuming JSON for standard AGI configs)
            const configObject = JSON.parse(rawData);

            // 3. Basic structural check
            if (typeof configObject !== 'object' || configObject === null) {
                throw new Error("Configuration file content is not a valid JSON object.");
            }

            this.logger.success(`Configuration '${configName}' resolved successfully.`);
            return configObject;

        } catch (error) {
            // Improved Error Handling: Distinguish between file system errors and parsing errors.
            let errorMessage;

            if (error.code === 'ENOENT') {
                errorMessage = `File not found: ${fullPath}. Critical configuration missing.`;
            } else if (error instanceof SyntaxError) {
                errorMessage = `Parsing Error in ${configName}: Invalid JSON format. ${error.message}`;
            } else {
                errorMessage = `Resolution failed for ${configName}: ${error.message}`;
            }

            this.logger.fatal(errorMessage);
            // Re-throw a standardized error for upstream handling
            throw new Error(`SecureConfigResolutionError: ${errorMessage}`);
        }
    }
}

export const SecureConfigResolver = new SecureConfigurationResolver();

// --- END: AGI Secure Configuration Resolver Graft (TARGET) ---

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
 * Configuration file for Governance Invariants (M-02, P-01).
 * Defines structural compliance rules, invariant limits, and associated penalties.
 */
export const GOVERNANCE_INVARIANTS_M02_P01 = {
    // Defines system-wide invariant limits that mutations must adhere to.
    invariants: {
        MAX_MUTATION_SIZE_KB: 128, // Hard limit on proposed code size (low-latency check)
        MAX_DEPENDENCY_INJECTIONS: 5, // Limit on new external dependencies proposed
        REQUIRED_TEST_COVERAGE_SIGNAL: 0.15 // Minimum static signal required (not full execution)
    },

    // Defines the compliance checks, failure messages, and R_INDEX penalty weights.
    rules: {
        'DEPENDENCY_INTEGRITY': {
            failureMessage: "Failed dependency resolution or module integrity check.",
            penaltyWeight: 0.35
        },
        'RESOURCE_LIMITS': {
            failureMessage: "Exceeded system resource invariants (e.g., size or injection limits).",
            penaltyWeight: 0.40
        },
        'GHM_SIGNAL': {
            failureMessage: "Missing or invalid GHM Operational Readiness Signal (GRS) linkage.",
            penaltyWeight: 0.10
        },
        'SCHEMA_VALIDITY': {
            failureMessage: "Mutation payload failed configuration schema validation.",
            penaltyWeight: 0.20
        }
    },

    // Defines overall pass/fail thresholds for M-02 and subsequent stages.
    thresholds: {
        pass: 0.70 // M-02 R_INDEX minimum required to proceed to Trust Calculus (P-01)
    }
};

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
                    description: { type: "string", minLength: 10, pattern: "^[A-Z].*" }
                },
                required: ["source", "description"],
                additionalProperties: false
            }
        }
    },
    required: ["system_uuid", "compliance_level_mandate"],
    additionalProperties: true
};