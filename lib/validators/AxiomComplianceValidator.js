// lib/validators/AxiomComplianceValidator.js

/**
 * NOTE: Types AxiomRule and ComplianceIssue are now defined in the RuleEngineFacade plugin.
 * Access to RuleEngineFacade is assumed to be available globally (as a Kernel plugin).
 */

/**
 * MISSION: Ensure that all generated artifacts (code/scaffolds) strictly adhere to 
 * the immutable architectural Axioms and security mandates defined for Sovereign AGI v94.1.
 */
class AxiomComplianceValidator {
    private config: any;
    // mandatoryAxioms and issues now use 'any' since types AxiomRule/ComplianceIssue are defined externally
    private mandatoryAxioms: any[]; 

    constructor(config: any) {
        this.config = config;
        this.mandatoryAxioms = this._loadCoreAxioms();
    }

    /**
     * Loads defined immutable architectural rules.
     */
    private _loadCoreAxioms(): any[] {
        return [
            { id: "A94_001", severity: "CRITICAL", rule: "All external I/O must pass through the SecureProxy layer." },
            { id: "A94_002", severity: "HIGH", rule: "Scaffolded services must implement structured logging via TelemetryService." },
            { id: "A94_003", severity: "MEDIUM", rule: "Code complexity (Cyclomatic) must not exceed 20 without explicit waiver." },
            { id: "A94_005", severity: "LOW", rule: "Service names should not contain temporary markers like 'test' in final artifacts." }
        ];
    }

    /**
     * @param {Object} compilationArtifact - The result of the compiler (e.g., generated source code, metadata manifest)
     * @returns {any[]} List of compliance issues (Axiom breaches).
     */
    public validate(compilationArtifact: any): any[] {
        // Delegate validation to the abstracted RuleEngineFacade.
        if (typeof RuleEngineFacade !== 'undefined') {
            return RuleEngineFacade.validate({
                artifact: compilationArtifact,
                axioms: this.mandatoryAxioms
            });
        }

        // Fallback if the facade layer itself is missing
        return [{ axiomId: "SYS_FACADE_MISSING", severity: "CRITICAL", message: "Required RuleEngineFacade is missing." }];
    }

    public isCompliant(artifact: any): boolean {
        return this.validate(artifact).length === 0;
    }
}

module.exports = AxiomComplianceValidator;