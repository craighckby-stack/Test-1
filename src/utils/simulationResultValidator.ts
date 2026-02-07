import {
    SimulationReport,
    SimulationParameters
} from '../types/simulationTypes';

/** Defines the outcomes of the internal validation check. */
export interface ValidationResult {
    passed: boolean;
    reason: string;
    detail: {
        passRateCheck: boolean;
        latencyCheck: boolean;
        [key: string]: boolean;
    };
}

/**
 * Validates whether the achieved metrics meet or exceed the required parameters defined in the simulation report.
 * This utility is crucial for systems (like the Automated Terminal Manager) consuming the report to make commit/rollback decisions.
 *
 * @param report The definitive SimulationReport.
 * @returns ValidationResult indicating pass/fail based on required tolerances.
 */
export function validateSimulationPass(report: SimulationReport): ValidationResult {
    const { parameters, metrics } = report;
    const results: Partial<ValidationResult['detail']> = {};

    // 1. Validate Pass Rate: Achieved must be >= Required
    results.passRateCheck = metrics.achievedPassRateRatio >= parameters.requiredPassRateRatio;
    let reason = results.passRateCheck ? '' : 'Failed required test pass rate threshold. ';

    // 2. Validate Latency: Post/Baseline Ratio must be <= (1.0 + Max Acceptable Increase)
    const maxToleratedRatio = 1.0 + parameters.maxAcceptableLatencyIncreaseRatio;
    results.latencyCheck = metrics.latencyIncreaseRatio <= maxToleratedRatio;

    if (!results.latencyCheck) {
        reason += `Exceeded maximum acceptable latency increase ratio (${metrics.latencyIncreaseRatio.toFixed(3)} vs Max ${(maxToleratedRatio).toFixed(3)}). `;
    }

    const passed = results.passRateCheck && results.latencyCheck;

    if (passed && report.status !== 'SUCCESS') {
        // This catches cases where metrics are fine but a non-quantitative failure (e.g., 'SYSTEM_CRASH' or 'TOLERANCE_EXCEEDED') was reported internally by the runner.
        reason += 'Systemic instability detected: Quantitative metrics passed, but the reported status was non-successful/fatal.';
    } else if (passed) {
         reason = 'All quantitative metrics are within required tolerances.';
    }

    return {
        passed: passed,
        reason: reason.trim(),
        detail: results as ValidationResult['detail'],
    };
}