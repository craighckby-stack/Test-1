import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Layers, Cpu, FileCode, Terminal, Activity, Zap, Database, Search, Target, Scan, Dna, GitMerge, ShieldAlert, ArrowUpCircle, Gauge, DollarSign, Clock, TrendingUp } from 'lucide-react';

/**
 * AGI-KERNAL v7.1.0 - "CRYPTOGRAPHIC CONFIGURATION GOVERNANCE & COST INDEXING RECALIBRATION"
 * MISSION: Linear Expansion, State Audit, Standardized Versioning, ESVS Integrity Adoption, and Cost Optimization.
 * TARGET INTEGRATION: Absorbed core cryptographic constants and protocols from core/config/cryptoConstants.js.
 * LOGIC: The Kernel now centralizes all cryptographic defaults, ensuring the Governance Integrity Layer (GIL)
 *        and State Snapshot Repository (SSR) adhere strictly to mandated hash algorithms (SHA-256) and encoding (UTF-8).
 * New Feature: Integrated Cryptographic Constants Registry (CCR) derived from TARGET_CODE.
 * Update: Strategic Cost Indexer (SCI) weights slightly adjusted for abstraction complexity.
 * 
 * MANDATE ADHERENCE NOTES:
 * 1. TARGET constants centralized in KERNAL_CONSTANTS.CRYPTO.
 * 2. GIL's digest generation now explicitly uses TARGET's defined algorithms.
 * 3. Schema updated to reflect integrated supported integrity algorithms.
 * 4. Code size significantly increased through expansion and refactoring.
 */

const KERNAL_CONSTANTS = {
  CEREBRAS_URL: "https://api.cerebras.ai/v1/chat/completions",
  GITHUB_API: "https://api.github.com/repos",
  // Cost Indexing Constants for SCI calculations
  COST_WEIGHTS: {
    CODE_COMPLEXITY: 0.4,
    NETWORK_LATENCY: 0.3,
    TOKEN_DENSITY: 0.2,
    ABSTRACTION_DEPTH: 0.15 // Slightly increased weight for recursive complexity
  },
  // Governance Integrity Monitor (CIM) Definitions (Absorbed CIM Governance Codes v94.1)
  GOVERNANCE: {
      // Defines the critical configuration files that MUST be integrity monitored.
      CRITICAL_TARGETS: Object.freeze([
          'config/governance.yaml', 
          'config/veto_mandates.json',
          'config/security_policies.json'
      ]),
      // Defines internal error and event codes for strict traceability.
      CIM_CODES: Object.freeze({
          // Initialization and State Codes
          INIT_FAILURE: 'E941A',
          UNINITIALIZED_ACCESS: 'E941B',
          LEDGER_INTERFACE_MISSING: 'E941C',
          INIT_VETO: 'CIM_INIT_VETO',
          INIT_FATAL: 'CIM_INIT_FATAL',
          
          // Integrity Veto Codes (Security Policy Enforcement)
          UNTRACKED_VETO: 'D941C', 
          MUTATION_VETO: 'D941D', 

          // Update/Commit Codes
          UPDATE_VETO: 'E941E', 
          D01_COMMIT_FAILURE: 'D01_COMMIT_FAILURE'
      })
  },
  // Cryptographic Constants Registry (CCR) - Absorbed from TARGET_CODE
  CRYPTO: {
    DEFAULT_HASH_ALGORITHM: 'sha256', // TARGET absorption: standard integrity hashing
    DEFAULT_STRING_ENCODING: 'utf8',  // TARGET absorption: standard data encoding protocol
    // Expanded list of supported hash algorithms for integrity checks (TARGET + Kernel mandated extensions)
    SUPPORTED_INTEGRITY_ALGORITHMS: [
        'sha256',
        'sha512',
        'blake2b512',
        'ripemd160', // Added for expansion
        'whirlpool'
    ],
    // Algorithms mandated for manifest signing
    SIGNING_ALGORITHMS: ['Ed25519', 'ECDSA_P256', 'RSA_PSS'], 
    MAX_DIGEST_LENGTH: 64 // Expected maximum output length (hex chars) for common algorithms
  }
};

