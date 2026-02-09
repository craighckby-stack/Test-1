const os = require('os');
const fs = require('fs');

// --- Grafted Type Definitions for GRCS Verification (GRCS_VerificationTypes) ---
type LiabilityUnit = 'USD' | 'PPR' | 'N/A';

interface FailureProfile {
    S02_Value: number;
    S02_Tolerance: number;
    LiabilityUnit: LiabilityUnit;
}

interface CertifiedUtilityMetrics {
    MetricsSetID: string;
    CRoT_Signature: string;
    // ... other metrics
}

interface GRCSReport {
    PolicyReference: string;
    CertifiedUtilityMetrics: CertifiedUtilityMetrics;
    EstimatedFailureProfile: FailureProfile;
}

interface VerifierConfiguration {
    standardRiskCeiling: number; // in LiabilityUnit
}

interface AuditTrailEntry {
    step: string;
    success: boolean;
    reason: string;
    details?: any;
}

interface VerificationResult {
    passed: boolean;
    auditTrail: AuditTrailEntry[];
}

// --- ACVD Integrity Dependencies (TARGET Integration) ---

// Define concrete implementation for HashService (required by ACVD_IntegrityValidator)
class HashService {
    calculateSHA256(data) {
        // Deterministic mock hashing for context verification
        const dataString = typeof data === 'object' ? JSON.stringify(data).length.toString() : String(data).length.toString();
        return `MOCK_SHA256_CONTEXT_${dataString}`;
    }

    async hashFile(filePath) {
        // Mock asynchronous file hashing based on file path length
        await new Promise(resolve => setTimeout(resolve, 10)); 
        if (filePath.includes('missing_file')) {
            throw new Error(`File not found: ${filePath}`);
        }
        return `MOCK_SHA256_FILE_${filePath.length}`;
    }
}
const hashServiceInstance = new HashService();

// Define concrete implementation for SchemaValidator (required by ACVD_IntegrityValidator)
class SchemaValidator {
    validate(acvdRecord, acvdSchema) {
        // Simplified mock validation for ACVD structure check
        const errors = [];
        let valid = true;

        if (typeof acvdRecord !== 'object' || acvdRecord === null) {
            errors.push({ dataPath: 'Root', message: 'Input must be an object' });
            valid = false;
        }

        // Basic check for required fields based on ACVD_SCHEMA context
        if (acvdSchema && acvdSchema.required) {
             acvdSchema.required.forEach(field => {
                if (!acvdRecord || !Object.prototype.hasOwnProperty.call(acvdRecord, field)) {
                    errors.push({ dataPath: field, message: `Missing required property: ${field}` });
                    valid = false;
                }
            });
        }

        return { valid, errors };
    }
}
const schemaValidatorInstance = new SchemaValidator();

const ACVD_SCHEMA = {
    type: 'object',
    properties: {
        context_hash: { type: 'string' },
        artifact_changes: { type: 'array' }
    },
    required: ['context_hash', 'artifact_changes']
};

// --- Mock System Utilities for DCM Scheduler (TARGET Dependencies) ---
const MockRateLimiter = {
    check: (key) => {
        // Mock: Always allow unless key is 'CRITICAL_ACTION_LIMIT'
        return key !== 'CRITICAL_ACTION_LIMIT';
    }
};

const MockTaskQueue = {
    enqueue: async (task) => {
        // Mock: Simulate queueing
        // console.log(`[DCM_Scheduler] Enqueued task: ${task.actionKey}`);
        return true;
    }
};

// Alias the formal SchemaValidator instance for compatibility with existing KERNEL code
const MockSchemaValidator = schemaValidatorInstance;

// Define global scope utilities access point (as required by TARGET code)
const global = {
    SystemUtilities: {
        RateLimiter: MockRateLimiter,
        TaskQueue: MockTaskQueue,
        SchemaValidator: MockSchemaValidator
    }
};

