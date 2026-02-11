import { IRiskThresholdChecker, ComplianceResult } from '../../plugins/Compliance/RiskThresholdChecker';
import { IRiskFloorConfigRegistryKernel } from '../../config/IRiskFloorConfigRegistryKernel';

/**
 * Manages specialized risk floor compliance checks using an abstracted evaluation mechanism.
 * Adheres to the Kernel pattern for dependency management and configuration separation.
 */
export class RiskFloorComplianceKernel {
    private checker!: IRiskThresholdChecker;
    private configRegistry!: IRiskFloorConfigRegistryKernel;

    /**
     * @param dependencies Dependencies required for initialization.
     */
    constructor(dependencies: {
        checker: IRiskThresholdChecker;
        configRegistry: IRiskFloorConfigRegistryKernel;
    }) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Isolates dependency assignment and validation to ensure synchronous setup extraction.
     * @private
     */
    #setupDependencies(dependencies: {
        checker: IRiskThresholdChecker;
        configRegistry: IRiskFloorConfigRegistryKernel;
    }): void {
        if (!dependencies.checker) {
            throw new Error("IRiskThresholdChecker must be provided to RiskFloorComplianceKernel.");
        }
        if (!dependencies.configRegistry) {
            throw new Error("IRiskFloorConfigRegistryKernel must be provided to RiskFloorComplianceKernel.");
        }
        this.checker = dependencies.checker;
        this.configRegistry = dependencies.configRegistry;
    }

    /**
     * Checks a set of critical operational metrics against predefined minimum thresholds (Risk Floors).
     *
     * @param currentOperationalMetrics Key/value pairs of current measured metrics.
     * @returns The result of the compliance check.
     */
    public checkCoreOperationalRisk(currentOperationalMetrics: Record<string, number>): ComplianceResult {
        // Retrieve configuration from the injected registry, eliminating hardcoded values.
        const CORE_RISK_FLOORS = this.configRegistry.getCoreRiskFloors();

        return this.checker.evaluate(currentOperationalMetrics, CORE_RISK_FLOORS);
    }
}