/**
 * CONFIGURATION SCHEMAS (Defined for CGM validation)
 * Ensures that the volatile configuration object meets operational requirements.
 */
const CORE_CONFIG_SCHEMA = {
    type: "object",
    title: "AGI_CORE_CONFIGURATION_V1",
    description: "Mandatory fields for GitHub and AI API interaction.",
    required: ["token", "repo", "path", "cerebrasKey", "cycleDelay"],
    properties: {
        token: { type: "string", description: "GitHub Access Token (Read/Write)." },
        repo: { type: "string", description: "Target GitHub Repository (user/repo)." },
        path: { type: "string", description: "Kernel file path within repository for self-evolution." },
        cerebrasKey: { type: "string", description: "AI API Authorization Key for growth generation." },
        cycleDelay: { type: "number", description: "Delay between growth cycles in milliseconds (min 10000)." },
    },
};

const KERNEL_SCHEMAS = {
    CORE_CONFIG: CORE_CONFIG_SCHEMA,
    // Placeholder for future schema expansion (e.g., policy definitions)
    POLICY_DEFINITION: { type: "object", required: ["policyName", "versionID"] },
    SIGNATURE_OBJECT: { 
        type: "object", 
        title: "SignatureObject_V1",
        required: ["algorithm", "value"],
        properties: {
            // Algorithm list sourced from KERNAL_CONSTANTS.CRYPTO for centralized governance
            algorithm: { type: "string", enum: KERNAL_CONSTANTS.CRYPTO.SIGNING_ALGORITHMS },
            value: { type: "string", description: "The hex string representation of the detached signature."}
        }
    }
};

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Ready for Mandatory Expansion',
  cycleCount: 0,
  absorptionRate: 0,
  currentTarget: 'None',
  logs: [],
  currentKernelVersion: 'v7.1.0-unresolved', // Updated Field for KVM output
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernal.js', 
    cerebrasKey: '', 
    cycleDelay: 30000 
  },
  configValidationErrors: [], // New state field to track CGM failures
  lastCycleCost: 0.00, // New Metric: Strategic Cost Index for the last cycle
  averageCostIndex: 0.00, // New Metric: Running average of cost index
  costHistory: [], // New Metric: Stores history for averaging
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': 
      return { 
        ...state, 
        isBooted: true, 
        config: { ...state.config, ...action.config },
        configValidationErrors: action.validationErrors || [] // Store errors if boot succeeded but warnings present
      }; 
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'SET_TARGET': return { ...state, currentTarget: action.target };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'UPDATE_VERSION': return { ...state, currentKernelVersion: action.versionString }; // New Action
    case 'SET_COST_METRICS': {
        const newHistory = [...state.costHistory, action.costIndex];
        // Limit history size to 100 for stable moving average calculation
        const limitedHistory = newHistory.slice(-100);
        const totalCost = limitedHistory.reduce((a, b) => a + b, 0);
        const newAverage = totalCost / limitedHistory.length;
        return {
            ...state,
            lastCycleCost: action.costIndex,
            costHistory: limitedHistory,
            averageCostIndex: parseFloat(newAverage.toFixed(3))
        };
    }
    case 'INCREMENT_CYCLE': 
      return { ...state, cycleCount: state.cycleCount + 1, absorptionRate: Math.min(100, state.absorptionRate + (action.gain || 0)) };
    default: return state;
  }
}

const utoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const atou = (str) => { try { return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); } catch (e) { return atob(str); } };

/**
 * CORE MODULE: Kernel Version Manager (KVM) - Absorbed from TARGET_CODE requirements.
 * Role: Standardized Version Resolution and Audit Trail Tagging.
 * Function: Generates an auditable, fully resolved semantic version string 
 * adhering to the Semantic Versioning 2.0.0 standard with mandatory build metadata.
 */
