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

// --- TARGET INTEGRATION: Schema Validation Dependencies ---

// Mock implementation for AJV's validate function structure
const validate = (schema, data) => {
    // Basic structural check mock (replace with actual AJV validation in runtime)
    if (schema && data && typeof data === 'object' && data.header && data.data) {
        // Check for required properties specified in the simplified mock schema
        if (data.header.version && data.header.timestamp) {
             return true;
        }
    }
    // Mock error property for failure case
    validate.errors = [{ keyword: 'mock', message: 'Mock validation failed or missing required fields' }];
    return false;
};

// Mock Schema Import (Assuming CNRE_Envelope_V1.json is a standard JSON object)
const CNRE_V1_Schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
        header: { type: "object", required: ["version", "timestamp"] },
        data: { type: "object" }
    },
    required: ["header", "data"]
};

// --- END TARGET INTEGRATION: Schema Validation Dependencies ---

// --- Absorbed Target Data Utilities (New Enums/Interfaces) ---

/**
 * validateKMSPolicyIntegrity
 * @param {object} policy The key management policy object.
 * @returns {Array<string>} List of errors.
 */
export function validateKMSPolicyIntegrity(policy) {
    const errors = [];
    const definedKeyTypes = new Set(Object.keys(policy.key_type_definitions || {}));

    if (policy.rotation_schedule) {
        for (const [scheduleName, rotationEntry] of Object.entries(policy.rotation_schedule)) {
            if (rotationEntry.key_type && !definedKeyTypes.has(rotationEntry.key_type)) {
                errors.push(`Rotation schedule '${scheduleName}' references undefined key type: ${rotationEntry.key_type}`);
            }
        }
    }

    return errors;
}

/**
 * Standardized data structures for PIAM (Post-Mortem Integrity Assurance Module).
 */

/**
 * General Failure Termination Report (GFTR) V94 Schema.
 * Used for documenting terminal SIH events.
 * Note: Includes extensive forensic data specific to V94 terminal failure.
 * @typedef {object} GFTReportV94
 * @property {string} report_id
 * @property {number} timestamp
 * // ... extensive forensic data specific to V94 terminal failure
 */

/**
 * Receipt confirming successful execution environment state sealing.
 * Critical for establishing forensic chain-of-custody.
 * @typedef {object} PIAMSealingReceipt
 * @property {string} state_hash - SHA of the sealed execution environment state.
 * @property {string} sealing_key_id - Key used for cryptographic sealing.
 * @property {number} sealing_timestamp - Time of sealing operation (UNIX epoch ms).
 */

export const AuditStatus = {
    PASS: 'PASS',
    FAIL: 'FAIL',
    CONDITIONAL: 'CONDITIONAL',
};

export const CheckSeverity = {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
    INFO: 'INFO',
};

// --- START TARGET INTEGRATION: Simulation Configuration and Reporting Types ---

export const SIMULATION_PROCESS_STRESS_LEVELS = ['low', 'medium', 'high', 'intensive'];
/** Defines the expected stress load for the simulation run. */
// @ts-ignore
// export type SimulationStressLevel = typeof SIMULATION_PROCESS_STRESS_LEVELS[number];

export const SIMULATION_REPORT_STATUSES = ['SUCCESS', 'FAILURE', 'TOLERANCE_EXCEEDED', 'SYSTEM_CRASH', 'ROLLBACK_FAILURE'];
/** Defines the terminal state of the simulation outcome. */
// @ts-ignore
// export type SimulationStatusType = typeof SIMULATION_REPORT_STATUSES[number];

/**
 * Defines the parameters used to configure a specific simulation run. (Inputs)
 */
// @ts-ignore
// export interface SimulationParameters {
//     readonly stressLevel: SimulationStressLevel;
//     readonly maxAcceptableLatencyIncreaseRatio: number;
//     readonly requiredPassRateRatio: number;
// }

/**
 * Detailed metrics gathered during the performance assessment phase of the simulation.
 */
// @ts-ignore
// export interface SimulationPerformanceMetrics {
//     readonly totalTestCases: number;
//     readonly passedTestCases: number;
//     readonly achievedPassRateRatio: number;
//     readonly baselineLatencyMs: number;
//     readonly postMutationLatencyMs: number;
//     readonly latencyIncreaseRatio: number;
//     readonly resourceSaturationRatio: number;
// }

/**
 * Result of comparing achieved metrics against configured parameters.
 */
