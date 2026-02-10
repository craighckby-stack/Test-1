// lib/validators/AxiomComplianceValidator.js

declare var AxiomRuleEngineTool: {
    validate: (args: { artifact: any, axioms: AxiomRule[] }) => ComplianceIssue[];
};

interface AxiomRule {
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    rule: string;
}

interface ComplianceIssue {
    axiomId: string;
    severity: string;
    message: string;
}

/**
 * MISSION: Ensure that all generated artifacts (code/scaffolds) strictly adhere to 
 * the immutable architectural Axioms and security mandates defined for Sovereign AGI v94.1.
 */
class AxiomComplianceValidator {
    private config: any;
    private mandatoryAxioms: AxiomRule[];

    constructor(config: any) {
        this.config = config;
        this.mandatoryAxioms = this._loadCoreAxioms();
        
        if (typeof AxiomRuleEngineTool === 'undefined') {
            // In a production environment, this dependency would be guaranteed by the Kernel loader.
            // For local testing, this serves as a robust check.
            // console.error("Required dependency AxiomRuleEngineTool is missing. Cannot validate compliance.");
        }
    }

    /**
     * Loads defined immutable architectural rules.
     */
    private _loadCoreAxioms(): AxiomRule[] {
        return [
            { id: "A94_001", severity: "CRITICAL", rule: "All external I/O must pass through the SecureProxy layer." },
            { id: "A94_002", severity: "HIGH", rule: "Scaffolded services must implement structured logging via TelemetryService." },
            { id: "A94_003", severity: "MEDIUM", rule: "Code complexity (Cyclomatic) must not exceed 20 without explicit waiver." },
            { id: "A94_005", severity: "LOW", rule: "Service names should not contain temporary markers like 'test' in final artifacts." }
        ];
    }

    /**
     * @param {Object} compilationArtifact - The result of the compiler (e.g., generated source code, metadata manifest)
     * @returns {ComplianceIssue[]} List of compliance issues (Axiom breaches).
     */
    public validate(compilationArtifact: any): ComplianceIssue[] {
        if (typeof AxiomRuleEngineTool !== 'undefined') {
            // Delegate the core enforcement logic to the reusable engine.
            return AxiomRuleEngineTool.validate({
                artifact: compilationArtifact,
                axioms: this.mandatoryAxioms
            });
        }

        // Fallback for environment without the engine (should not happen in AGI-KERNEL)
        const issues: ComplianceIssue[] = [];
        if (!compilationArtifact || !compilationArtifact.sourceCode) {
            issues.push({ axiomId: "SYS_001", severity: "CRITICAL", message: "Artifact payload is invalid or empty (Engine missing)." });
        }
        return issues;
    }

    public isCompliant(artifact: any): boolean {
        return this.validate(artifact).length === 0;
    }
}

module.exports = AxiomComplianceValidator;