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
 */
export interface GFTReportV94 {
    report_id: string;
    timestamp: number;
    system_version: string;
    sealed_state_hash: string;
    // Placeholder for required extensive forensic fields...
}

/**
 * Receipt confirming successful execution environment state sealing.
 * Critical for establishing forensic chain-of-custody.
 */
export interface PIAMSealingReceipt {
    state_hash: string;
    sealing_key_id: string;
    sealing_timestamp: number;
    integrity_check_nonce: string;
}

export enum AuditStatus {
    PASS = 'PASS',
    FAIL = 'FAIL',
    CONDITIONAL = 'CONDITIONAL',
}

export enum CheckSeverity {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    INFO = 'INFO',
}

// Existing Interfaces (refined)
export interface PolicyEngine { 
    blockPipeline(identifier: string): Promise<void>; 
}

export interface AlertingService { 
    sendAlert(alert: { severity: CheckSeverity | string, message: string, context?: Record<string, unknown> }): Promise<void>; 
}

// New Core Utility
export interface Logger {
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
}

// New Governance Utility for mandatory tracking
export interface RemediationService {
    /**
     * Initiates external tracking (e.g., ticketing system, automated fix pipeline) for required mitigation actions.
     * @param entityIdentifier The entity requiring mitigation.
     * @param requiredActions Detailed list of steps or descriptions needed for remediation.
     * @returns A tracking identifier (e.g., Jira ticket ID).
     */
    initiateMitigation(entityIdentifier: string, requiredActions: string[]): Promise<string>;
}

/**
 * Represents a single declarative step within an evolution mission.
 * The actual structure must conform to MECSchemaDefinition.json.
 */
export interface EvolutionStep {
    type: string; // e.g., 'analyze', 'propose', 'implement', 'verify'
    targetPath: string;
    objective: string;
    details?: Record<string, any>;
}

/**
 * The top-level structure for an AGI Evolution Mission Configuration (MEC).
 */
export interface EvolutionMission {
    missionId: string;
    version: string; 
    timestamp: string; // ISO date string for creation/submission
    description: string;
    evolutionSteps: EvolutionStep[];
    configHash?: string; // Optional checksum for integrity
}

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
 * This allows upstream consumers (e.g., control plane) to deterministically catch
 * policy-related initialization or validation failures, distinguishing them from
 * standard runtime or I/O errors.
 */
class AxiomPolicyError extends Error {
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

// --- END TARGET INTEGRATION ---

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
        if (timeoutId.unref) {
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

// Mock GAX Telemetry Service
const GAXTelemetry = {
    system: (msg, data) => console.log(`[GAX:SYS] ${msg}`, data || ''),
    debug: (msg, data) => console.log(`[GAX:DBG] ${msg}`, data || ''),
    error: (msg, data) => console.error(`[GAX:ERR] ${msg}`, data || ''),
    info: (msg, data) => console.info(`[GAX:INF] ${msg}`, data || ''),
    critical: (msg, data) => console.error(`[GAX:CRIT] ${msg}`, data || ''),
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

class MutationChainRegistrar {
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
     * @returns {Promise<void>}
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

// --- End Absorbed Target Data Utilities ---

// --- Policy Engine Data Structures (Target Integration) ---

class TrieNode {
    constructor() {
        this.children = new Map();
        this.policies = []; // Stores policies matching this prefix
    }
}

class PolicyTrie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(prefix, policy) {
        let node = this.root;
        for (const char of prefix) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char);
        }
        node.policies.push(policy);
    }

    search(key) {
        let node = this.root;
        let matchingPolicies = [];
        for (const char of key) {
            if (node.children.has(char)) {
                node = node.children.get(char);
                matchingPolicies.push(...node.policies);
            } else {
                // Stop if prefix doesn't match further
                break;
            }
        }
        // Also check for policies stored at the end of the full key path
        matchingPolicies.push(...node.policies); 
        return [...new Set(matchingPolicies)]; // Deduplicate
    }
}

class IntervalTree {
    constructor() {
        this.intervals = []; // Stores { start, end, policy }
    }

    insert(start, end, policy) {
        this.intervals.push({ start, end, policy });
    }

    initialize() {
        // Sort by start point for efficient querying
        this.intervals.sort((a, b) => a.start - b.start);
    }