// @ts-ignore
// export interface SimulationToleranceCheckResult {
//     readonly latencyToleranceMet: boolean;
//     readonly passRateToleranceMet: boolean;
//     readonly overallTolerancesMet: boolean;
// }

/**
 * Contains immutable metadata necessary for tracking, debugging, and compliance.
 */
// @ts-ignore
// export interface SimulationAuditData {
//     readonly simulationId: string;
//     readonly runTimestampMs: number;
//     readonly agentVersion: string;
//     readonly failureVector: string | null;
// }

/**
 * The definitive report summarizing the outcome of a pre-commit simulation run.
 */
// @ts-ignore
// export interface SimulationReport {
//     readonly parameters: SimulationParameters;
//     readonly riskPredictionConfidenceRatio: number;
//     readonly status: SimulationStatusType;
//     readonly metrics: SimulationPerformanceMetrics;
//     readonly tolerances: SimulationToleranceCheckResult;
//     readonly audit: SimulationAuditData;
// }

// --- END TARGET INTEGRATION: Simulation Configuration and Reporting Types ---

// --- START TARGET INTEGRATION: AHRS Protocol Structures ---

/** A 3-element vector: [X, Y, Z] */
export type Vector3 = [number, number, number];

/** A 4-element quaternion: [w, x, y, z] */
export type Quaternion = [number, number, number, number];

interface AhrsHeader {
    seq: number;       // Monotonic sequence number (unsigned integer)
    ts_ns: number;     // Timestamp in nanoseconds (unsigned integer, typically 64-bit)
    frame_id: string;  // Reference coordinate frame (e.g., 'base_link')
}

interface AhrsData {
    orientation: Quaternion;         // Orientation: [w, x, y, z] Quaternion (unitless)
    angular_velocity: Vector3;       // Angular velocity: [rad/s] X, Y, Z
    linear_acceleration: Vector3;    // Linear acceleration: [m/s^2] X, Y, Z
    
    // Optional diagnostics/status field (typically an unsigned integer)
    calibration_status?: number; 
}

export interface AhrsMessage {
    header: AhrsHeader;
    data: AhrsData;
}

/**
 * Helper to check if an array is a tuple of numbers of a specific length,
 * ensuring all elements are finite numbers.
 */
function isNumericTuple(arr, length) {
    if (!Array.isArray(arr) || arr.length !== length) {
        return false;
    }
    // Ensure all elements are numbers and finite (no NaN, Infinity)
    return arr.every(item => typeof item === 'number' && Number.isFinite(item));
}

/**
 * Validates a potential AhrsMessage against the protocol specification.
 * Uses a Type Predicate to allow TypeScript to narrow the type upon successful validation.
 * @param msg The object to validate (input type set to 'unknown' for safety)
 * @returns True if the object conforms to AhrsMessage structure and content constraints.
 */
export function validateAhrsMessage(msg) {
    if (typeof msg !== 'object' || msg === null) return false;
    
    const potentialMsg = msg;

    // 1. Check top level structure
    if (!potentialMsg.header || typeof potentialMsg.header !== 'object' || potentialMsg.header === null ||
        !potentialMsg.data || typeof potentialMsg.data !== 'object' || potentialMsg.data === null) {
        return false;
    }

    const h = potentialMsg.header;
    // 2. Check Header structure: Expecting non-negative integers for time/sequence
    if (typeof h.seq !== 'number' || !Number.isInteger(h.seq) || h.seq < 0 ||
        typeof h.ts_ns !== 'number' || !Number.isInteger(h.ts_ns) || h.ts_ns < 0 ||
        typeof h.frame_id !== 'string' || h.frame_id.length === 0) {
        return false;
    }
    
    const d = potentialMsg.data;
    // 3. Check Data structure (using robust tuple validation)
    
    // Quaternions (4 elements)
    if (!isNumericTuple(d.orientation, 4)) return false;
    
    // Vectors (3 elements)
    if (!isNumericTuple(d.angular_velocity, 3)) return false;
    if (!isNumericTuple(d.linear_acceleration, 3)) return false;

    // Optional calibration status check (if present, must be a non-negative integer)
    if (d.calibration_status !== undefined) {
        if (typeof d.calibration_status !== 'number' || !Number.isInteger(d.calibration_status) || d.calibration_status < 0) {
            return false;
        }
    }

    // All checks pass
    return true;
}

// --- END TARGET INTEGRATION: AHRS Protocol Structures ---

// --- START KERNEL/TARGET INTEGRATION: Core Math Utilities ---