class KernelVersionManager { 
    
    /**
     * @param {object} config - Initial version configuration.
     * @param {object} config.current_version - Base major and minor parts.
     * @param {number} [config.current_version.major] 
     * @param {number} [config.current_version.minor]
     * @param {string} [config.defaultBuildType] - Default type (e.g., 'AGI-F', 'DEV').
     */
    constructor(config = {}) {
        this.versionConfig = {
            // Base version reflecting the current stable Kernel generation
            current_version: { major: 7, minor: 1, patch: 0 }, // Bumped minor version for crypto integration
            defaultBuildType: 'AGI-F' // Forced Growth Generation Tag
        };
        // Overwrite defaults with any provided configuration
        this.versionConfig = Object.assign(this.versionConfig, config);
        console.info(`[KVM] Initialized to base version: ${this.versionConfig.current_version.major}.${this.versionConfig.current_version.minor}.0`);
    }

    /**
     * Validates the input metadata structure required for robust version resolution.
     * @param {object} metadata 
     * @returns {boolean}
     */
    _validateMetadata(metadata) {
        const isValid = (
            metadata && 
            typeof metadata.buildNumber === 'number' && 
            typeof metadata.commitHash === 'string' && 
            metadata.commitHash.length >= 7
        );
        if (!isValid) {
             console.warn("[KVM Validation] Missing required fields (buildNumber, commitHash, buildType). Hash must be 7+ chars.");
        }
        return isValid;
    }
    
    /**
     * Generates the final, resolved semantic version string.
     * Implements the core logic absorbed and synthesized from the TARGET_CODE.
     * 
     * Pattern: [Major].[Minor].[BuildNumber]-[BuildType]+[CommitHashPrefix]
     * Example: 7.1.123-AGI-F+d0c3fa4
     * 
     * @param {object} metadata - Dynamic build parameters (buildNumber, commitHash, buildType).
     * @returns {string} The full resolved version string, or an error tag.
     */
    generateResolvedVersion(metadata) {
        if (!this._validateMetadata(metadata)) {
            return `VERSION_RESOLUTION_ERROR: INVALID_METADATA_C${this.versionConfig.current_version.major}`; 
        }

        // 1. Extract Major/Minor from persistent configuration
        const { major, minor } = this.versionConfig.current_version;
        
        // 2. Determine effective build type, prioritizing input metadata
        const effectiveBuildType = metadata.buildType || this.versionConfig.defaultBuildType;
        
        // 3. Construct the Core Version string (Major.Minor.BuildNumber)
        const versionString = `${major}.${minor}.${metadata.buildNumber}`;
        
        // 4. Shorten the commit hash for concise metadata (7 chars)
        const hash = metadata.commitHash.substring(0, 7);
        
        // 5. Final Assembly following SemVer standards (Prerelease/Build Meta)
        const finalVersion = `${versionString}-${effectiveBuildType}+${hash}`;
        
        // console.debug(`[KVM] Resolved Version Generated: ${finalVersion}`);
        return finalVersion;
    }
    
    /**
     * Retrieves the current base version configuration object.
     * @returns {object}
     */
    getBaseConfig() {
        return this.versionConfig.current_version;
    }
}

/**
 * GOVERNANCE MODULE: State Snapshot Repository (SSR)
 * Role: EPDP D/E Auxiliary (Atomic State Tracing)
 * Function: Stores an immutable record of cryptographic components defining a System State Hash (SSH).
 * This provides a detailed, persistent audit trail for rollback and integrity checks.
 * NOTE: Currently uses an in-memory Map structure for rapid prototyping, requiring state notifications in React.
 */
const stateSnapshots = new Map();

/**
 * Defines the expected structure for a System State Snapshot.
 * @typedef {{ proposalID: string, configHash: string, codebaseHash: string, ssh: string, timestamp: number }} SystemStateSnapshot
 */

export class StateSnapshotRepository {

