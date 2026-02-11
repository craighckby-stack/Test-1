import { ASTParser } from './parsers/astParser';
import { RecursiveASTTraversal } from '../plugins/RecursiveASTTraversal'; 

/**
 * StaticAnalysisEngine handles configuration, parsing, caching, 
 * and delegates efficient AST traversal to the RecursiveASTTraversal plugin.
 */
class StaticAnalysisEngine {
    /**
     * @param {Array<Object>} rules - A collection of analysis rule objects.
     * @param {Object} [config={}] - Configuration options.
     */
    constructor(rules, config = {}) {
        this.rules = rules;
        this.config = config;
        this.cache = new Map();
        
        // Initialize the Traversal mechanism using the abstracted plugin.
        // The traverser uses _applyRules as its high-performance node handler callback.
        this.traverser = new RecursiveASTTraversal(this._applyRules.bind(this));
    }

    /**
     * Central method to execute analysis rules on a specific node.
     * This logic remains lightweight and focused purely on rule interaction.
     * @private
     */
    _applyRules(node, context) {
        let findings = [];
        
        // Optimization: Iterate rules and execute only if a match is found.
        for (const rule of this.rules) {
            // Assumes rules expose a standardized match() and execute() interface
            if (rule.match && rule.match(node, context)) {
                const violation = rule.execute(node, context);
                if (violation) {
                    findings.push(violation);
                }
            }
        }
        return findings;
    }

    /**
     * Analyzes the provided source code.
     * @param {string} sourceCode
     * @returns {Array} List of analysis violations/findings.
     */
    analyze(sourceCode) {
        // Step 1: Computational efficiency via memoization/caching
        if (this.cache.has(sourceCode)) {
            return this.cache.get(sourceCode);
        }

        // Context setup
        const analysisContext = { 
            source: sourceCode, 
            config: this.config 
        };

        // Step 2: Parse source into AST
        // Assuming ASTParser is optimized and external
        const ast = ASTParser.parse(sourceCode, this.config.parserOptions);
        
        // Step 3: Use the highly efficient, abstracted traverser plugin
        const results = this.traverser.traverse(ast, analysisContext); 
        
        this.cache.set(sourceCode, results);
        return results;
    }
}

export default StaticAnalysisEngine;