/**
 * ClampingUtility: Provides immutable mathematical utilities for value constraint adherence.
 */
export class ClampingUtility {
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

// --- END KERNEL/TARGET INTEGRATION: Core Math Utilities ---

// --- START TARGET INTEGRATION: CNRE Validator (MEE Sub-Engine Governance) ---

/**
 * CNRE_Validator: Enforces structural compliance for all Cognitive Network Response Envelopes.
 */
export class CNRE_Validator {
  // Using the mocked/defined schema import
  private static V1_SCHEMA = CNRE_V1_Schema;

  /**
   * Validates an incoming object against the CNRE V1 specification.
   * @param data The object to validate.
   * @returns boolean true if valid, throws error if invalid.
   */
  public static validateV1(data) {
    // NOTE: Uses the mocked 'validate' function defined globally
    const valid = validate(CNRE_Validator.V1_SCHEMA, data);
    if (!valid) {
      // In a real system, handle specific errors from the validator instance
      throw new Error(`CNRE V1 Validation Failed. Errors: ${JSON.stringify(validate.errors)}`);
    }
    return true;
  }

  // Future methods for V2, V3 migration checks, etc.
}

// --- END TARGET INTEGRATION: CNRE Validator ---

// Existing Interfaces (refined)
// @ts-ignore
// export interface PolicyEngine { 
//     blockPipeline(identifier: string): Promise<void>; 
// }

/**
 * Post-Mortem Integrity Assurance Module (PIAM) Interface
 * @typedef {object} PIAM_Interface
 * @property {function(string): Promise<PIAMSealingReceipt>} captureAndSealTerminalState
 *           Executes deep forensic state capture and cryptographically seals the terminal execution environment state.
 * @property {function(string): Promise<boolean>} initiateIsolationSequence
 *           Initiates the Physical/Logical Terminal Isolation Sequence.
 * @property {function(GFTReportV94): Promise<{ success: boolean; tx_id: string }>} sealAndBroadcastReport
 *           Finalizes the GFTR, signs it, and ensures resilient broadcast.
 * @property {function(): Promise<void>} lockdownRecoveryStaging
 *           Triggers the S8+ Recovery Staging Environment lockdown.
 */

// @ts-ignore
// export interface AlertingService { 
//     sendAlert(alert: { severity: CheckSeverity | string, message: string, context?: Record<string, unknown> }): Promise<void>; 
// }

// New Core Utility
// @ts-ignore
// export interface Logger {
//     info(message: string, context?: Record<string, unknown>): void;
//     warn(message: string, context?: Record<string, unknown>): void;
//     error(message: string, context?: Record<string, unknown>): void;
// }

// New Governance Utility for mandatory tracking
// @ts-ignore
// export interface RemediationService {
//     initiateMitigation(entityIdentifier: string, requiredActions: string[]): Promise<string>;
// }

/**
 * Represents a single declarative step within an evolution mission.
 */
// @ts-ignore
// export interface EvolutionStep {
//     type: string; 
//     targetPath: string;
//     objective: string;
//     details?: Record<string, any>;
// }

/**
 * The top-level structure for an AGI Evolution Mission Configuration (MEC).
 */
// @ts-ignore
// export interface EvolutionMission {
//     missionId: string;
//     version: string; 
//     timestamp: string; 
//     description: string;
//     evolutionSteps: EvolutionStep[];
//     configHash?: string;
// }

/**
 * @fileoverview Base class for all custom application and domain errors.
 */

/**
 * BaseCustomError
 * Enforces standardized structure, error codes, and causality chaining 
 * for all custom exceptions within the system.
 */
class BaseCustomError extends Error {
    /**
     * Standardized error code placeholder. Should be overridden by subclasses.
     */
    static CODE = 'E_SYSTEM_ERROR';

    /**
     * @param {string} message - Human-readable error message.
     * @param {object} [options={}] - Configuration options for the error.
     * @param {object} [options.details={}] - Specific context/data related to the error.
     * @param {Error} [options.cause] - The underlying error that triggered this exception.
     */
    constructor(message, options = {}) {
        const { details = {}, cause } = options;
        
        // Initialize standard Error fields, including cause (Node >= 16.9.0)
        super(message, { cause });

        // Ensure name reflects the class that instantiated it
        this.name = this.constructor.name;
        
        // Assign the class's static CODE property (defaulting to E_SYSTEM_ERROR)
        this.code = this.constructor.CODE;
        
        // Attach additional details
        this.details = details;
    }
}

// --- START TARGET INTEGRATION: Axiom Policy Error ---

/**
 * Custom error class specifically for Axiom Management and Policy Violations.
 */
export class AxiomPolicyError extends Error {
    /**
     * @param {string} message - Description of the policy failure.
     * @param {string} code - An internal code classifying the error (e.g., 'VERSION_MISMATCH', 'HARD_LIMIT_VIOLATION').
     */
    constructor(message, code = 'POLICY_FAILURE') {
        super(`[PolicyError ${code}] ${message}`);
        this.name = 'AxiomPolicyError';
        this.code = code;
        // Ensure proper stack trace capture
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AxiomPolicyError);
        }
    }
}