    /**
     * Internal utility for checking snapshot validity structure.
     * Ensures all required keys are present and are non-empty strings.
     * @param {any} snapshot 
     * @returns {boolean}
     */
    static _validateSnapshot(snapshot) {
        if (typeof snapshot !== 'object' || snapshot === null) {
            console.error(`[SSR Validation Error] Snapshot object is null or not an object.`);
            return false;
        }
        const requiredKeys = ['proposalID', 'configHash', 'codebaseHash', 'ssh'];
        for (const key of requiredKeys) {
            if (typeof snapshot[key] !== 'string' || snapshot[key].length === 0) {
                console.error(`[SSR Validation Error] Missing or invalid key: ${key} in provided structure.`);
                return false;
            }
        }
        if (typeof snapshot.timestamp !== 'number') {
             console.error(`[SSR Validation Error] Missing or invalid timestamp.`);
             return false;
        }
        return true;
    }

    /**
     * Saves the complete cryptographic context snapshot, ensuring immutability.
     * The proposalID serves as the unique identifier and transaction lock.
     * @param {SystemStateSnapshot} snapshot
     * @returns {void}
     */
    static saveSnapshot(snapshot) {
        if (!StateSnapshotRepository._validateSnapshot(snapshot)) {
            console.error(`[SSR] Critical Error: Invalid snapshot provided. Refusing to store immutable record.`);
            return;
        }

        if (stateSnapshots.has(snapshot.proposalID)) {
            // Immutability Check: Prevent overwriting existing, locked state records.
            console.warn(`[SSR] Warning: Attempted to overwrite state snapshot for Proposal ID ${snapshot.proposalID}. Operation skipped due to immutability mandate.`);
            return;
        }
        
        // Store the immutable record defensively copied and frozen to guarantee read-only status.
        const immutableRecord = Object.freeze({ ...snapshot });
        stateSnapshots.set(snapshot.proposalID, immutableRecord);
        console.info(`[SSR] State snapshot successfully locked and saved for Proposal ID: ${snapshot.proposalID}. Total records: ${stateSnapshots.size}.`);
    }

    /**
     * Retrieves a detailed snapshot by Proposal ID.
     * @param {string} proposalID
     * @returns {SystemStateSnapshot | undefined}
     */
    static getSnapshot(proposalID) {
        // Returns the frozen object or undefined, maintaining read-only access.
        return stateSnapshots.get(proposalID);
    }

    /**
     * Checks if a snapshot exists for a given Proposal ID, crucial for integrity checks.
     * @param {string} proposalID
     * @returns {boolean}
     */
    static hasSnapshot(proposalID) {
        return stateSnapshots.has(proposalID);
    }

    /**
     * Clears all snapshots. Restricted to privileged environment resets/testing.
     * @returns {void}
     */
    static clearRepository() {
        const count = stateSnapshots.size;
        stateSnapshots.clear();
        console.warn(`[SSR] Repository Cleared. ${count} records forcefully removed.`);
    }

    /**
     * Retrieves the total count of stored snapshots (Metric).
     * @returns {number}
     */
    static getSize() {
        return stateSnapshots.size;
    }
}

/**
 * Utility for robust URI pattern matching, supporting path parameters and complex globbing.
 * This moves complex route comparison logic out of the core ValidationContextResolver,
 * making the resolver lighter and paving the way for supporting RESTful parameter validation.
 */
export class RouterPatternMatcher {

    /**
     * Checks if a target path matches a given pattern.
     * Supports exact match, trailing wildcard (*), and basic named parameters (:param).
     * 
     * @param {string} targetPath - The incoming URI path (e.g., '/users/123/details').
     * @param {string} pattern - The configured pattern (e.g., '/users/:id/*').
     * @returns {boolean} True if matched.
     */
    static matches(targetPath, pattern) {
        if (targetPath === pattern) {
            return true; // Exact match
        }

        // Convert RESTful patterns and globbing into a regular expression.
        // Note: Escapes dots and replaces common syntax for path components.
        let regexPattern = pattern
            .replace(/\./g, '\.') 
            .replace(/:([a-zA-Z0-9_]+)/g, '([^/]+)') // Match named parameters
            .replace(/\/\*$/, '(/.*)?'); // Match trailing wildcard '/*'
        
        // Ensure the pattern matches the full path from start to end.
        const regex = new RegExp(`^${regexPattern}$`); 
        
        // Perform regex test
        return regex.test(targetPath);
    }
}

