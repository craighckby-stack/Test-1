/**
 * Constraint Enforcement Engine (CEE)
 * Version 5.0 - Sovereign AGI v94.1 Refactor: Context-Aware, Priority Execution Model
 * Converts CEE to be asynchronous only where necessary (context generation), utilizes explicit handlers
 * derived from rule types, and enforces stricter context verification.
 */

import { ConstraintsConfig } from './acvd_constraints.json'; 
import { SystemLogger } from '../system_core/system_logger'; 
import { ScopeMatcher } from '../utilities/scope_matcher'; 
// Note: SyntaxAnalyzer and EntropyScorer are managed via the AnalysisBroker's dependency tree.

import { ConstraintAnalysisBroker } from './constraint_analysis_broker'; 
import { ConstraintPatternRegistry } from './constraint_pattern_registry'; 

// Define standardized violation types
const ViolationType = {
    COMPLEXITY: 'Complexity',
    SAFETY: 'Safety',
    QUALITY: 'Quality',
    ARCHITECTURE: 'Architecture',
    GOVERNANCE: 'Governance' // Internal CEE failures/missing components
};

/**
 * @typedef {Object} AnalysisContext
 * @property {Object} [syntax] - Output of SyntaxAnalyzer (e.g., ast, cyclomaticComplexity).
 * @property {number} [entropy] - Output of EntropyScorer.
 */

/**
 * @typedef {Object} Violation
 * @property {string} rule
 * @property {string} type - ViolationType enum value
 * @property {string} level - e.g., 'CRITICAL', 'MAJOR'
 * @property {string} message
 * @property {Object} data
 */

export class ConstraintEnforcementEngine {
    
    /**
     * @param {Object} [dependencies] - Optional injected dependencies for testing/flexibility.
     */
    constructor(dependencies = {}) {
        this.logger = dependencies.logger || new SystemLogger('CEE');
        
        // Dependencies
        this.constraints = dependencies.constraints || ConstraintsConfig;
        this.scopeMatcher = dependencies.scopeMatcher || new ScopeMatcher();
        this.analysisBroker = dependencies.analysisBroker || new ConstraintAnalysisBroker({});
        this.patternRegistry = dependencies.patternRegistry || new ConstraintPatternRegistry(); // New Dependency
        
        // Dynamic Rule Handlers mapping (uses convention: _handleRULE_TYPE)
        this.handlerMap = this._initializeHandlers();

        this._sortedConstraintSets = this._sortConstraints(this.constraints.constraint_sets);
        this.logger.info(`CEE initialized, managing ${this._sortedConstraintSets.length} constraint sets.`);
    }
    