// --- END TARGET INTEGRATION: Axiom Policy Error ---

// --- START TARGET INTEGRATION: TelemetryService Definition ---

/**
 * TelemetryService (Integrated from Target)
 * Dedicated service for auditable governance logging and metrics tracking.
 */
class TelemetryService {
    /**
     * @param {object} config - Configuration object, e.g., { logLevel: 'info', source: 'AEOR' }
     */
    constructor(config = {}) {
        this.source = config.source || 'AEOR';
        this.logLevel = config.logLevel || 'info'; 
    }

    _log(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            source: this.source,
            message,
            ...metadata
        };
        
        // NOTE: In a production AIA system, this output would be asynchronously
        // piped to a durable, cryptographically verifiable audit log (D-01 requirement).
        
        // Simplified console logging for demonstration:
        const output = JSON.stringify(logEntry, null, 2);

        if (level === 'fatal' || level === 'critical') {
            console.error(output);
        } else if (level === 'error') {
            console.error(output);
        } else if (level === 'warn') {
            console.warn(output);
        } else {
            console.log(output);
        }
    }

    fatal(message, metadata) {
        this._log('fatal', message, metadata);
    }
    critical(message, metadata) {
        this._log('critical', message, metadata);
    }
    error(message, metadata) {
        this._log('error', message, metadata);
    }
    warn(message, metadata) {
        this._log('warn', message, metadata);
    }
    info(message, metadata) {
        this._log('info', message, metadata);
    }
    debug(message, metadata) {
        this._log('debug', message, metadata);
    }
}

// Instantiate the standardized governance logger for core Kernel use
const CoreGovTelemetry = new TelemetryService({ source: 'AGI-KERNEL-V6-9', logLevel: 'info' });

// --- END TARGET INTEGRATION: TelemetryService Definition ---

/**
 * Creates a debounced function that delays invoking the wrapped function until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked. Handles asynchronous inner functions.
 * @param {Function} func - The asynchronous function to debounce.
 * @param {number} wait - The number of milliseconds to wait.
 * @returns {Function & {flush: Function}} A new debounced function with a manual `flush` method.
 */
function debounce(func, wait) {
    let timeoutId = null;
    let isExecuting = false;
    let needsRerun = false;

    const debounced = function(...args) {
        const context = this;
        
        const runner = async function() {
            timeoutId = null;
            if (isExecuting) {
                needsRerun = true;
                return;
            }
            
            isExecuting = true;
            needsRerun = false;
            try {
                await func.apply(context, args);
            } catch (error) {
                console.error("Debounced function failed execution:", error);
            } finally {
                isExecuting = false;
                // If new calls arrived during execution, immediately schedule the next run
                if (needsRerun) {
                    debounced.apply(context, args);
                }
            }
        };

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(runner, wait);
        
        // Optimization for Node.js
        if (timeoutId && timeoutId.unref) {
            timeoutId.unref();
        }
    };
    
    // Method to force immediate execution if scheduled, bypassing the wait period.
    debounced.flush = function() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
            if (!isExecuting) {
                // If not currently running, run immediately
                func.apply(this);
            } else {
                // If running, ensure a rerun happens immediately after it finishes
                needsRerun = true;
            }
        }
    };

    return debounced;
}

/**
 * Constants defining standard types and severity levels for validation rules.
 */
const RuleSeverity = {
    ERROR: 'ERROR',     // Blocks execution/deployment
    WARNING: 'WARNING', // Permitted, but logged for review
    INFO: 'INFO'        // Informational checks
};

const RuleType = {
    COHERENCE: 'COHERENCE', // Checks related entity consistency (e.g., hard/soft limits)
    VERSIONING: 'VERSIONING', // Checks dependency compatibility
    STRUCTURAL: 'STRUCTURAL', // Checks required fields and data format
    POLICY: 'POLICY' // Checks against governance or ethical constraints
};