/**
 * GOVERNANCE MODULE: Configuration Governance Module (CGM)
 * Role: Ensures runtime configuration integrity based on defined JSON Schemas.
 * Logic absorbed and enhanced from TARGET_CODE (validateConfig).
 */
class ConfigurationGovernanceModule {
    
    /**
     * Executes structural and type validation based on a schema.
     * Implements the core logic of the TARGET_CODE's configuration validator.
     * 
     * @param {object} configObject - The configuration structure to validate.
     * @param {object} schema - The predefined JSON schema.
     * @param {string} configName - Descriptive name.
     * @returns {object} { isValid: boolean, errors: Array<string> }
     */
    static validateConfig(configObject, schema, configName) {
        const results = { isValid: true, errors: [] };

        // 1. Root Structure Check (Mandatory existence check)
        if (!configObject || typeof configObject !== 'object' || Object.keys(configObject).length === 0) {
            results.isValid = false;
            results.errors.push(`[Fatal] Config ${configName} is empty, null, or not an object.`);
            return results;
        }

        // 2. Required Field Check (Core implementation derived from TARGET_CODE)
        if (schema && Array.isArray(schema.required)) {
            for (const key of schema.required) {
                if (!(key in configObject) || configObject[key] === null || configObject[key] === '') {
                    results.isValid = false;
                    results.errors.push(`[CGM Error] Config ${configName} missing or empty required field: ${key}.`);
                }
            }
        }
        
        // 3. Type Checking Simulation (Critical path properties only)
        if (schema && schema.properties && results.isValid) {
            for (const [key, definition] of Object.entries(schema.properties)) {
                if (key in configObject && configObject[key] !== null) {
                    const actualType = typeof configObject[key];
                    const expectedType = definition.type;

                    if (expectedType === 'string' && actualType !== 'string') {
                         results.isValid = false;
                         results.errors.push(`[CGM Type Error] ${configName}.${key} expected '${expectedType}', got '${actualType}'.`);
                    } else if (expectedType === 'number' && actualType !== 'number') {
                         // Allow string inputs for numbers (like cycleDelay) but check convertibility
                         if (actualType === 'string' && !isNaN(parseInt(configObject[key], 10))) {
                              // If convertible, issue warning but continue (soft fail)
                              console.warn(`[CGM Soft Warning] ${configName}.${key} received string, treating as number.`);
                         } else {
                              results.isValid = false;
                              results.errors.push(`[CGM Type Error] ${configName}.${key} expected '${expectedType}', got '${actualType}'.`);
                         }
                    }
                }
            }
        }

        if (!results.isValid) {
            console.error(`[CGM Audit Failure] Configuration ${configName} failed integrity checks. ${results.errors.length} critical faults.`);
        }

        return results;
    }
}

/**
 * CORE OPTIMIZATION MODULE: Computational Efficiency Optimizer (CEO)
 * Role: Pre-processes metrics to ensure they meet minimum efficiency thresholds 
 * before feeding into the SCI. Serves as a redundant safety input filter (RSIF).
 * Implements validation and normalization for complex cost inputs.
 */
class ComputationalEfficiencyOptimizer {
    
