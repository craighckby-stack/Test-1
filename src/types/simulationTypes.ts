/**
 * Simulation Configuration and Reporting Types
 * Used by PreCommitSimulationRunner (PSR) and consumed by Automated Terminal Manager (ATM).
 */

export interface SimulationParameters {
    stressLevel: 'low' | 'medium' | 'high' | 'intensive';
    targetLatencyDelta: number; // Acceptable slowdown percentage (e.g., 0.05 for 5% tolerance)
    requiredPassRate: number; // Minimum acceptable test pass rate (e.g., 0.95)
}

export interface TestResultMetrics {
    totalTests: number;
    passedTests: number;
    passRate: number; // 0.0 - 1.0
    initialPerformanceMetric: number; // Baseline metric before mutation
    postMutationPerformanceMetric: number; // Metric after mutation
    performanceDelta: number; // Ratio of post/initial performance (e.g., 1.1 means 10% slowdown)
    resourceCeilingProximity: number; // How close execution came to resource limits (0.0 - 1.0)
}

export interface SimulationReport {
    timestamp: number;
    simulationScore: number; // Final predictive score (0.0 - 1.0)
    status: 'SUCCESS' | 'FAILURE' | 'ROLLBACK_FAILURE';
    metrics: TestResultMetrics;
    failureVector: string | null; // Detailed reason for failure or simulation crash
}