/**
 * Sovereign AGI Validation Rule Configuration Registry.
 */
const RuleRegistry = {
    RuleSeverity,
    RuleType,
    
    /**
     * Rules applied to the CHR Generation Specification (`spec`).
     */
    chrSpecRules: [
        {
            id: 'spec.memoryLimitCoherence',
            type: RuleType.COHERENCE,
            severity: RuleSeverity.ERROR,
            description: 'Ensure hard memory limit is not below the soft limit set in configuration.',
            targetPath: 'config.memoryLimits', // Indicates the path in the input structure
            handlerId: 'MemoryRuleHandler.checkLimitCoherence'
        },
        {
            id: 'spec.dependencyCompatibility',
            type: RuleType.VERSIONING,
            severity: RuleSeverity.ERROR,
            description: 'Verify all required internal component versions are compatible with the current runtime protocol.',
            targetPath: 'dependencies',
            handlerId: 'SystemRuleHandler.checkRuntimeCompatibility'
        },
        {
            id: 'spec.requiredFieldsExist',
            type: RuleType.STRUCTURAL,
            severity: RuleSeverity.ERROR,
            description: 'Verify core mandatory fields (like Agent ID and Mission Objective) are defined.',
            targetPath: 'metadata',
            handlerId: 'StructuralRuleHandler.checkRequiredFields'
        }
    ],
    
    // Policy and governance rules requiring specialized handlers
    policyRules: []
};

// Adapt the existing GAXTelemetry interface to use the new structured CoreGovTelemetry instance
const GAXTelemetry = {
    system: (msg, data) => CoreGovTelemetry.info(msg, { context: 'SYSTEM', detail: data || {} }),
    debug: (msg, data) => CoreGovTelemetry.debug(msg, data),
    error: (msg, data) => CoreGovTelemetry.error(msg, data),
    info: (msg, data) => CoreGovTelemetry.info(msg, data),
    critical: (msg, data) => CoreGovTelemetry.critical(msg, data),
};

// Placeholder: Replace with actual KV persistence interface
const StorageService = {
    getCRoTIndexHandle: () => ({
        // Mock functions for persistence operations
        lookup: async (key) => { 
            // Simulate finding some anchors for testing
            if (key.startsWith('0')) return ['tx_a1', 'tx_a2', 'tx_a3'];
            return [];
        },
        append: async (key, value, metadata) => {
            GAXTelemetry.debug('Storage_Append_Mock', { key, value, metadata });
        },
    })
};

/**
 * CRoTIndexClient
 * Handles the low-level data interaction for the PolicyHeuristicIndex, abstracting 
 * access to the CRoT Key-Value persistence layer. It manages data retrieval 
 * (lookup of anchors) and persistence (commit indexing).
 */
class CRoTIndexClient {
    
    constructor() {
        this.indexStore = StorageService.getCRoTIndexHandle();
        GAXTelemetry.system('CRoT_IndexClient_Init');
    }

    /**
     * Retrieves historical ACV transaction IDs (anchors) associated with a policy fingerprint.
     * @param {string} fingerprint - SHA-256 policy structure hash.
     * @returns {Promise<string[]>} Array of ACV transaction IDs.
     */
    async getAnchorsByFingerprint(fingerprint) {
        try {
            const anchors = await this.indexStore.lookup(fingerprint);
            GAXTelemetry.debug('CRoT_IndexRead', { count: anchors.length, fingerprint: fingerprint.substring(0, 8) });
            return anchors;
        } catch (error) {
            GAXTelemetry.error('CRoT_IndexRead_Failure', { error: error.message });
            return [];
        }
    }

    /**
     * Commits a new successful ACV transaction ID against the policy fingerprint key.
     * @param {string} fingerprint - The policy structure hash.
     * @param {string} txId - The successful ACV transaction ID.
     * @returns {Promise<void>} 
     */
    async indexCommit(fingerprint, txId) {
        try {
            await this.indexStore.append(fingerprint, txId, { timestamp: Date.now() });
            GAXTelemetry.info('CRoT_IndexWrite_Success', { txId, fingerprint: fingerprint.substring(0, 8) });
        } catch (error) {
            GAXTelemetry.critical('CRoT_IndexWrite_Failure', { txId, error: error.message });
            throw new Error(`CRoT Indexing failed for TX ID ${txId}.`);
        }
    }
}

const crotIndexClient = new CRoTIndexClient();

// --- Mocks for MutationChainRegistrar Dependencies ---

