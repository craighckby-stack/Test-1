/**
 * AGI-KERNEL v7.9.2 - DialAnalysisRuleEngine
 * Optimized for maximum computational efficiency by pre-compiling regexes and using Map-based prefix indexing.
 * Rule execution logic is abstracted into the RuleExecution plugin.
 */
class DialAnalysisRuleEngine {
    /**
     * @param {Array<Object>} rawRules - Array of rule definitions.
     */
    constructor(rawRules) {
        // ruleSets maps a prefix (up to 3 characters) to an array of pre-compiled rules.
        this.ruleSets = new Map(); 
        this._compileRules(rawRules);
        
        // Assume an AGI_KERNEL environment provides a mechanism to load abstracted components.
        // In a standard environment, this would be imported/injected.
        this.ruleExecutor = globalThis.AGI_KERNEL?.loadPlugin('RuleExecution') || {
            execute: (dial, rule) => this._defaultRuleExecutor(dial, rule)
        };

        if (!this.ruleExecutor) {
             throw new Error("Required 'RuleExecution' plugin not available.");
        }
    }

    /**
     * Pre-processes and indexes raw rules for fast lookup.
     * Pre-compiles regex strings into RegExp objects.
     * @param {Array<Object>} rawRules 
     */
    _compileRules(rawRules) {
        if (!Array.isArray(rawRules)) return;

        rawRules.forEach(rule => {
            // 1. Pre-compile Regex object if present
            if (rule.regex && typeof rule.regex === 'string') {
                try {
                    // Store the compiled regex on the rule object itself for reuse
                    rule._compiledRegex = new RegExp(rule.regex);
                } catch (e) {
                    console.warn(`[RuleEngine] Skipping invalid regex in rule ${rule.id || 'unknown'}: ${e.message}`);
                    return; 
                }
            }
            
            // 2. Determine indexing key (prefix up to 3 chars or 'default')
            const prefix = rule.prefix ? String(rule.prefix).substring(0, 3) : 'default';

            if (!this.ruleSets.has(prefix)) {
                this.ruleSets.set(prefix, []);
            }
            this.ruleSets.get(prefix).push(rule);
        });
    }

    /**
     * Fallback executor if the plugin environment is not strictly available.
     * This logic is inherently less abstract and should be handled by the plugin.
     */
    _defaultRuleExecutor(normalizedDial, rule) {
        if (rule._compiledRegex) {
            if (rule._compiledRegex.test(normalizedDial)) {
                return { match: true };
            }
        } else if (rule.prefix && normalizedDial.startsWith(rule.prefix)) {
            if (rule.minLen && normalizedDial.length < rule.minLen) return { match: false };
            if (rule.maxLen && normalizedDial.length > rule.maxLen) return { match: false };
            return { match: true };
        }
        return { match: false };
    }

    /**
     * Analyzes a dial string against all rules using prefix optimization.
     * @param {string} dialString
     * @returns {{input: string, normalized: string, match: boolean, ruleId?: string, metadata?: Object}}
     */
    analyze(dialString) {
        if (!dialString) return { input: '', normalized: '', match: false };
        
        // Step 1: Normalize input (remove non-dialing characters immediately)
        const normalizedDial = String(dialString).replace(/[^0-9+*#]/g, '');

        // Step 2: Select candidate rule sets based on prefix (highly efficient lookup)
        const prefixKey = normalizedDial.substring(0, Math.min(3, normalizedDial.length)) || 'default';
        
        // Combine specific prefix rules with any 'default' global rules
        const candidateRules = [
            ...(this.ruleSets.get(prefixKey) || []),
            ...(prefixKey !== 'default' ? (this.ruleSets.get('default') || []) : [])
        ];

        // Step 3: Execute rules sequentially using the abstracted executor
        for (const rule of candidateRules) {
            // The ruleExecutor uses the pre-compiled regex or structure.
            const result = this.ruleExecutor.execute(normalizedDial, rule);
            
            if (result.match) {
                return {
                    input: dialString,
                    normalized: normalizedDial,
                    match: true,
                    ruleId: rule.id,
                    metadata: result.metadata || rule.metadata,
                };
            }
        }

        return { input: dialString, normalized: normalizedDial, match: false };
    }
}