// Mock Handler Execution (Used by SYNCHRONOUS type)
const MockActionHandlers = {
    './handlers/CoreUpdateHandler.js': {
        execute: async (payload, context) => {
            // console.log(`[DCM_Handler] Executing CoreUpdate with payload: ${JSON.stringify(payload)}`);
            return { result: 'Core Update Successful', data: payload, context };
        }
    },
    './handlers/TelemetryPublish.js': {
        execute: async (payload, context) => {
            // console.log(`[DCM_Handler] Executing Telemetry Publish`);
            return { result: 'Telemetry Published', count: payload.metrics ? payload.metrics.length : 0 };
        }
    }
};

// Mock Action Registry (DCM_Action_Registry)
const MockActionRegistry = {
    actions: {
        'CORE_UPDATE_SYSTEM': {
            description: "Synchronous critical core code update.",
            execution_type: 'SYNCHRONOUS',
            rate_limit_key: 'critical_core_op',
            handler_path: './handlers/CoreUpdateHandler.js',
            schema: { input: { type: 'object', required: true } }
        },
        'PUBLISH_TELEMETRY': {
            description: "Asynchronous standard telemetry publishing.",
            execution_type: 'ASYNCHRONOUS',
            rate_limit_key: 'telemetry_burst',
            handler_path: './handlers/TelemetryPublish.js',
            schema: { input: { metrics: { type: 'array', required: true } } },
            retry_policy: { attempts: 3, delay: 1000 }
        }
    }
};


// === TARGET INTEGRATION: Codebase Accessor (AGI-C-06) ===

/**
 * @fileoverview Central interface for all AGI filesystem and codebase interaction.
 * This abstracts away Node.js 'fs' dependencies and centralizes codebase checks,
 * allowing the core logic to remain platform-agnostic and testable (AGI-C-06).
 */
export class CodebaseAccessor {

    /**
     * Checks if a file or directory exists at the given path within the codebase scope.
     * This should eventually be connected to an in-memory representation for speed.
     * @param {string} filePath The absolute or project-relative path to check.
     * @returns {boolean} True if the file exists.
     */
    static fileExists(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return false;
        }
        try {
            // TODO: Replace direct fs access with cached codebase state lookup
            return fs.existsSync(filePath);
        } catch (error) {
            // Logging unexpected error during file check is critical
            console.error(`[CodebaseAccessor] Failed to check existence of ${filePath}:`, error);
            return false;
        }
    }

    // Future extensions should include: readFile, writeFile, updateCodebaseMap, etc.
}

// --- MEE Graft: ClampingUtility (TARGET Integration) ---

/**
 * ClampingUtility: Provides immutable mathematical utilities for value constraint adherence.
 */
class ClampingUtility {
    /**
     * Ensures a value is strictly within a specified minimum and maximum boundary.
     * @param {number} value - The input value.
     * @param {number} min - The lower bound (inclusive).
     * @param {number} max - The upper bound (inclusive).
     * @returns {number} The clamped value.
     */
    static clamp(value, min, max) {
        if (typeof value !== 'number') {
            throw new TypeError("Clamping input must be a number.");
        }
        return Math.max(min, Math.min(max, value));
    }
}

AGI-KERNAL-SIGNATURE-V6-9
import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Activity, ShieldCheck, Zap, ScanText, AlertTriangle, KeyRound, Globe, Lock, ThermometerSnowflake, Binary, Cpu, GitMerge, Gauge } from 'lucide-react';

/**
 * AGI-KERNAL v6.9 - "MEE_INTEGRATION"
 * FIX: Implements MEE Metric Evaluation Framework and Governance Adapter.
 * MISSION: Merge Target logic INTO Kernel logic without deletion.
 */

