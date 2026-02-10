/**
 * DCM_FormulaValidator.js
 * Ensures formulas adhere to the constraints defined in DCM_FormulaContext.json
 * before deployment to the L8 Runtime Engine.
 */
class DCM_FormulaValidator {
    private context: any;
    private allowedFunctions: Set<string>;
    private allowedScopes: RegExp;
    private allowedAliases: Set<string>;
    private tokenValidator: any; // ContextTokenValidator

    constructor(contextDefinition: any) {
        this.context = contextDefinition;
        this.allowedFunctions = this._flattenFunctions(contextDefinition.allowed_functions);
        this.allowedScopes = this._buildScopeRegex(contextDefinition.scope_definition);
        this.allowedAliases = this._flattenAliases(contextDefinition.context_aliases);

        // Simulate plugin instantiation/access
        this.tokenValidator = this._createMockValidator();
    }

    // Helper for simulating plugin behavior (to ensure portability)
    _createMockValidator() {
        // Fallback logic mirroring ContextTokenValidator plugin structure
        const contextChecker = this._constraintConfig;
        return {
            execute: (args: any) => {
                const { token } = args;
                if (token.type === 'FUNCTION') {
                    if (!contextChecker.allowedFunctions.has(token.value)) {
                        return { allowed: false, reason: `Disallowed function: ${token.value}` };
                    }
                }
                if (token.type === 'VARIABLE') {
                    const isAllowedVariable = contextChecker.allowedScopes.test(token.value);
                    const isAllowedAlias = contextChecker.allowedAliases.has(token.value);
                    if (!isAllowedVariable && !isAllowedAlias) {
                        return { allowed: false, reason: `Disallowed variable or keyword: ${token.value}` };
                    }
                }
                return { allowed: true };
            }
        }
    }

    _flattenFunctions(funcs: any): Set<string> {
        return new Set(Object.values(funcs).flat());
    }

    _flattenAliases(aliases: any): Set<string> {
        return new Set(Object.values(aliases).flat());
    }

    _buildScopeRegex(scopes: any): RegExp {
        // Generates a comprehensive regex for allowed variables (e.g., /^(T|S|H)-[A-Za-z0-9_]+$/)
        const prefixes = Object.keys(scopes).map(k => scopes[k].replace('-*', '')).join('|');
        return new RegExp(`^(${prefixes})-[A-Za-z0-9_]+$`);
    }

    private get _constraintConfig() {
        return {
            allowedFunctions: this.allowedFunctions,
            allowedScopes: this.allowedScopes,
            allowedAliases: this.allowedAliases
        };
    }

    validate(formulaString: string): { valid: boolean, message: string } {
        if (!formulaString || typeof formulaString !== 'string') {
            return { valid: false, message: 'Input is not a valid formula string.' };
        }
        
        // 1. Syntax Check (Placeholder for real parser integration)
        const tokens = this.mockTokenize(formulaString);
        
        // 2. Constraint Check
        for (const token of tokens) {
            // Use the extracted tool logic via the simulated validator
            const validationResult = this.tokenValidator.execute({ token });

            if (!validationResult.allowed) {
                return { valid: false, message: validationResult.reason };
            }
        }

        // 3. Complexity Check (Requires AST analysis, placeholder)

        return { valid: true, message: 'Formula validated against DCM context constraints.' };
    }

    // Simple mock tokenizer for example demonstration
    mockTokenize(formula: string): Array<{ type: string, value: string }> {
        // NOTE: A real implementation requires a robust lexer/parser combination.
        const regex = /([A-Z]+(?=\())|([A-Z][A-Z0-9_-]*)|([0-9.]+)/g;
        let match;
        const tokens: Array<{ type: string, value: string }> = [];
        while ((match = regex.exec(formula)) !== null) {
            let type: string;
            let value = match[0];
            
            if (value.includes('-')) { 
                type = 'VARIABLE'; 
            } else if (value.toUpperCase() === value) {
                 if (formula.includes(value + '(')) {
                     type = 'FUNCTION';
                 } else {
                     type = 'VARIABLE'; // Covers CONSTANTS/ALIASES too
                 }
            } else { 
                type = 'LITERAL';
            }
            tokens.push({ type, value });
        }
        return tokens;
    }
}