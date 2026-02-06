/**
 * Constraint Enforcement Engine (CEE)
 * Version 2.0 - Sovereign AGI v94.1 Evolution
 * Checks code generated or evolved against the ACVD governance constraints, using dynamic rule execution.
 */

import { ConstraintsConfig } from './acvd_constraints.json'; // Assuming direct config import
import { analyzeComplexity } from '../utilities/complexity_analyzer';
import { EntropyScorer } from '../utilities/entropy_scorer';
import { ScopeMatcher } from '../utilities/scope_matcher'; 

export class ConstraintEnforcementEngine {
    constructor() {
        // NOTE: If ConstraintsConfig is large, consider lazy loading or proxying.
        this.constraints = ConstraintsConfig;
        this.entropyScorer = new EntropyScorer();
        this.scopeMatcher = new ScopeMatcher();
        
        this.ruleHandlers = {
            COMPLEXITY_THRESHOLD: this._checkComplexityThreshold.bind(this),
            FORBIDDEN_PATTERNS: this._checkForbiddenPatterns.bind(this),
            ENTROPY_DENSITY: this._checkEntropyDensity.bind(this),
            // Future rule handlers mapped here for dynamic execution
        };
        
        console.log(`CEE initialized with ${this.constraints.constraint_sets.length} constraint sets.`);
    }

    /**
     * Executes a specific rule check based on its type.
     * @param {string} filePath 
     * @param {string} fileContent 
     * @param {Object} rule 
     * @returns {Object|null} Violation object or null.
     */
    _executeCheck(filePath, fileContent, rule) {
        const handler = this.ruleHandlers[rule.type];
        if (handler) {
            return handler(filePath, fileContent, rule);
        }
        console.warn(`[CEE] No handler defined for rule type: ${rule.type}`);
        return null;
    }

    /**
     * Validates a target code file against all relevant governance rules.
     * @param {string} filePath - Path to the file being validated.
     * @param {string} fileContent - The content of the file.
     * @returns {Array<Object>} List of violations found.
     */
    validate(filePath, fileContent) {
        const violations = [];
        // Sort by enforcement level (CRITICAL first) to allow quick failure/prioritization logic later if needed
        const allSets = this.constraints.constraint_sets.sort((a, b) => {
            if (a.enforcement_level === 'CRITICAL') return -1;
            if (b.enforcement_level === 'CRITICAL') return 1;
            return 0;
        });

        for (const set of allSets) {
            set.rules.forEach(rule => {
                if (this.scopeMatcher.isMatch(filePath, rule.scope)) {
                    const violation = this._executeCheck(filePath, fileContent, rule);
                    if (violation) violations.push(violation);
                }
            });
        }
        return violations;
    }

    // --- Rule Handlers ---

    _checkComplexityThreshold(filePath, fileContent, rule) {
        const complexity = analyzeComplexity(fileContent);
        if (complexity > rule.details.limit) {
            return { 
                rule: rule.name, 
                type: 'Complexity', 
                level: rule.enforcement_level, 
                message: `High complexity (${complexity}) exceeds limit (${rule.details.limit}).`,
                data: { complexity }
            };
        }
        return null;
    }

    _checkForbiddenPatterns(filePath, fileContent, rule) {
        for (const pattern of rule.details.patterns) {
            if (new RegExp(pattern, 'g').test(fileContent)) { 
                return { 
                    rule: rule.name, 
                    type: 'Safety', 
                    level: rule.enforcement_level, 
                    message: `Forbidden pattern matched: ${pattern}`,
                    data: { pattern }
                };
            }
        }
        return null;
    }
    
    _checkEntropyDensity(filePath, fileContent, rule) {
        // Checks for extremely high or low entropy, which can indicate obfuscation or triviality.
        const entropyScore = this.entropyScorer.calculateEntropy(fileContent);
        const { min_limit, max_limit } = rule.details;
        
        if (entropyScore < min_limit || entropyScore > max_limit) {
            return { 
                rule: rule.name, 
                type: 'Quality/Obfuscation', 
                level: rule.enforcement_level, 
                message: `Entropy density (${entropyScore.toFixed(3)}) is outside the acceptable range [${min_limit}, ${max_limit}].`,
                data: { entropyScore }
            };
        }
        return null;
    }
}

export const CEE = new ConstraintEnforcementEngine();