const MockAuditLogger = {
    logEvent: (code, msg) => GAXTelemetry.info(`[AUDIT:${code}] ${msg}`),
    logError: (code, msg) => GAXTelemetry.error(`[AUDIT:${code}] ${msg}`),
    logCritical: (code, msg) => GAXTelemetry.critical(`[AUDIT:${code}] ${msg}`),
};

const calculateHash = (data) => {
    // Simple mock hash generation for integrity check
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
};

const MockIntegrityService = {
    calculateStableHash: (data) => calculateHash(data), // Reusing existing hash utility
    verifyArchitecturalSignature: (payload) => { 
        // Mock: Always true for trusted governance payloads in this context
        return true; 
    }
};

const MockLedgerPersistence = {
    loadChainHistory: async () => { 
        // Mock: Load an empty history for initialization
        return []; 
    },
    persistRecord: async (record) => {
        GAXTelemetry.debug('LEDGER_PERSIST_MOCK', record.mutationId);
        // Simulate successful persistence delay
        await new Promise(resolve => setTimeout(resolve, 50));
    }
};

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * @typedef {object} MutationRecord
 * @property {number} timestamp - Time of registration.
 * @property {string} mutationId - Version ID from the payload.
 * @property {string} architecturalHash - Hash of the A-01 manifest.
 * @property {string} p01Hash - Confirmation hash proving successful deployment (P-01).
 * @property {string} previousChainHash - Hash of the preceding chain record.
 * @property {string} selfHash - Hash of this entire record structure (linkage).
 */

export class MutationChainRegistrar {
    /**
     * @param {object} dependencies 
     * @param {AuditLogger} dependencies.auditLogger 
     * @param {IntegrityService} dependencies.integrityService - Must provide verifyArchitecturalSignature.
     * @param {LedgerPersistence} dependencies.ledgerPersistence - Assumed to use async I/O and 'persistRecord'.
     */
    constructor({ auditLogger, integrityService, ledgerPersistence }) {
        if (!integrityService || !ledgerPersistence) {
            throw new Error("MCR requires IntegrityService and LedgerPersistence dependencies.");
        }

        this.auditLogger = auditLogger; 
        this.integrityService = integrityService; 
        this.ledgerPersistence = ledgerPersistence;
        
        // The chain array is initialized empty, waiting for initialization routine.
        this.chain = []; 
        this.isInitialized = false;
    }

    /**
     * Initializes the registrar by loading historical data asynchronously and verifying linkage.
     * @returns {Promise<void>}...
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            this.chain = await this.ledgerPersistence.loadChainHistory();
            
            if (this.chain.length > 0) {
                this.auditLogger.logEvent('MCR_LOAD', `Loaded ${this.chain.length} records from history. Last hash: ${this.getLatestChainHash().substring(0, 10)}...`);
                
                if (!this.verifyFullChainIntegrity()) {
                     throw new Error("Loaded chain failed internal cryptographic linkage verification.");
                }
            } else {
                this.auditLogger.logEvent('MCR_INIT', 'Initialized GENESIS chain.');
            }
            this.isInitialized = true;
        } catch (error) {
            this.auditLogger.logCritical('MCR_INIT_FAILURE', `Failed to initialize chain history: ${error.message}`);
            // Must halt operations if chain history cannot be loaded/verified.
            throw new Error(`Critical failure loading mutation chain history: ${error.message}`);
        }
    }

    /**
     * Validates the cryptographic linkage and self-hashes of every record in the loaded chain.
     * @returns {boolean}
     */
    verifyFullChainIntegrity() {
        if (this.chain.length === 0) return true;

        for (let i = 0; i < this.chain.length; i++) {
            const record = this.chain[i];
            
            // 1. Re-calculate and verify selfHash consistency
            const calculatedSelfHash = this.integrityService.calculateStableHash({
                timestamp: record.timestamp,
                mutationId: record.mutationId,
                architecturalHash: record.architecturalHash,
                p01Hash: record.p01Hash,
                previousChainHash: record.previousChainHash
            });

            if (calculatedSelfHash !== record.selfHash) {
                this.auditLogger.logError('MCR_INTEGRITY_FAIL', `Self-hash mismatch detected at index ${i} (ID: ${record.mutationId}).`);
                return false;
            }

            // 2. Verify previousChainHash linkage
            const expectedPreviousHash = (i === 0) ? GENESIS_HASH : this.chain[i - 1].selfHash;
            
            if (record.previousChainHash !== expectedPreviousHash) {
                this.auditLogger.logCritical('MCR_CHAIN_BREAK', `Chain linkage broken at index ${i}. Expected hash break.`);
                return false;
            }
        }
        this.auditLogger.logEvent('MCR_INTEGRITY_OK', 'Chain structure verified successfully.');
        return true;
    }

