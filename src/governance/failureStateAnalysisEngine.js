/**
 * F-01: Failure State Analysis Engine (FSAE)
 * 
 * Purpose: Processes P-01 (Trust Calculus) failures and M-02 (R-INDEX) rejections
 * to generate specific, measurable, and machine-readable refinement mandates. 
 * Prevents inefficient cycling of low-integrity proposals.
 *
 * Note: v94.1 focuses on structured mandates using constants defined in governanceConstants.
 */

const FAILURE_STAGES = {
    P01_TRUST_CALCULUS: 'EPDP C: P-01',
    M02_R_INDEX_READINESS: 'EPDP B: R-INDEX'
};

const DEFAULT_R_INDEX_TARGET = 0.75;
const VETO_RETRY_TARGET = 0.98;

class FailureStateAnalysisEngine {
    constructor(policyEngine, metricsSystem) {
        this.C15 = policyEngine; // Policy Engine (Governance rules access)
        this.ATM = metricsSystem; // Telemetry and Metrics System (Trust weightings/diagnostics)
        // Assumes C15 provides access to structured remediation maps
        this.RemediationMap = this.C15.getFailureRemediationMap(); 
    }

    analyze(failureReport) {
        const { stage, reason, payloadHash } = failureReport;
        
        // Mandate structure designed for machine consumption by Stage 2 (Proposal Generator)
        let mandate = {
            targetProposal: payloadHash,
            requiredActions: [], // Detailed machine-readable directives (objects)
            refinementMandates: [], // Human/Legacy string output
            newRIndexTarget: DEFAULT_R_INDEX_TARGET
        };

        switch (stage) {
            case FAILURE_STAGES.P01_TRUST_CALCULUS:
                this._analyzeTrustCalculusFailure(reason, mandate);
                break;
            case FAILURE_STAGES.M02_R_INDEX_READINESS:
                this._analyzeRIndexFailure(reason, mandate);
                break;
            default:
                mandate.refinementMandates.push('UNCATEGORIZED FAILURE: Input stage unknown. Manual review required.');
        }

        this.logMandate(mandate);
        return mandate;
    }

    /**
     * Handles failures stemming from insufficient Trust Calculus (P-01) scores.
     */
    _analyzeTrustCalculusFailure(reason, mandate) {
        if (reason.vetoState === true) {
            mandate.refinementMandates.push(`POLICY VIOLATION: Vetoed by source '${reason.vetoSource}'. Resolve C-15 policy conflict.`);
            
            mandate.requiredActions.push({
                type: 'POLICY_RESOLUTION', // Requires standard constants import
                source: reason.vetoSource,
                criticality: 'BLOCKING'
            });
            mandate.newRIndexTarget = VETO_RETRY_TARGET;
            return;
        } 
        
        const scoreGap = reason.requiredConfidence - reason.actualScore;
        
        if (scoreGap > 0) {
            // Use ATM to diagnose which Trust Calculus weighting contributed most to the deficit
            const analysis = this.ATM.diagnoseScoreDeficiency(reason.trustWeightings);

            if (analysis.majorDeficiencyComponent) {
                // Calculate required test boost based on gap severity and component sensitivity
                const requiredIncrease = Math.max(10, Math.ceil(scoreGap * 100 * analysis.sensitivityMultiplier || 1.2));
                
                mandate.refinementMandates.push(`TRUST DEFICIT (${scoreGap.toFixed(4)}): Primary source: '${analysis.majorDeficiencyComponent}'. Targeted integrity boost required.`);
                
                mandate.requiredActions.push({
                    type: 'INCREASE_COVERAGE', 
                    component: analysis.majorDeficiencyComponent,
                    requiredCoverageDelta: requiredIncrease 
                });
            } else {
                 mandate.refinementMandates.push(`LOW TRUST SCORE: Generalized deficiency detected. Increase overall unit test coverage by 15%.`);
                 mandate.requiredActions.push({ type: 'INCREASE_COVERAGE', component: 'GLOBAL', requiredCoverageDelta: 15 });
            }

            // Set R-Index Target higher than required confidence based on gap penalty
            mandate.newRIndexTarget = Math.min(1.0, reason.requiredConfidence + scoreGap * 0.15);
        }
    }

    /**
     * Handles failures stemming from low Readiness Index (M-02) checks.
     */
    _analyzeRIndexFailure(reason, mandate) {
        if (reason.failedComponents && reason.failedComponents.length > 0) {
            const componentList = reason.failedComponents.join(', ');
            
            mandate.refinementMandates.push(`LOW READINESS INDEX: Failed invariant checks in M-02 for components: [${componentList}]. Focus on component stability validation.`);
            
            mandate.requiredActions.push({
                type: 'STABILITY_FOCUS',
                components: reason.failedComponents,
                depth: 'INTERFACE_INTEGRITY'
            });
            
            mandate.newRIndexTarget = DEFAULT_R_INDEX_TARGET + 0.10; // Boost R-Index target slightly
        } else {
             mandate.refinementMandates.push(`R-INDEX FAILURE: General component stability failure detected. Review low-level dependency graph.`);
             mandate.requiredActions.push({ type: 'RESOURCE_AUDIT', scope: 'DEPENDENCIES' });
        }
    }

    logMandate(mandate) {
        // D-01 Audit Logger integration utilizing ATM
        this.ATM.logEvent('FSAE_MANDATE_ISSUED', {
            target: mandate.targetProposal,
            actionsCount: mandate.requiredActions.length,
            newTarget: mandate.newRIndexTarget
        });
    }
}

module.exports = FailureStateAnalysisEngine;
