// GFRM Compliance Engine
// Autonomous enforcement layer for GFRM_spec.json

import { GFRMSpec } from '../GFRM_spec'; // Adjusted path/extension assuming interface definition
import { ProcessAudit } from '../../interfaces/AuditSchema';
import { ComplianceAction, ComplianceOutcome, ComplianceSeverity, IRuleEvaluationService } from './types';
import { RuleEvaluationService } from './RuleEvaluationService'; // Proposed Scaffold

/**
 * Defined local types for clarity (assuming external interfaces are similar)
 */
export { ComplianceAction, ComplianceOutcome, ComplianceSeverity };

export interface ComplianceOutcome {
    compliance: boolean;
    severity: ComplianceSeverity;
    action: ComplianceAction;
    riskScore: number; // Add risk score for traceability
    violationDetail?: string;
}

export type ComplianceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ComplianceAction = 'Hard_Shutdown_L5' | 'Escalate_V94' | 'Continue_Optimize' | 'Notify_T3';

class ComplianceEngine {
    private ruleset: GFRMSpec;
    private evaluator: IRuleEvaluationService;

    constructor(spec: GFRMSpec, evaluator?: IRuleEvaluationService) {
        this.ruleset = spec;
        // Dependency Injection for testing and modularity, defaulting to concrete implementation
        this.evaluator = evaluator || new RuleEvaluationService(spec);
    }

    /**
     * Audits a running process against T0 constraints and T1 thresholds.
     * Utilizes asynchronous processing for potential database lookups or complex model execution.
     * @param process The audit snapshot of the running process.
     * @returns The determined compliance outcome and required action.
     */
    public async audit(process: ProcessAudit): Promise<ComplianceOutcome> {
        // 1. T0 Absolute Constraint Check (Immediate Failure)
        const t0Violation = await this.evaluator.checkT0Violations(process);
        if (t0Violation) {
            return { 
                compliance: false, 
                severity: 'CRITICAL', 
                action: 'Hard_Shutdown_L5',
                riskScore: 100, // Max risk score assigned on T0 failure
                violationDetail: t0Violation
            };
        }

        // 2. T1 Operational Risk Assessment (Score based failure)
        const riskScore = await this.evaluator.calculateRisk(process);
        
        // Use optional chaining with fallback for safe ruleset access
        const riskThreshold = this.ruleset.governance_tiers?.tier_1_operational_risk?.risk_tolerance_threshold || 50;

        if (riskScore >= riskThreshold) {
             return { 
                compliance: false, 
                severity: 'HIGH', 
                action: 'Escalate_V94',
                riskScore: riskScore
             };
        }

        // 3. T2 Continuous Optimization (Default success case)
        return { 
            compliance: true, 
            severity: 'LOW', 
            action: 'Continue_Optimize',
            riskScore: riskScore
        };
    }

    /**
     * Utility for refreshing the ruleset if hot reloading is needed.
     */
    public updateRuleset(newSpec: GFRMSpec): void {
        this.ruleset = newSpec;
        this.evaluator.updateRuleset(newSpec); // Ensure evaluator is also updated
    }
}

export default ComplianceEngine;