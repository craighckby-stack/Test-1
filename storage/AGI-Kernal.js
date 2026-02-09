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

// --- TARGET INTEGRATION: ASDM Error Translator V1.0 ---

/**
 * ASDM_ErrorTranslator V1.0
 * Component responsible for converting standardized internal validation issues (StandardIssue)
 * into finalized, human-readable error messages for consumption by external APIs or UI.
 * This separation ensures the core ValidationResultProcessor remains focused purely on data transformation,
 * delegating message presentation concerns here.
 */

/**
 * @typedef {object} StandardIssue
 * @property {string} schema - The key of the schema validated against.
 * @property {string} field - The canonical path of the invalid data.
 * @property {string} code - The type of validation failure (Ajv keyword).
 * @property {string} message - The original generated error message (used as fallback).
 */

/**
 * Takes a standardized issue and formats a highly contextual message.
 * Placeholder for a future localization and template system.
 * 
 * @param {StandardIssue} issue 
 * @param {string} [locale='en-US'] - Optional locale setting.
 * @returns {string} The final, user-ready error message.
 */
export function translateIssueToUserMessage(issue, locale = 'en-US') {
    const { field, code, message } = issue;

    // In production, load messages from a configuration file mapped by schema/code.
    
    // Convert JSON Pointer path to dot notation for user readability
    const cleanedField = field.startsWith('/') ? field.substring(1).replace(/\//g, '.') : field;

    let userMessage = message;

    switch (code) {
        case 'required':
            userMessage = `The field '${cleanedField}' is required and missing.`;
            break;
        case 'type':
            // Assumes Ajv message contains necessary details about expected type
            userMessage = `The value provided for '${cleanedField}' is the wrong data type. Details: ${message}`;
            break;
        default:
            // Use the generic Ajv message as a default fallback
            userMessage = `Field ${cleanedField} failed validation check '${code}'.`;
    }

    return userMessage;
}

export const ASDM_ErrorTranslator = {
    translate: translateIssueToUserMessage
};

// --- END TARGET INTEGRATION: ASDM Error Translator V1.0 ---


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
 * NOTE: This is implicitly used by the MEE Engine.
 */
export interface SimulationReport {
    readonly parameters: any; // SimulationParameters;
    readonly riskPredictionConfidenceRatio: number;
    readonly status: string; // SimulationStatusType;
    readonly metrics: any; // SimulationPerformanceMetrics;
    readonly tolerances: any; // SimulationToleranceCheckResult;
    readonly audit: any; // SimulationAuditData;
}

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


// --- START TARGET INTEGRATION: KeyIdentityResolver (MEE Dependency) ---

/**
 * KeyIdentityResolver (MEE Core Engine Dependency)
 * Optimizes the identification and abstraction of complex, hierarchical key identities
 * used in policy evaluation and metric reporting (MEE).
 * Uses internal caching (memoization) and path traversal optimization.
 */
class KeyIdentityResolver {
    constructor() {
        // Cache for resolved identities, mapping path string to IdentityDescriptor.
        this.identityCache = new Map();
    }

    /**
     * Standardized descriptor structure for a resolved identity.
     * @typedef {object} IdentityDescriptor
     * @property {string} canonicalPath - The normalized, full path (e.g., 'system.processor.affinity').
     * @property {string} baseName - The leaf name (e.g., 'affinity').
     * @property {string} scope - The parent context scope (e.g., 'system.processor').
     * @property {number} depth - The depth of the key in the hierarchy.
     */

    /**
     * Parses a key path into a canonical identity descriptor.
     * Implements memoization for maximum computational efficiency.
     * @param {string} keyPath - The dot-separated or slash-separated key path (e.g., 'a.b.c' or 'a/b/c').
     * @returns {IdentityDescriptor}
     */
    resolveIdentity(keyPath) {
        if (this.identityCache.has(keyPath)) {
            return this.identityCache.get(keyPath);
        }

        const normalizedPath = keyPath.replace(/\//g, '.');
        if (!normalizedPath) {
            throw new AxiomPolicyError("Attempted to resolve an empty key path.", "INVALID_KEY_PATH");
        }

        const parts = normalizedPath.split('.');
        const depth = parts.length;
        const baseName = parts[depth - 1];
        const scope = depth > 1 ? parts.slice(0, depth - 1).join('.') : '';

        const descriptor = {
            canonicalPath: normalizedPath,
            baseName,
            scope,
            depth
        };

        this.identityCache.set(keyPath, descriptor);
        return descriptor;
    }

    /**
     * Recursively abstracts the identity up the hierarchy based on abstraction level.
     * This is crucial for applying policy rules that scope to parent containers.
     * @param {string} keyPath - The starting canonical path.
     * @param {number} abstractionLevel - How many levels up to abstract (0 = self, 1 = parent, etc.).
     * @returns {object | null} The abstracted descriptor, or null if abstraction fails.
     */
    recursiveAbstraction(keyPath, abstractionLevel) {
        if (abstractionLevel < 0)