    query(point) {
        const matchingPolicies = [];
        // Leverage sorting to stop early
        for (const interval of this.intervals) {
            if (interval.start > point) {
                break; 
            }
            if (point >= interval.start && point <= interval.end) {
                matchingPolicies.push(interval.policy);
            }
        }
        return matchingPolicies;
    }
}

class MccPolicyEngine {
    constructor() {
        this.policies = [];
        this.prefixRules = new PolicyTrie();
        this.rangeTree = new IntervalTree();
        GAXTelemetry.system('MccPolicyEngine_Init');
    }

    /**
     * Recursive function to handle complex policy conditions.
     * @param {object} conditions - The condition object (e.g., { type: 'AND', rules: [...] })
     * @param {object} transactionData - The data being evaluated.
     * @returns {boolean}
     */
    evaluateConditionsRecursively(conditions, transactionData) {
        if (!conditions) return true;

        const { type, rules, field, operator, value } = conditions;

        if (type === 'AND') {
            return rules.every(rule => this.evaluateConditionsRecursively(rule, transactionData));
        }
        if (type === 'OR') {
            return rules.some(rule => this.evaluateConditionsRecursively(rule, transactionData));
        }

        // Base condition evaluation
        const txValue = transactionData[field];

        if (txValue === undefined) return false;

        switch (operator) {
            case 'EQ': return txValue === value;
            case 'GT': return txValue > value;
            case 'LT': return txValue < value;
            case 'CONTAINS': return String(txValue).includes(String(value));
            default: return false;
        }
    }

    /**
     * Initializes the engine by compiling policies into optimized structures.
     * @param {Array<object>} rawPolicies - List of policies.
     */
    initializeEngine(rawPolicies) {
        // 1. Prioritize policies based on a defined order (e.g., 'priority' field, higher is better)
        this.policies = [...rawPolicies].sort((a, b) => (b.priority || 0) - (a.priority || 0));
        
        this.prefixRules = new PolicyTrie();
        this.rangeTree = new IntervalTree();

        this.policies.forEach(policy => {
            if (policy.matchType === 'PREFIX' && policy.prefix) {
                this.prefixRules.insert(policy.prefix, policy);
            }
            if (policy.matchType === 'RANGE' && policy.rangeStart !== undefined && policy.rangeEnd !== undefined) {
                this.rangeTree.insert(policy.rangeStart, policy.rangeEnd, policy);
            }
        });
        
        this.rangeTree.initialize();
        GAXTelemetry.info('MccPolicyEngine_Compiled', { count: this.policies.length });
    }

    /**
     * Evaluates a transaction against all compiled policies.
     * @param {object} transactionData - The data to evaluate (e.g., { accountId: '123', amount: 500, geoCode: '001' })
     * @returns {Array<object>} List of matching policies, prioritized.
     */
    evaluateTransaction(transactionData) {
        const matchingPolicies = new Set();
        
        // 1. Prefix Matching (e.g., geo codes)
        if (transactionData.geoCode) {
            this.prefixRules.search(transactionData.geoCode).forEach(p => matchingPolicies.add(p));
        }
        
        // 2. Range Matching (e.g., amount)
        if (transactionData.amount !== undefined) {
            this.rangeTree.query(transactionData.amount).forEach(p => matchingPolicies.add(p));
        }

        // 3. Full Iteration and Recursive Condition Check (Leveraging sorted list for priority)
        const finalMatches = [];
        
        for (const policy of this.policies) {
            // Optimization: If already matched by fast lookup and no complex conditions, push and continue.
            if (matchingPolicies.has(policy) && !policy.conditions) {
                finalMatches.push(policy);
                continue;
            }

            // Check recursive conditions
            if (this.evaluateConditionsRecursively(policy.conditions, transactionData)) {
                finalMatches.push(policy);
            }
        }

        // The results are already prioritized due to the initial sorting.
        return finalMatches;
    }
}

// Mock policies for testing the engine
const mockPolicies = [
    { id: 1, priority: 100, matchType: 'PREFIX', prefix: '001', conditions: { type: 'GT', field: 'amount', value: 1000 } },
    { id: 2, priority: 50, matchType: 'RANGE', rangeStart: 100, rangeEnd: 500, conditions: null },
    { id: 3, priority: 10, matchType: 'GENERAL', conditions: { type: 'AND', rules: [{ field: 'currency', operator: 'EQ', value: 'USD' }, { field: 'riskScore', operator: 'LT', value: 5 }] } }
];

const mccPolicyEngine = new MccPolicyEngine();
mccPolicyEngine.initializeEngine(mockPolicies);

// --- Utility Mocks for Proposal Validation ---
const validateSchema = (data, schema) => ({ valid: true, errors: [] });

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

const executionEngine = {
    // Mock storage retrieval
    getRawPayload: async (hash) => {
        // Simulate finding a payload for a known hash pattern
        if (hash.startsWith('0000')) {
            return { module: 'core', action: 'update_params', value: 100 };
        }
        return null;
    },
    // Mock execution simulation
    simulateCall: async (modulePath, method, rawPayload) => {
        if (method === 'fail_test') {
            return { success: false, error: 'Simulation failed due to critical path error.' };
        }
        return { success: true, report: { gasUsed: 500, stateChange: 'Simulated OK' } };
    }
};

// --- Governance API Adapter ---
class GovernanceApiAdapter {
    constructor(endpoint) {
        if (!endpoint) throw new Error("Adapter requires a configuration endpoint.");
        this.endpoint = endpoint;
    }