// --- Firebase Initialization (Required for Kernel Operation) ---
const firebaseConfig = {
    apiKey: "MOCK_API_KEY",
    authDomain: "mock-domain.firebaseapp.com",
    projectId: "mock-project-id",
    storageBucket: "mock-storage.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:234567890:web:abcdefghijk"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// --- TARGET INTEGRATION: GAX Event Registry (Telemetry Standard) ---
/**
 * Standardized Event Names for the GAX Telemetry Service (Global Autonomous X-System).
 * Structure: NAMESPACE:SUBDOMAIN:ACTION
 */
const GAXEventRegistry = Object.freeze({
    // System Lifecycle (SYS)
    SYS_INIT_START: 'SYS:INIT:START',
    SYS_INIT_COMPLETE: 'SYS:INIT:COMPLETE',
    SYS_EXECUTION_START: 'SYS:EXECUTION:START',
    SYS_EXECUTION_END: 'SYS:EXECUTION:END',
    SYS_SHUTDOWN: 'SYS:SHUTDOWN',

    // Policy & Verification (PV)
    PV_REQUEST_INITIATED: 'PV:REQUEST:INITIATED',
    PV_RULE_CHECK_SUCCESS: 'PV:RULE:CHECK:SUCCESS',
    PV_RULE_CHECK_FAILURE: 'PV:RULE:CHECK:FAILURE',
    PV_ACCESS_DENIED: 'PV:ACCESS:DENIED',

    // Autonomous Evolution (AXIOM)
    AXIOM_GENERATION_START: 'AXIOM:GENERATION:START',
    AXIOM_EVOLUTION_STEP_PERFORMED: 'AXIOM:EVOLUTION:STEP_PERFORMED',
    AXIOM_CODE_COMMITTED: 'AXIOM:CODE:COMMITTED',
    AXIOM_CODE_REVERTED: 'AXIOM:CODE:REVERTED',
    AXIOM_TEST_RUN_SUCCESS: 'AXIOM:TEST:RUN_SUCCESS',
    AXIOM_TEST_RUN_FAILURE: 'AXIOM:TEST:RUN_FAILURE',

    // Planning and Context Management (PLAN)
    PLAN_GOAL_DEFINED: 'PLAN:GOAL:DEFINED',
    PLAN_STEP_GENERATED: 'PLAN:STEP:GENERATED',
    PLAN_STEP_COMPLETED: 'PLAN:STEP:COMPLETED',
    PLAN_CONTEXT_RETRIEVAL_START: 'PLAN:CONTEXT:RETRIEVAL_START',
    PLAN_CONTEXT_RETRIEVAL_COMPLETE: 'PLAN:CONTEXT:RETRIEVAL_COMPLETE',

    // External API Interaction (API)
    API_REQUEST_SENT: 'API:EXTERNAL:REQUEST_SENT',
    API_RESPONSE_RECEIVED: 'API:EXTERNAL:RESPONSE_RECEIVED',
    API_RATE_LIMIT_HIT: 'API:EXTERNAL:RATE_LIMIT_HIT',

    // Data/Context Storage (DATA)
    DATA_CACHE_HIT: 'DATA:CACHE:HIT',
    DATA_CACHE_MISS: 'DATA:CACHE:MISS',
    DATA_STORAGE_WRITE_FAILURE: 'DATA:STORAGE:WRITE_FAILURE',

    // System Diagnostics, Errors, and Warnings (DIAG)
    DIAG_CONFIGURATION_FAULT: 'DIAG:CONFIGURATION:FAULT',
    DIAG_CONTEXT_RESOLUTION_MISSING: 'DIAG:CONTEXT:RESOLUTION_MISSING',
    DIAG_COMPONENT_FATAL_ERROR: 'DIAG:COMPONENT:FATAL_ERROR',
    DIAG_WARNING_THRESHOLD_EXCEEDED: 'DIAG:WARNING:THRESHOLD_EXCEEDED',

    // Telemetry Infrastructure (TEL)
    TEL_PUBLISH_SUCCESS: 'TEL:PUBLISH:SUCCESS',
    TEL_PUBLISH_FAILURE: 'TEL:PUBLISH:FAILURE',
    TEL_DATA_DROPPED: 'TEL:DATA:DROPPED'
});

// --- TARGET INTEGRATION: ICachePersistence Interface ---
/**
 * @typedef {object} PersistenceGetResult
 * @property {any} value - The data value stored.
 * @property {number} expiry - Unix timestamp in milliseconds for expiration.
 */

/**
 * ICachePersistence Interface (v94.1)
 * Defines the required structure for any pluggable cache backend (in-memory, Redis, DB).
 * Implementing this allows the TrustCacheManager to abstract storage details, making
 * the consensus module scalable and fault-tolerant in a cluster environment.
 * All methods must be asynchronous and return Promises.
 */
class ICachePersistence {
    
    /**
     * Retrieves a cache entry based on a key.
     * @param {string} key - The unique cache key.
     * @returns {Promise<PersistenceGetResult|null>} Returns the value and original expiration timestamp, or null if missing.
     */
    async get(key) {
        throw new Error('ICachePersistence method `get` must be implemented by subclass.');
    }

    /**
     * Stores a value with a specified Time-To-Live (TTL).
     * @param {string} key - The unique cache key.
     * @param {any} value - The data value to store (often serialized).
     * @param {number} ttlMs - Total lifespan in milliseconds.
     * @returns {Promise<void>}
     */
    async set(key, value, ttlMs) {
        throw new Error('ICachePersistence method `set` must be implemented by subclass.');
    }

    /**
     * Deletes an entry from the cache.
     * @param {string} key - The unique cache key.
     * @returns {Promise<boolean>} True if the key was deleted, false otherwise.
     */
    async delete(key) {
        throw new Error('ICachePersistence method `delete` must be implemented by subclass.');
    }
    
    /**
     * Connects and initializes the underlying persistence system.
     * @returns {Promise<void>}
     */
    async connect() {
         // Default no-op for systems that don't require explicit connection.
    }
    
    /**
     * Shuts down or disconnects resources cleanly.
     * @returns {Promise<void>}
     */
    async disconnect() {
         // Default no-op.
    }
}

// --- TARGET INTEGRATION: SystemLoadSensor (MEE Metric Source) ---

/**
 * A concrete example of a sensor component adhering to the Hub's expected interface.
 * Measures CPU load and memory usage.
 */
class SystemLoadSensor {
    constructor() {
        this.name = 'SystemLoadSensor';
    }

    /**
     * Gathers OS-level load metrics.
     * @returns {Promise<Object>} Map of collected telemetry keys and values.
     */
    async run() {
        // Note: Real implementations might involve external calls or heavier processing.
        await new Promise(resolve => setTimeout(resolve, 5)); 

        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();
        const usedMemory = totalMemory - freeMemory;

        return {
            osCpuLoad1m: os.loadavg()[0], // 1 minute load average
            osMemoryUsagePercent: parseFloat((usedMemory / totalMemory).toFixed(4)),
            osTotalMemoryBytes: totalMemory
        };
    }
}

const systemLoadSensorInstance = new SystemLoadSensor(); 

// --- TARGET INTEGRATION: MEE/Integrity Dependencies ---

// Define INTEGRITY_CONSTANTS required by IntegrityUtils class
const INTEGRITY_CONSTANTS = {
    REGEX: {
        // Standard SHA-512 Hash (128 hex characters)
        SHA512: /^[0-9a-fA-F]{128}$/
    },
    METRIC_TYPES: {
        LOAD: 'SystemLoad',
        MEMORY: 'MemoryUsage',
        CUSTOM: 'CustomMetric'
    }
};

// --- TARGET INTEGRATION: MEE/Averaging Engine Components ---

/**
 * Base class for all metric averagers.
 * Ensures a common interface for value submission and retrieval.
 */
class BaseAverager {
    constructor(name) {
        this.name = name;
        this.values = [];
    }

    submit(value) {
        if (typeof value === 'number') {
            this.values.push(value);
        } else {
            console.warn(`[${this.name}] Invalid value submitted:`, value);
        }
    }

    calculate() {
        if (this.values.length === 0) return 0;
        const sum = this.values.reduce((a, b) => a + b, 0);
        return sum / this.values.length;
    }

    reset() {
        this.values = [];
    }
}

/**
 * Default implementation using simple arithmetic mean.
 */
class DefaultAverager extends BaseAverager {
    constructor(metricName) {
        super(`DefaultAverager:${metricName}`);
    }
}

/**
 * Specialized averager for metrics expected to be close to 1 (like usage percentages).
 */
class UsagePercentageAverager extends BaseAverager {
    constructor(metricName) {
        super(`UsageAverager:${metricName}`);
    }
}

/**
 * Optimized and recursively abstracted AveragerFactory class.
 * Manages the registry of metric type strings to their respective Averager implementation classes.
 */
class AveragerFactory {
    constructor() {
        // Maps metric type string keys to their Averager class implementations
        this.registry = new Map();
        this._initializeDefaultTypes();
    }

    /**
     * Registers default metric types and their corresponding averager classes.
     */
    _initializeDefaultTypes() {
        this.registerType(INTEGRITY_CONSTANTS.METRIC_TYPES.LOAD, UsagePercentageAverager);
        this.registerType(INTEGRITY_CONSTANTS.METRIC_TYPES.MEMORY, UsagePercentageAverager);
        this.registerType('default', DefaultAverager);
    }

    /**
     * Registers a new metric type and its associated Averager class.
     * @param {string} metricType - The identifier string (e.g., 'SystemLoad').
     * @param {class} AveragerClass - The class constructor (must extend BaseAverager).
     */
    registerType(metricType, AveragerClass) {
        if (!(AveragerClass && AveragerClass.prototype instanceof BaseAverager)) {
            console.error(`[AveragerFactory] Class must extend BaseAverager or be a valid class: ${metricType}`);
            return;
        }
        if (this.registry.has(metricType)) {
            // Warning suppressed for clean output, but structure preserved.
        }
        this.registry.set(metricType, AveragerClass);
    }

    /**
     * Creates a new instance of the appropriate Averager based on the metric type.
     * Falls back to 'default' if the type is not found.
     * @param {string} metricType - The identifier string.
     * @param {string} instanceName - The specific name for the metric instance (e.g., 'cpu_1m_avg').
     * @returns {BaseAverager} An instance of the registered averager class.
     */
    create(metricType, instanceName) {
        let AveragerClass = this.registry.get(metricType);

        if (!AveragerClass) {
            console.warn(`[AveragerFactory] Metric type '${metricType}' not found. Using 'default' averager.`);
            AveragerClass = this.registry.get('default');
        }

        return new AveragerClass(instanceName);
    }

    /**
     * Retrieves the list of currently registered metric type strings.
     * @returns {string[]} Array of registered metric type keys.
     */
    getRegisteredTypes() {
        return Array.from(this.registry.keys());
    }
}

// Global instance of the factory, accessible by the Kernel's state management loop.
const MEE_AveragerFactory = new AveragerFactory();

// --- TARGET INTEGRATION: Conceptual Policy Evaluation Layer ---

/**
 * @fileoverview ConceptualPolicyEvaluator
 * Executes complex, concept-specific validation policies defined within the Concept Registry.
 * It dynamically dispatches execution requests to specific Policy Handlers registered 
 * in the ConceptualPolicyRegistry based on the constraint type, preventing monolithic logic.
 */

/** 
 * STUB: Conceptual Policy Registry. Defines handlers for policy types. 
 * In a full system, this would be imported from './ConceptualPolicyRegistry.js'.
 */
const ConceptualPolicyRegistry = {
    // Example Handler: Checks if a numeric metric exceeds a threshold.
    'thresholdCheck': (constraint, context) => {
        const value = context[constraint.metricKey];
        if (typeof value === 'number' && value > constraint.max) {
             return {
                ruleId: constraint.id || 'GOV-003',
                detail: `Metric ${constraint.metricKey} (${value.toFixed(4)}) exceeded max threshold of ${constraint.max}.`,
                severity: constraint.severity || 'HIGH'
            };
        }
        return null;
    }
    // Add other policy handlers as needed for a real system
};

/**
 * Executes a single conceptual constraint by looking up the appropriate handler.
 * @typedef {{ruleId: string, detail: string, severity: string}} Violation
 * @param {Object} constraint The policy definition.
 * @param {Object} context The operational context.
 * @returns {Violation | null} The violation object if triggered, or null.
 */
function executeConstraint(constraint, context) {
    const policyType = constraint.type;
    
    // Look up the dedicated handler function from the registry
    const handler = ConceptualPolicyRegistry[policyType];

    if (!handler) {
        console.warn(`[Policy Evaluator] Unknown constraint type encountered: ${policyType}. Skipping.`);
        return {
            ruleId: 'EVAL-001',
            detail: `Unknown constraint type '${policyType}' detected during evaluation.`,
            severity: 'WARNING'
        };
    }

    try {
        // Handlers return the violation object or null if compliant.
        const result = handler(constraint, context);
        return result || null;

    } catch (e) {
        console.error(`[Policy Evaluator] Error executing constraint ${constraint.id || policyType}:`, e);
        return {
            ruleId: 'EVAL-002',
            detail: `Runtime error during execution of constraint ${constraint.id || policyType}: ${e.message}`,
            severity: 'CRITICAL'
        };
    }
}


export const ConceptualPolicyEvaluator = {

    /**
     * Executes all defined constraints and policies for a given concept against the current context.
     * @param {Object} concept The conceptual definition object (from ConceptRegistry).
     * @param {Object} context The operational context (e.g., file path, diff content, metadata).
     * @returns {{isValid: boolean, violations: Array<Violation>}}
     */
    executePolicies(concept, context) {
        let violations = [];

        // Execution logic is now purely declarative dispatch.
        if (concept.constraints && Array.isArray(concept.constraints)) {
            for (const constraint of concept.constraints) {
                const violation = executeConstraint(constraint, context);
                if (violation) {
                    violations.push(violation);
                }
            }
        }

        // Potential integration point for broader systemic checks:
        // const systemicViolations = executeSystemicPolicies(concept, context);
        // violations = violations.concat(systemicViolations);

        return {
            isValid: violations.length === 0,
            violations: violations
        };
    }
};

// --- TARGET INTEGRATION: Artifact Validation Dependencies (Grafted Feature) ---

/**
 * STUB: Schema Registry defining expected structures and crypto constraints for artifacts.
 */
const SchemaRegistry = {
    artifact_definitions: {
        // Example definition for a Protected Mutable Health (PMH) Lock V1 artifact
        'PMH_LOCK_V1': {
            schema: {
                lock_id: { required: true, type: 'string' },
                timestamp: { required: true, type: 'TIMESTAMP_ISO8601' },
                payload_hash: { required: true, type: 'HASH_SHA256' },
                signature_a: { required: true, type: 'string' },
                signer_key_id: { required: true, type: 'string' },
                merkle_root: { required: true, type: 'string' }
            },
            cryptographic_requirements: {
                signed_fields: ['lock_id', 'timestamp', 'payload_hash'],
                signing_authorities: [{
                    key_identifier_field: 'signer_key_id',
                    signature_field: 'signature_a',
                    authority_name: 'Core_AGI_Authority'
                }],
                integrity: {
                    algorithm: 'MERKLE_SHA256',
                    target_fields: ['payload_hash'],
                    root_field: 'merkle_root'
                }
            }
        },
        'GENERIC_TELEMETRY_V1': {
            schema: { telemetry_data: { required: true, type: 'object' } },
            cryptographic_requirements: null
        }
    }
};

/**
 * STUB: Service for cryptographic operations (hashes, signatures, Merkle trees).
 */
class CryptoService {
    async verifySignature(data, signature, keyId, authorityName) {
        // Mock verification: True unless explicit failure condition met
        if (data.includes("INVALID_SIGNATURE_PAYLOAD")) return false;
        await new Promise(resolve => setTimeout(resolve, 1));
        return true;
    }

    async calculateMerkleRoot(leavesData, algorithm) {
        // Mock deterministic root generation
        // The hash ensures deterministic mocking based on leaf content for successful validation.
        const hash = leavesData.map(d => String(d).length).join('-');
        return `MOCK_ROOT_${algorithm}_${hash}`;
    }
}
const cryptoServiceInstance = new CryptoService();

/**
 * STUB: Utility for specialized type/format checks (e.g., ISO8601, specific hash formats).
 */
class ConstraintUtility {
    validateField(field, value, constraints) {
        if (constraints.type === 'string' && typeof value !== 'string') {
            throw new Error(`Type mismatch for field ${field}: expected string.`);
        }
        if (constraints.type === 'object' && typeof value !== 'object') {
             throw new Error(`Type mismatch for field ${field}: expected object.`);
        }
        if (constraints.type === 'TIMESTAMP_ISO8601') {
            if (typeof value !== 'string' || isNaN(Date.parse(value))) {
                throw new Error(`Format mismatch for field ${field}: not ISO8601.`);
            }
        }
        // Simplified HASH_SHA256 check
        if (constraints.type === 'HASH_SHA256' && (typeof value !== 'string' || value.length < 10)) {
             throw new Error(`Format mismatch for field ${field}: invalid hash format.`);
        }
        return true;
    }
}
const constraintUtilityInstance = new ConstraintUtility();


/**
 * ArtifactValidatorService - Ensures adherence to defined artifact schemas and cryptographic constraints.
 * Ingests artifact payload and schema definition to perform verification. (Grafted TARGET Logic)
 */
class ArtifactValidatorService {

    /**
     * @param {object} schemaRegistry - The configuration object defining artifact schemas.
     * @param {object} cryptoService - Dependency for cryptographic operations (signatures, hashes, merkle).
     * @param {object} constraintUtility - Utility for specialized type/format checks.
     */
    constructor(schemaRegistry, cryptoService, constraintUtility) {
        if (!schemaRegistry || !cryptoService || !constraintUtility) {
            throw new Error("ArtifactValidatorService requires schemaRegistry, cryptoService, and constraintUtility dependencies.");
        }
        this.registry = schemaRegistry;
        this.cryptoService = cryptoService;
        this.constraintUtility = constraintUtility;
    }

    /**
     * Validates an artifact against its registered schema and cryptographic rules.
     * @param {string} artifactId The ID (e.g., 'PMH_LOCK_V1')
     * @param {object} payload The artifact data
     * @returns {Promise<boolean>} True if validation succeeds.
     * @throws {Error} If validation fails at any stage.
     */
    async validate(artifactId, payload) {
        const definition = this.registry.artifact_definitions[artifactId];
        if (!definition) {
            throw new Error(`Schema definition not found for artifact: ${artifactId}`);
        }

        // 1. Structural and Constraint Validation
        this._validateStructure(definition.schema, payload, artifactId);

        // 2. Cryptographic Integrity Validation
        if (definition.cryptographic_requirements) {
            await this._validateCryptography(definition.cryptographic_requirements, payload, artifactId);
        }

        return true;
    }

    /**
     * Performs structural validation (presence, type, format checks) by delegating to the utility.
     */
    _validateStructure(schema, payload, artifactId) {
        for (const [field, constraints] of Object.entries(schema)) {
            const hasField = Object.prototype.hasOwnProperty.call(payload, field);

            if (constraints.required && !hasField) {
                throw new Error(`[${artifactId}] Validation failed: Missing required field "${field}"`);
            }

            if (hasField) {
                // Delegate strong type/format checking (e.g., HASH_SHA256, TIMESTAMP_ISO8601)
                const value = payload[field];
                this.constraintUtility.validateField(field, value, constraints);
            }
        }
    }

    /**
     * Performs cryptographic validation (signatures, Merkle proofs) using the CryptoService.
     */
    async _validateCryptography(requirements, payload, artifactId) {
        if (!requirements) {
            return; // No cryptographic requirements specified
        }

        // Canonical data is the specific data block that was signed/hashed.
        const dataToVerify = this._getCanonicalData(payload, requirements.signed_fields);

        // --- 1. Signature Authority Verification ---
        if (requirements.signing_authorities) {
            for (const requirement of requirements.signing_authorities) {
                const { key_identifier_field, signature_field, authority_name } = requirement;

                const keyId = payload[key_identifier_field];
                const signature = payload[signature_field];

                if (!keyId || !signature) {
                    throw new Error(`[${artifactId}] Cryptography failed: Missing key ID (${key_identifier_field}) or signature (${signature_field}) for authority ${authority_name}.`);
                }

                const isValid = await this.cryptoService.verifySignature(dataToVerify, signature, keyId, authority_name);

                if (!isValid) {
                    throw new Error(`[${artifactId}] Cryptography failed: Invalid signature detected for authority: ${authority_name}.`);
                }
            }
        }

        // --- 2. Integrity Check (e.g., Merkle Root Verification) ---
        if (requirements.integrity && requirements.integrity.algorithm.startsWith('MERKLE_')) {
            const { algorithm, target_fields, root_field }