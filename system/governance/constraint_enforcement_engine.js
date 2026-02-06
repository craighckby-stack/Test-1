/**
 * Constraint Enforcement Engine (CEE)
 * Version 3.0 - Sovereign AGI v94.1 Evolution
 * Enforces ACVD governance constraints using standardized static analysis tools and dynamic rule execution.
 * Focus: High performance, clear separation of concerns (analysis vs. enforcement) and improved robustness.
 */

import { ConstraintsConfig } from './acvd_constraints.json'; 
import { SyntaxAnalyzer } from '../utilities/syntax_analyzer'; 
import { EntropyScorer } from '../utilities/entropy_scorer';
import { ScopeMatcher } from '../utilities/scope_matcher'; 
import { SystemLogger } from '../system_core/system_logger'; 

// Define standardized violation types for clarity and downstream handling
const ViolationType = {
    COMPLEXITY: 'Complexity',
    SAFETY: 'Safety',
    QUALITY: 'Quality',
    ARCHITECTURE: 'Architecture'
};

export class ConstraintEnforcementEngine {
    
    /**
     * @param {Object} [dependencies] - Optional injected dependencies for testing/flexibility.
     */
    constructor(dependencies = {}) {
        // Decoupled Dependencies (Dependency Injection)
        this.constraints = dependencies.constraints || ConstraintsConfig;
        this.scopeMatcher = dependencies.scopeMatcher || new ScopeMatcher();
        this.entropyScorer = dependencies.entropyScorer || new EntropyScorer();
        this.syntaxAnalyzer = dependencies.syntaxAnalyzer || new SyntaxAnalyzer();
        this.logger = dependencies.logger || new SystemLogger('CEE');
        
        this.ruleHandlers = {
            COMPLEXITY_THRESHOLD: this._checkComplexityThreshold.bind(this),
            FORBIDDEN_PATTERNS: this._checkForbiddenPatterns.bind(this),
            ENTROPY_DENSITY: this._checkEntropyDensity.bind(this),
            // Future rules mapped here
        };
        
        this.logger.info(`CEE initialized with ${this.constraints.constraint_sets.length} constraint sets.`);
        // Pre-sort constraints by enforcement level (CRITICAL first)
        this._sortedConstraintSets = this._sortConstraints(this.constraints.constraint_sets);
    }

    _sortConstraints(sets) {
         return sets.sort((a, b) => {
            const levelMap = { 'CRITICAL': 3, 'MAJOR': 2, 'MINOR': 1, 'INFO': 0 };
            return (levelMap[b.enforcement_level] || 0) - (levelMap[a.enforcement_level] || 0);
        });
    }

    /**
     * Executes a specific rule check based on its type.
     * Now accepts sharedAnalysis to prevent redundant computation.
     * @param {string} filePath 
     * @param {string} fileContent 
     * @param {Object} rule 
     * @param {Object} sharedAnalysis - Pre-calculated metrics.
     * @returns {Object|null} Violation object or null.
     */
    _executeCheck(filePath, fileContent, rule, sharedAnalysis) {
        const handler = this.ruleHandlers[rule.type];
        if (handler) {
            try {
                // Pass shared analysis to the specific rule handler
                return handler(filePath, fileContent, rule, sharedAnalysis);
            } catch (error) {
                this.logger.error(`Rule execution failed for ${rule.type} on ${filePath}:`, error);
                // System failure during check counts as a CRITICAL violation of governance health
                return {
                    rule: "SYSTEM_FAILURE_CEE",
                    type: ViolationType.SAFETY,
                    level: "CRITICAL",
                    message: `Internal CEE failure during ${rule.type} check execution.`, 
                    data: { ruleId: rule.name, error: error.message }
                };
            }
        }
        this.logger.warn(`No handler defined for rule type: ${rule.type}. Rule skipped.`);
        return null;
    }

    /**
     * Validates a target code file against all relevant governance rules.
     * Optimized to perform heavy static analysis once.
     * @param {string} filePath - Path to the file being validated.
     * @param {string} fileContent - The content of the file.
     * @returns {Array<Object>} List of violations found.
     */
    validate(filePath, fileContent) {
        const violations = [];
        
        // 1. Pre-analysis: Calculate metrics shared across multiple rules (efficiency gain)
        const sharedAnalysis = {
            syntax: this.syntaxAnalyzer.analyze(fileContent),
            entropy: this.entropyScorer.calculateEntropy(fileContent)
        };

        // 2. Iteration and Enforcement
        for (const set of this._sortedConstraintSets) {
            for (const rule of set.rules) {
                // Ensure rule has a level (fall back to set level)
                rule.enforcement_level = rule.enforcement_level || set.enforcement_level;
                
                if (this.scopeMatcher.isMatch(filePath, rule.scope)) {
                    const violation = this._executeCheck(filePath, fileContent, rule, sharedAnalysis);
                    if (violation) {
                        violations.push(violation);
                        // NOTE: Could implement early exit here if a CRITICAL violation is found
                    }
                }
            }
        }
        return violations;
    }

    // --- Rule Handlers ---

    _checkComplexityThreshold(filePath, fileContent, rule, sharedAnalysis) {
        // Use complexity calculated by SyntaxAnalyzer
        const complexity = sharedAnalysis.syntax.cyclomaticComplexity; 

        if (complexity > rule.details.limit) {
            return { 
                rule: rule.name, 
                type: ViolationType.COMPLEXITY, 
                level: rule.enforcement_level, 
                message: `Code complexity (${complexity}) exceeds threshold (${rule.details.limit}).`,
                data: { complexity, limit: rule.details.limit }
            };
        }
        return null;
    }

    _checkForbiddenPatterns(filePath, fileContent, rule, sharedAnalysis) {
        const { structural_patterns, regex_patterns } = rule.details;

        // 1. Check structural/AST patterns (Higher Intelligence Check)
        if (structural_patterns && sharedAnalysis.syntax.ast) {
            for (const structuralId of structural_patterns) {
                if (this.syntaxAnalyzer.matchStructuralPattern(sharedAnalysis.syntax.ast, structuralId)) {
                     return { 
                        rule: rule.name, 
                        type: ViolationType.SAFETY, 
                        level: rule.enforcement_level, 
                        message: `Forbidden structural pattern detected: ${structuralId}`,
                        data: { type: 'structural', patternId: structuralId }
                    };
                }
            }
        }

        // 2. Check simple regex patterns (Fallback/Text Match Check)
        if (regex_patterns) {
             for (const pattern of regex_patterns) {
                if (new RegExp(pattern, 'g').test(fileContent)) { 
                    return { 
                        rule: rule.name, 
                        type: ViolationType.SAFETY, 
                        level: rule.enforcement_level, 
                        message: `Forbidden text pattern matched: '${pattern.substring(0, 40)}...'`,
                        data: { type: 'regex', pattern }
                    };
                }
            }
        }
        return null;
    }
    
    _checkEntropyDensity(filePath, fileContent, rule, sharedAnalysis) {
        // Use pre-calculated entropy score
        const entropyScore = sharedAnalysis.entropy;
        const { min_limit, max_limit } = rule.details;
        
        if (entropyScore < min_limit || entropyScore > max_limit) {
            return { 
                rule: rule.name, 
                type: ViolationType.QUALITY, 
                level: rule.enforcement_level, 
                message: `Entropy density (${entropyScore.toFixed(3)}) is outside acceptable range [${min_limit}, ${max_limit}]. Suggests obfuscation or excessive triviality.`,
                data: { entropyScore, min: min_limit, max: max_limit }
            };
        }
        return null;
    }
}

export const CEE = new ConstraintEnforcementEngine();