    /**
     * Registers a finalized (A-01 locked) payload into the evolutionary chain.
     * @param {object} payload - The signed and versioned architectural manifest.
     * @param {string} p01ConfirmationHash - The immutable hash from D-01 proving P-01 success.
     * @returns {Promise<string>} The selfHash of the newly registered record.
     */
    async registerMutation(payload, p01ConfirmationHash) {
        if (!this.isInitialized) {
            throw new Error("MCR must be initialized before registering mutations.");
        }

        // --- Critical Security Check ---
        // Must verify the payload's signature ensures the mutation originated from the trusted governance assembly.
        if (!this.integrityService.verifyArchitecturalSignature(payload)) {
            this.auditLogger.logError('MCR_FAILURE', `Payload signature verification failed for version ${payload.versionId || 'unknown'}.`);
            throw new Error("MCR Registration Failure: Invalid cryptographic signature on A-01 manifest.");
        }
        
        // 1. Structure the new record
        const newRecordWithoutHash = {
            timestamp: Date.now(),
            mutationId: payload.versionId,
            // Use the manifest hash for immutable architectural record
            architecturalHash: this.integrityService.calculateStableHash(payload.manifest), 
            p01Hash: p01ConfirmationHash, 
            previousChainHash: this.getLatestChainHash()
        };

        // 2. Calculate the linkage hash (selfHash)
        const selfHash = this.integrityService.calculateStableHash(newRecordWithoutHash);
        
        const newRecord = { ...newRecordWithoutHash, selfHash };
        
        // 3. Commit locally and asynchronously persist
        this.chain.push(newRecord);
        
        try {
            await this.ledgerPersistence.persistRecord(newRecord);
        } catch (error) {
             // If persistence fails, roll back the local change immediately to prevent state divergence
            this.chain.pop(); 
            this.auditLogger.logCritical('MCR_PERSISTENCE_FAIL', `Failed to persist record ${payload.versionId}. Chain integrity maintained via rollback.`);
            throw new Error(`Persistence failure during MCR commit: ${error.message}`);
        }

        this.auditLogger.logEvent('MCR_COMMITMENT', `Mutation ${payload.versionId} committed. Hash: ${selfHash.substring(0, 10)}...`);
        return selfHash;
    }

    /**
     * Retrieves the selfHash of the most recent record.
     * @returns {string}
     */
    getLatestChainHash() {
        if (this.chain.length === 0) return GENESIS_HASH;
        return this.chain[this.chain.length - 1].selfHash;
    }

    getChainLength() {
        return this.chain.length;
    }

    getChain() {
        // Return a copy to ensure external manipulation does not compromise the internal ledger.
        return [...this.chain];
    }
}

// --- Start Integration of PCRA Task Sequencer Engine (MEE Sub-Engine) ---

// Required mock action map (Must be defined globally for MockDependencyRegistry)
const MockActionMap = {
    'system_check': async (params, context, timeout) => {
        GAXTelemetry.debug(`[TSE Action] Running system_check with params: ${JSON.stringify(params)}`);
        // Simulate potential failure
        if (params.critical_threshold && context.severity > params.critical_threshold) {
             throw new Error("System check failed due to high severity.");
        }
        await new Promise(resolve => setTimeout(resolve, timeout || 100));
        return { success: true, action: 'system_check' };
    },
    'isolate_network': async (params, context, timeout) => {
        GAXTelemetry.warn(`[TSE Action] Initiating isolation for incident: ${context.id}`);
        await new Promise(resolve => setTimeout(resolve, timeout || 500));
        return { result: 'network_segment_isolated', action: 'isolate_network' };
    },
    'run_diagnostic': async (params, context, timeout) => {
        GAXTelemetry.info(`[TSE Action] Running full diagnostics on entity: ${params.entity}`);
        await new Promise(resolve => setTimeout(resolve, timeout || 200));
        return { status: 'DIAGNOSTIC_COMPLETE', action: 'run_diagnostic' };
    }
};