    async fetchLatestConfig() {
        // Mocked return for development/testing, simulating dynamic governance overlay:
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

        return {
            system_tuning: {
                governance_cycle_ms: 45000, // Dynamic adjustment
                min_r_index_threshold: 55,
                dynamic_threshold_adjustment: true
            },
        };
    }
}

// --- MEE Metric Evaluation Engine ---
const MEE_ENGINE = {
    // Default weights for core metrics
    DEFAULT_WEIGHTS: {
        absorptionRate: 0.4, // How much new code was absorbed
        successRate: 0.5,    // Ratio of successful grafts to total cycles
        latencyScore: 0.1    // Inverse measure of execution speed (normalized)
    },

    // 1. Weighted Calculation (W_SCORE)
    calculateWScore: (metrics, weights) => {
        let totalScore = 0;
        let totalWeight = 0;
        for (const key in metrics) {
            if (weights[key] !== undefined) {
                totalScore += metrics[key] * weights[key];
                totalWeight += weights[key];
            }
        }
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    },

    // 2. R_INDEX Calculation (Reliability Index)
    calculateRIndex: (wScore, cycleCount, errorRate) => {
        // R_INDEX = (W_SCORE * log(CycleCount + 1)) / (1 + ErrorRate)
        const reliability = (wScore * Math.log(cycleCount + 1)) / (1 + errorRate);
        return Math.min(100, Math.max(0, reliability)); // Cap between 0 and 100
    },

    // 3. Dynamic Threshold Evaluation
    evaluateThresholds: (rIndex, governanceConfig) => {
        const defaultThreshold = governanceConfig.min_r_index_threshold || 50;
        
        // Dynamic adjustment based on current R-Index
        const adjustmentFactor = governanceConfig.dynamic_threshold_adjustment ? (rIndex / 100) * 10 : 0;
        const currentThreshold = defaultThreshold + adjustmentFactor;
        
        const isOperational = rIndex >= currentThreshold;
        
        return {
            currentThreshold: parseFloat(currentThreshold.toFixed(2)),
            isOperational,
            recommendation: isOperational ? 'CONTINUE_GROWTH' : 'INITIATE_COOLING'
        };
    },
};

// --- Proposal Payload Validator (Absorbed Logic) ---

// Standardized list of proposal types that require an executable payload.
const ACTIONABLE_PROPOSAL_TYPES = new Set([
  'PROTOCOL_UPGRADE',
  'TREASURY_ALLOCATION',
  'PARAMETER_CHANGE'
]);

/**
 * Validates the integrity and executability of an actionable proposal payload.
 *
 * 1. Checks proposal type.
 * 2. Retrieves raw payload data.
 * 3. Verifies payload integrity via hash comparison.
 * 4. Performs safe execution simulation.
 *
 * @param {object} proposal - The proposal object.
 * @returns {Promise<{valid: boolean, reason?: string, simulationReport?: object}>}
 */
async function validateProposalPayload(proposal) {
  const { type, details, implementationTarget } = proposal;

  if (!ACTIONABLE_PROPOSAL_TYPES.has(type)) {
    // Skip validation for informational or standard proposals (e.g., 'Discussion')
    return { valid: true, reason: 'Informational proposal, no execution payload required.' };
  }

  if (!implementationTarget || !implementationTarget.payloadHash) {
    return { valid: false, reason: `Actionable proposal of type ${type} lacks implementationTarget payload details.` };
  }
  
  const expectedHash = implementationTarget.payloadHash;

  // 1. Retrieve Raw Payload Data
  const rawPayload = await executionEngine.getRawPayload(expectedHash);
  if (!rawPayload) {
    return { valid: false, reason: `Executable payload data missing from storage for hash: ${expectedHash}.` };
  }
  
  // 2. Hash Integrity Check
  try {
    const computedHash = calculateHash(rawPayload);
    
    if (computedHash !== expectedHash) {
      // Use substring to avoid logging massive hashes in error messages, focusing on identification.
      const safeExpected = expectedHash.substring(0, 16);
      const safeComputed = computedHash.substring(0, 16);
      return { 
        valid: false, 
        reason: `Payload integrity failed. Computed hash (${safeComputed}...) does not match expected hash (${safeExpected}...).` 
      };
    }
  } catch (hashError) {
     return { valid: false, reason: `Failed during hash computation: ${hashError.message}` };
  }

  // 3. Perform Safe Execution Simulation
  const simulationResult = await executionEngine.simulateCall(
    implementationTarget.modulePath,
    implementationTarget.method,
    rawPayload
  );

  if (!simulationResult.success) {
    return { valid: false, reason: `Execution simulation failed: ${simulationResult.error}` };
  }

  // 4. Semantic Validation: Ensure simulation output conforms to specifications.
  // Using the mock utility defined above.
  const semanticValidation = validateSchema(rawPayload, details.specification);
  if (!semanticValidation.valid) {
      return { valid: false, reason: `Semantic validation failed against specification.` };
  }
  
  return { 
    valid: true, 
    simulationReport: simulationResult.report,
    message: 'Payload integrity verified and execution simulated successfully.'
  };
}

const KERNAL_CONSTANTS = {
  GITHUB_API: "https://api.github.com/repos",
  GEMINI_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  GOVERNANCE_ENDPOINT: "https://api.kernal.gov/v1/config" // New endpoint for Governance Adapter
};

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  isCooling: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Uplink',
  cycleCount: 0,
  successCount: 0,
  errorCount: 0,
  absorptionRate: 0,
  currentTarget: 'None',
  logs: [],
  governanceConfig: { 
    governance_cycle_ms: 60000, 
    min_r_index_threshold: 50,
    dynamic_threshold_adjustment: true
  },
  metrics: {
    wScore: 0,
    rIndex: 0,
    threshold: 0,
    isOperational: false
  },
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernal.js', 
    cycleDelay: 60000 
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'HUNTING' : 'STANDBY' };
    case 'SET_COOLING': return { ...state, isCooling: action.value, status: action.value ? 'COOLING' : 'IDLE' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'SET_TARGET': return { ...state, currentTarget: action.target };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'SET_GOV_CONFIG':
        return { 
            ...state, 
            governanceConfig: { ...state.governanceConfig, ...action.config },
            config: { ...state.config, cycleDelay: action.config.governance_cycle_ms || state.config.cycleDelay } // Update cycle delay dynamically
        };
    case 'UPDATE_METRICS':
        return { ...state, metrics: action.metrics };
    case 'INCREMENT_CYCLE': 
      return { 
        ...state, 
        cycleCount: state.cycleCount + 1, 
        successCount: state.successCount + (action.success ? 1 : 0),
        errorCount: state.errorCount + (action.error ? 1 : 0),
        absorptionRate: Math.min(100, state.absorptionRate + (action.gain || 0)) 
      };
    default: return state;
  }
}

const safeAtou = (str) => {
  if (!str) return "";
  try {
    const cleaned = str.replace(/\s/g, '');
    return decodeURIComponent(Array.prototype.map.call(atob(cleaned), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) { return atob(str.replace(/\s/g, '')); } 
};

const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernal-v6-9';

export default function App() {
  const [state, dispatch] = useReducer