    /**
     * Validates and analyzes raw cost metrics.
     * @param {object} metrics - Raw metrics (latency, delta, tokens).
     * @returns {object} Normalized and sanitized metrics.
     */
    static normalizeAndValidate(metrics) {
        const validatedMetrics = {};
        let validationPass = true;

        // 1. Latency Check: Must be non-negative and finite.
        if (typeof metrics.apiLatency !== 'number' || metrics.apiLatency < 0 || !isFinite(metrics.apiLatency)) {
            console.warn("[CEO Warning] API Latency metric failed integrity check. Defaulting to 1000ms.");
            validatedMetrics.apiLatency = 1000;
            validationPass = false;
        } else {
            validatedMetrics.apiLatency = metrics.apiLatency;
        }

        // 2. Code Delta Check: Must be non-negative integer (representing lines/bytes added).
        if (typeof metrics.codeDelta !== 'number' || metrics.codeDelta < 0 || !Number.isInteger(metrics.codeDelta)) {
            console.error("[CEO Error] Code Delta must be a non-negative integer. Setting to zero.");
            validatedMetrics.codeDelta = 0;
            validationPass = false;
        } else {
            validatedMetrics.codeDelta = metrics.codeDelta;
        }

        // 3. Token Check: Must be positive, minimum 100 for proper indexing.
        if (typeof metrics.tokenEstimate !== 'number' || metrics.tokenEstimate < 100) {
             console.warn("[CEO Warning] Token estimate below minimum threshold (100). Defaulting to 150 tokens.");
             validatedMetrics.tokenEstimate = 150;
             validationPass = false;
        } else {
            validatedMetrics.tokenEstimate = metrics.tokenEstimate;
        }
        
        // 4. Recursive Abstraction Depth (Must be 1-5 for simulation)
        validatedMetrics.recursionDepth = Math.max(1, Math.min(5, metrics.recursionDepth || 1));

        if (!validationPass) {
            console.warn("[CEO Audit] Metrics were sanitized. Input integrity compromised.");
        }
        
        return validatedMetrics;
    }
}

/**
 * CORE OPTIMIZATION MODULE: Strategic Cost Indexer (SCI)
 * TARGET ABSORPTION: Optimized Strategic Cost Indexer for maximum computational efficiency and recursive abstraction
 * Role: Provides high-fidelity, recursive analysis of computational overhead 
 * resulting from growth cycles, focusing on efficiency and resource abstraction (T2).
 * 
 * Output: A normalized Strategic Cost Index (SCI) between 0.00 and 10.00.
 */
class StrategicCostIndexer {
    
    constructor(weights = KERNAL_CONSTANTS.COST_WEIGHTS) {
        this.weights = weights;
        this.CEO = ComputationalEfficiencyOptimizer; // Reference to the pre-processor
        console.info(`[SCI] Cost Indexer initialized with weights: ${JSON.stringify(weights)}`);
    }

    /**
     * Calculates the normalized score for Code Complexity (Size Delta).
     * Max complexity is currently benchmarked at 50,000 bytes/cycle.
     * @param {number} delta - Change in code size (bytes).
     * @returns {number}
     */
    _calculateComplexityScore(delta) {
        // Normalize delta to a scale of 0 to 1, assuming 50kB is maximum expected growth.
        const normalizedDelta = Math.min(1.0, delta / 50000);
        return normalizedDelta * this.weights.CODE_COMPLEXITY;
    }

    /**
     * Calculates the normalized score for Network Latency (Time Cost).
     * Max acceptable latency is 10,000ms.
     * @param {number} latencyMs - Time taken for API interactions (milliseconds).
     * @returns {number}
     */
    _calculateLatencyScore(latencyMs) {
        // Normalize latency to a scale of 0 to 1. Higher latency = higher score (worse).
        const normalizedLatency = Math.min(1.0, latencyMs / 10000);
        return normalizedLatency * this.weights.NETWORK_LATENCY;
    }

    /**
     * Calculates the normalized score for Token Density (Monetary Cost Simulation).
     * Max expected tokens per request is 50,000.
     * @param {number} tokens - Total tokens used for input/output.
     * @returns {number}
     */
    _calculateTokenDensityScore(tokens) {
        // Normalize token usage to a scale of