    /**
     * Uses reflection to map handlers based on the naming convention '_handleRULE_TYPE'.
     * @returns {Object<string, Function>}
     */
    _initializeHandlers() {
        const handlers = {};
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
            if (key.startsWith('_handle') && key.length > 7) {
                // Extracts TYPE from _handleType, converts to SCREAMING_SNAKE_CASE
                const ruleType = key.substring(7).toUpperCase(); 
                handlers[ruleType] = this[key].bind(this);
            }
        }
        return handlers;
    }

    _sortConstraints(sets) {
         const levelMap = { 'CRITICAL': 3, 'MAJOR': 2, 'MINOR': 1, 'INFO': 0 };
         // Sort descending by criticality
         return sets.sort((a, b) => (levelMap[b.enforcement_level] || 0) - (levelMap[a.enforcement_level] || 0));
    }

    /**
     * Executes a specific rule check synchronously.
     * @param {string} filePath 
     * @param {string} fileContent 
     * @param {Object} rule 
     * @param {AnalysisContext} context - Pre-calculated metrics and required data.
     * @returns {Violation|null} Violation object or null.
     */
    _executeCheck(filePath, fileContent, rule, context) {
        const handler = this.handlerMap[rule.type]; 
        
        if (!handler) {
            this.logger.warn(`No handler defined for rule type: ${rule.type}. Rule skipped. Check naming convention.`);
            return {
                rule: "RULE_DEFINITION_MISSING_HANDLER",
                type: ViolationType.GOVERNANCE, 
                level: "MAJOR",
                message: `Rule definition found but no matching handler for type: ${rule.type}`, 
                data: { ruleId: rule.name }
            };
        }

        try {
            return handler(filePath, fileContent, rule, context);
        } catch (error) {
            this.logger.error(`Rule execution failed for ${rule.type} on ${filePath}.`, error);
            return {
                rule: "SYSTEM_FAILURE_CEE",
                type: ViolationType.GOVERNANCE, 
                level: "CRITICAL",
                message: `Internal CEE failure during ${rule.type} check execution: ${error.message.substring(0, 100)}`, 
                data: { ruleId: rule.name, error: error.message }
            };
        }
    }

    /**
     * Validates a target code file against all relevant governance rules.
     * Optimally fetches only required metrics via the Analysis Broker.
     * @param {string} filePath - Path to the file being validated.
     * @param {string} fileContent - The content of the file.
     * @returns {Promise<Array<Violation>>} List of violations found.
     */
    async validate(filePath, fileContent) {
        const violations = [];
        const activeRules = [];
        const requiredMetrics = new Set();
        
        // 1. Determine applicable rules, prioritize, and aggregate required metrics
        for (const set of this._sortedConstraintSets) {
            for (const rule of set.rules) {
                if (this.scopeMatcher.isMatch(filePath, rule.scope)) {
                    rule.enforcement_level = rule.enforcement_level || set.enforcement_level;
                    activeRules.push(rule);
                    
                    // Use rule definition to gather specific context requirements
                    if (rule.metrics_required && Array.isArray(rule.metrics_required)) {
                        rule.metrics_required.forEach(metric => requiredMetrics.add(metric));
                    }
                }
            }
        }
        
        if (activeRules.length === 0) {
            return violations;
        }
        
        // 2. Intelligent Pre-analysis (Async step)
        /** @type {AnalysisContext} */
        const context = await this.analysisBroker.getContext(fileContent, Array.from(requiredMetrics));

        // 3. Iteration and Enforcement (Synchronous, Priority Execution)
        for (const rule of activeRules) {
            const violation = this._executeCheck(filePath, fileContent, rule, context);
            
            if (violation) {
                violations.push(violation);
                // Intelligence: Stop immediately on CRITICAL violations
                if (violation.level === 'CRITICAL') {
                    this.logger.crit(`Critical violation detected in ${filePath}. Halting rule checks.`);
                    break;
                }
            }
        }

        return violations;
    }

    // --- Rule Handlers (MUST use convention: _handleRULE_TYPE) ---

    _handleCOMPLEXITY_THRESHOLD(filePath, fileContent, rule, context) {
        const complexity = context.syntax?.cyclomaticComplexity; 
        const metricPath = 'syntax.cyclomaticComplexity';

        if (complexity === undefined) {
             return {
                 rule: "METRIC_CONTEXT_MISSING",
                 type: ViolationType.GOVERNANCE,
                 level: "MAJOR",
                 message: `Required metric (${metricPath}) missing from AnalysisContext for rule ${rule.name}.`, 
                 data: { required: metricPath }
             };
        }

        if (complexity > rule.details.limit) {
            return { 
                rule: rule.name, 
                type: ViolationType.COMPLEXITY, 
                level: rule.enforcement_level, 
                message: `Code complexity (${complexity}) exceeds configured threshold (${rule.details.limit}).`, 
                data: { complexity, limit: rule.details.limit }
            };
        }
        return null;
    }

    _handleFORBIDDEN_PATTERNS(filePath, fileContent, rule, context) {
        const { structural_patterns = [], regex_patterns = [] } = rule.details;
        
        // 1. Check structural/AST patterns 
        if (structural_patterns.length > 0) {
             if (!context.syntax?.ast) {
                 return {
                     rule: "METRIC_CONTEXT_MISSING",
                     type: ViolationType.GOVERNANCE,
                     level: "MAJOR",
                     message: `Required metric (syntax.ast) missing from AnalysisContext for structural pattern checks.`, 
                     data: { required: 'syntax.ast' }
                 };
             }

            const syntaxAnalyzer = this.analysisBroker.syntaxAnalyzer; 
            
            for (const structuralId of structural_patterns) {
                const pattern = this.patternRegistry.getPattern(structuralId);

                if (!pattern) {
                     this.logger.warn(`Structural pattern ID '${structuralId}' not found in registry. Skipping check.`);
                     continue;
                }
                
                if (syntaxAnalyzer.matchStructuralPattern(context.syntax.ast, structuralId)) {
                     return { 
                        rule: rule.name, 
                        type: ViolationType.SAFETY, 
                        level: rule.enforcement_level, 
                        message: `Forbidden structural pattern detected: ${structuralId} (${pattern.description || 'unspecified unsafe feature'}).`, 
                        data: { type: 'structural', patternId: structuralId }
                    };
                }
            }
        }

        // 2. Check simple regex patterns 
        if (regex_patterns.length > 0) {
             for (const pattern of regex_patterns) {
                if (new RegExp(pattern, 'gm').test(fileContent)) { 
                    return { 
                        rule: rule.name, 
                        type: ViolationType.SAFETY, 
                        level: rule.enforcement_level, 
                        message: `Forbidden text pattern matched: /${pattern.substring(0, 40)}/...`, 
                        data: { type: 'regex', pattern: pattern }
                    };
                }
            }
        }
        return null;
    }
    
    _handleENTROPY_DENSITY(filePath, fileContent, rule, context) {
        const entropyScore = context.entropy;
        const metricPath = 'entropy';
        const { min_limit, max_limit } = rule.details;

        if (entropyScore === undefined) {
             return {
                 rule: "METRIC_CONTEXT_MISSING",
                 type: ViolationType.GOVERNANCE,
                 level: "MAJOR",
                 message: `Required metric (${metricPath}) missing from AnalysisContext for rule ${rule.name}.`, 
                 data: { required: metricPath }
             };
        }
        
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

    // Future handlers would be added here, e.g., _handleLICENSE_HEADER, _handleAPI_USAGE_RESTRICTION
}

export const CEE = new ConstraintEnforcementEngine();
