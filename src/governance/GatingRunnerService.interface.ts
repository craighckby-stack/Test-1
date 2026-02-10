/**
 * Optimized GatingRunnerService interface and associated data structures
 * focusing on computational efficiency, concurrency, and recursive abstraction.
 */

// --- Data Structure Definitions ---

/**
 * Definition of a single integrity check within the GICM.
 * Type 'recursive' implies checks must handle nested subChecks.
 */
export interface GatingCheck {
    checkId: string;
    type: 'static' | 'dynamic' | 'recursive' | 'policy';
    criteria: Record<string, any>;
    weight?: number; // Used for scoring contribution
    subChecks?: GatingCheck[];
}

/**
 * The Gating Integrity Check Manifest (GICM) structure.
 */
export interface GatingCheckManifest {
    id: string;
    version: string;
    description: string;
    checks: GatingCheck[];
}

/**
 * Optimized structure for conveying the result of a single check.
 * Designed for low allocation overhead.
 */
export interface GatingCheckResult {
    checkId: string;
    passed: boolean;
    score: number; // Contribution score
    details: string;
    timestamp: number;
    isCached?: boolean; // Indicates if the result was memoized (Requirement 1)
}

// --- Service Interface Definition ---

/**
 * Defines the core contract for executing Gating Integrity Check Manifests.
 * Leverages asynchronous execution and memoization utilities.
 */
export interface GatingRunnerService {

    /**
     * Executes the full GICM, coordinating concurrent execution of root-level checks.
     * (Requirement 4: Concurrency)
     * @param manifest The GICM to process.
     * @param context Runtime execution context.
     * @returns A promise resolving to all resulting check outcomes.
     */
    runGICM(
        manifest: GatingCheckManifest,
        context: Record<string, any>
    ): Promise<GatingCheckResult[]>;

    /**
     * Executes a single GatingCheck definition, handling recursion and memoization internally.
     * (Requirements 1 & 2: Memoization and Efficient Recursion)
     * @param check The check definition.
     * @param context Runtime context.
     * @param depth Current recursion depth (for guarding/optimization).
     * @returns A promise resolving to the result of the check.
     */
    executeCheck(
        check: GatingCheck,
        context: Record<string, any>,
        depth?: number
    ): Promise<GatingCheckResult>;
    
    /**
     * Utility method to compute the canonical hash key for a check execution, aiding in memoization.
     */
    computeCanonicalKey(check: GatingCheck, context: Record<string, any>): string;
}