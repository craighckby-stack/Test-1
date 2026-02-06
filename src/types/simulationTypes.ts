/**
 * Simulation Configuration and Reporting Types
 * Used by PreCommitSimulationRunner (PSR) and consumed by Automated Terminal Manager (ATM).
 * Sovereign AGI v94.1 Refactoring: Introduced reusable types, enforced immutability, and clarified numerical expectations.
 */

// --- Reusable Core Types ---

export const SIMULATION_PROCESS_STRESS_LEVELS = ['low', 'medium', 'high', 'intensive'] as const;
/** Defines the expected stress load for the simulation run. */
export type SimulationStressLevel = typeof SIMULATION_PROCESS_STRESS_LEVELS[number];

export const SIMULATION_REPORT_STATUSES = ['SUCCESS', 'FAILURE', 'ROLLBACK_FAILURE'] as const;
/** Defines the terminal state of the simulation outcome. */
export type SimulationStatusType = typeof SIMULATION_REPORT_STATUSES[number];

// --- Interface Definitions ---

/**
 * Defines the parameters used to configure a specific simulation run.
 */
export interface SimulationParameters {
    readonly stressLevel: SimulationStressLevel;
    /** Acceptable slowdown ratio relative to baseline (e.g., 0.05 for 5% tolerance). Range: 0.0 to N. */
    readonly targetLatencyDelta: number; 
    /** Minimum acceptable test pass rate ratio (0.0 - 1.0). */
    readonly requiredPassRate: number;
}

/**
 * Detailed metrics gathered during the test execution phase of the simulation.
 */
export interface TestResultMetrics {
    readonly totalTests: number;
    readonly passedTests: number;
    readonly passRate: number; // Ratio: 0.0 - 1.0
    /** Baseline performance value (e.g., total execution time in ms). */
    readonly initialPerformanceMetric: number;
    /** Performance value after applying changes. */
    readonly postMutationPerformanceMetric: number;
    /** Ratio of post/initial performance (e.g., 1.1 means 10% slowdown; 0.9 means 10% improvement). */
    readonly performanceDelta: number; 
    /** Normalized measure of how close execution came to resource limits (0.0 = low use, 1.0 = ceiling hit). */
    readonly resourceCeilingProximity: number; 
}

/**
 * The definitive report summarizing the outcome of a pre-commit simulation run.
 */
export interface SimulationReport {
    readonly timestamp: number;
    /** Final predictive confidence/score (0.0 - 1.0). */
    readonly simulationScore: number;
    readonly status: SimulationStatusType;
    readonly metrics: TestResultMetrics;
    /** Detailed reason for failure, exception stack, or simulation crash vector. */
    readonly failureVector: string | null;
}