// Required Dependency Registry for TaskSequencerEngine
class DependencyRegistry {
    getLogger(name) {
        // Adapt GAXTelemetry (which now uses CoreGovTelemetry) to the expected Logger interface 
        return {
            info: (msg, context) => GAXTelemetry.info(msg, { context: name, detail: context }),
            warn: (msg, context) => GAXTelemetry.warn(msg, { context: name, detail: context }),
            error: (msg, context) => GAXTelemetry.error(msg, { context: name, detail: context }),
            critical: (msg, context) => GAXTelemetry.critical(msg, { context: name, detail: context }),
            debug: (msg, context) => GAXTelemetry.debug(msg, { context: name, detail: context })
        };
    }
    getActionMap() {
        return MockActionMap;
    }
}
const dependencyRegistry = new DependencyRegistry();


class TaskSequencerEngine {
    constructor(dependencyRegistry) {
        this.logger = dependencyRegistry.getLogger('PCRA_TSE');
        this.actionMap = dependencyRegistry.getActionMap();
    }

    /**
     * Executes a resolution strategy sequence defined by structured Task Objects.
     * @param {Array<Object>} sequence - The execution_sequence array.
     * @param {Object} incidentContext - Contextual data.
     */
    async executeStrategy(sequence, incidentContext) {
        this.logger.debug(`Starting sequenced execution for incident: ${incidentContext.id}`);

        for (const task of sequence) {
            const maxRetries = this.getMaxRetries(task.on_failure);
            let attempts = 0;
            let successful = false;

            while (attempts <= maxRetries && !successful) {
                attempts++;
                try {
                    await this.runTaskWithTimeout(task, incidentContext);
                    successful = true;
                } catch (error) {
                    this.logger.warn(`Task ${task.step_id} failed (Attempt ${attempts}/${maxRetries + 1}). Mode: ${task.on_failure}`, { error: error.message });

                    if (attempts > maxRetries || task.on_failure === "FAIL_FAST") {
                        this.handleFailureEscalation(task.on_failure, task, incidentContext);
                        throw new Error(`Strategy aborted: Task ${task.step_id} failed permanently.`);
                    }
                    if (task.on_failure.startsWith("INITIATE_HUMAN")) {
                        this.handleFailureEscalation(task.on_failure, task, incidentContext);
                        return { status: "WAITING_OVERSIGHT", step: task.step_id };
                    }
                    // Exponential backoff or standardized wait
                    await new Promise(resolve => setTimeout(resolve, Math.min(100 * attempts * 2, 5000)));
                }
            }
        }
        return { status: "SUCCESS" };
    }

    getMaxRetries(failureMode) {
        const match = failureMode ? failureMode.match(/^RETRY_(\d+)X/) : null;
        if (match) {
            return parseInt(match[1], 10);
        }
        return failureMode === "RETRY_INF" ? Infinity : 0;
    }

    handleFailureEscalation(failureMode, task, incidentContext) {
        this.logger.critical(`Escalation triggered by task ${task.step_id}. Mode: ${failureMode}`, { context: incidentContext });
        // In a real kernel, this would involve calling the RemediationService or AlertingService.
        // Mocking behavior:
        if (failureMode.startsWith("INITIATE_HUMAN")) {
            GAXTelemetry.critical("OVERSIGHT_REQUEST", { incident: incidentContext.id, task: task.step_id });
        }
    }
    
    async runTaskWithTimeout(task, incidentContext) {
        if (!this.actionMap[task.action]) {
            throw new Error(`Unknown action type: ${task.action}`);
        }

        const actionFunction = this.actionMap[task.action];
        const timeout = task.timeout_ms || 30000;
        
        let timerId;
        
        const timeoutPromise = new Promise((_, reject) => {
            timerId = setTimeout(() => {
                reject(new Error(`Task ${task.step_id} timed out after ${timeout}ms.`));
            }, timeout);
            // Prevent timer from keeping the process alive unnecessarily
            if (timerId.unref) timerId.unref(); 
        });

        const actionPromise = actionFunction(task.parameters || {}, incidentContext, task.delay_ms);

        try {
            const result = await Promise.race([actionPromise, timeoutPromise]);
            clearTimeout(timerId);
            this.logger.info(`Task ${task.step_id} completed successfully.`, result);
            return result; // Return the result of the successful action
        } catch (e) {
            clearTimeout(timerId);
            throw e; // Re-throw any failure (action failure or timeout)
        }
    }
}

// --- End Integration of PCRA Task Sequencer Engine ---

// --- MEE Metric Evaluation Sub-Engine Integration: TrustMatrixManager ---

// Adapter for TrustMatrixManager's persistence requirements
const TrustMatrixPersistenceMock = (() => {