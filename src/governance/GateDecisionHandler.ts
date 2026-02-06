import { GatingIntegrityAuditReport } from '../types/GatingIntegrityAuditReport';

interface PolicyEngine { blockPipeline(identifier: string): Promise<void>; }
interface AlertingService { sendAlert(alert: { severity: string, message: string }): Promise<void>; }

/**
 * GateDecisionHandler
 * Centralized component responsible for consuming the Gating Integrity Audit Report
 * and translating its PASS/FAIL/CONDITIONAL status into mandatory operational commands (e.g., halt CI/CD, trigger alerts, generate tickets).
 */
export class GateDecisionHandler {

    private policyEngine: PolicyEngine;
    private alertingService: AlertingService;

    constructor(policyEngine: PolicyEngine, alertingService: AlertingService) {
        this.policyEngine = policyEngine;
        this.alertingService = alertingService;
    }

    /**
     * Processes the report and determines the necessary system action.
     * @param report The validated GatingIntegrityAuditReport object.
     * @returns boolean indicating if the entity's progression (e.g., deployment) should be permitted.
     */
    public async enforceDecision(report: GatingIntegrityAuditReport): Promise<boolean> {
        const { overallStatus } = report.auditSummary;

        if (overallStatus === 'FAIL') {
            await this.handleFailure(report);
            return false; // Block execution
        }

        if (overallStatus === 'CONDITIONAL') {
            await this.handleConditionalPass(report);
            return true; // Allow execution, but with mitigation requirement
        }

        console.log(`Gate Decision: PASSED for entity ${report.entity.identifier}.`);
        return true; // Full clearance
    }

    private async handleFailure(report: GatingIntegrityAuditReport): Promise<void> {
        const criticalViolations = report.gatingChecks.filter(c => c.severity === 'CRITICAL' && c.status === 'FAILED');

        await this.alertingService.sendAlert({
            severity: 'CRITICAL',
            message: `GATING BLOCK enforced: Entity ${report.entity.identifier} failed audit. Violations: ${report.auditSummary.violationCount}.`,
        });

        // Enforce blockage at the systemic level
        await this.policyEngine.blockPipeline(report.entity.identifier);

        if (criticalViolations.length > 0) {
            console.error(`GATING BLOCK triggered due to ${criticalViolations.length} CRITICAL severity issues.`);
        }
    }

    private async handleConditionalPass(report: GatingIntegrityAuditReport): Promise<void> {
        const requiredActions = report.gatingChecks
            .filter(c => c.status === 'FAILED' && c.severity !== 'CRITICAL' && c.actionRequired && c.actionRequired.length > 0)
            .flatMap(c => c.actionRequired);

        if (requiredActions.length > 0) {
            // In a production system, this would interact with a ticketing system or automatic remediation tool.
            console.warn(`CONDITIONAL PASS granted for ${report.entity.identifier}. ${requiredActions.length} mitigation actions required.`);
            await this.alertingService.sendAlert({ 
                severity: 'MEDIUM', 
                message: `Conditional passage granted. Mitigation tracking initiated for ${report.entity.identifier}.` 
            });
        }
    }
}
