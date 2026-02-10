interface Rule {
    rule_id: string;
    applies_to: string;
    condition: string; // The expression to evaluate
    action: string;
    severity: string;
}

interface Component {
    component_id: string;
    parameters: Record<string, any>;
}

interface Contract {
    contract_id: string;
    ruleset: Rule[];
    components: Component[];
}

interface ExecutionContext extends Record<string, any> {}

// Simplified Schema Definition for use with the validator tool
const MEC_CONTRACT_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
        contract_id: { type: "string" },
        ruleset: { type: "array" },
        components: { type: "array" }
    },
    required: ["contract_id", "ruleset", "components"]
};


// Assuming SchemaValidationService and SecureExpressionEvaluatorTool are accessible globally
declare const SchemaValidationService: {
    execute: (args: { data: any, schema: any }) => { isValid: boolean, errors: string[] };
};
declare const SecureExpressionEvaluatorTool: {
    execute: (args: { expression: string, context: Record<string, any> }) => boolean;
};


class MECContractInterpreter {
    private contract: Contract;
    private ruleIndex: Record<string, Rule> = {};
    private componentIndex: Record<string, Component> = {};

    constructor(contractJson: Contract) {
        this.contract = contractJson;
        this.validateSchema();
        this.indexRules();
    }

    private validateSchema() {
        // Replaced manual checks with SchemaValidationService
        const validationResult = SchemaValidationService.execute({
            data: this.contract,
            schema: MEC_CONTRACT_SCHEMA
        });

        if (!validationResult.isValid) {
            const errors = validationResult.errors.map(e => (typeof e === 'string' ? e : e.message || 'Unknown error')).join(', ');
            throw new Error(`MEC Contract failed structural validation: ${errors}`);
        }
        console.log(`Contract ${this.contract.contract_id} loaded successfully.`);
    }

    private indexRules() {
        this.contract.ruleset.forEach(rule => {
            this.ruleIndex[rule.rule_id] = rule;
        });
        this.contract.components.forEach(comp => {
            this.componentIndex[comp.component_id] = comp;
        });
    }

    public getRulesForComponent(componentId: string): Rule[] {
        return this.contract.ruleset.filter(rule => rule.applies_to === componentId);
    }

    /**
     * Executes a rule based on an external execution context, using a secure evaluation tool.
     */
    public executeRule(ruleId: string, executionContext: ExecutionContext): { status: string, message?: string, action?: string, severity?: string, details?: string } {
        const rule = this.ruleIndex[ruleId];
        if (!rule) return { status: 'ERROR', message: `Rule ${ruleId} not found.` };

        const component = this.componentIndex[rule.applies_to];
        if (!component) return { status: 'ERROR', message: `Component ${rule.applies_to} not defined.` };

        // Construct the isolated execution environment
        const environment: Record<string, any> = { 
            ...executionContext, 
            parameters: component.parameters 
        };

        try {
            // CRITICAL: Replaced insecure eval() with the SecureExpressionEvaluatorTool plugin
            const result = SecureExpressionEvaluatorTool.execute({
                expression: rule.condition,
                context: environment
            });

            if (result) {
                return { status: 'TRIGGERED', action: rule.action, severity: rule.severity };
            }
            return { status: 'PASS' };

        } catch (e) {
            const error = e as Error;
            console.error(`Error executing rule ${ruleId}:`, error);
            return { status: 'ERROR', message: 'Evaluation failed', details: error.message };
        }
    }
}