// Sovereign AGI v95.0 - Systemic Requirement Modulator (SRM)
// Alignment: GSEP Stage 1 (Intent & Scoping)
// Function: Synthesizes aggregated system signals (FBA/SEA/EDP) into a structured, 
// validated M-01 Mutation Intent Request package ready for execution scheduling.

const crypto = require('crypto');
const SystemSignalSynthesizer = require('./SystemSignalSynthesizer');
const Log = require('../utility/AgiLogger');

/**
 * Defines the strict requirements and constraints for the M-01 Intent Request.
 * Extracted as a constant for easy visibility and future externalization/re-use.
 */
const M01_CONSTRAINTS = {
    requiredFields: ['targetComponent', 'priorityScore', 'intentType', 'justificationHash', 'justification', 'signalSources'],
    validIntentTypes: new Set(['Optimization', 'Bugfix', 'Evolution', 'Refactor', 'Scaffold', 'Security', 'Audit']),
    MAX_PRIORITY: 100,
    MIN_PRIORITY: 10,
};

class SystemicRequirementModulator {
    constructor() {
        this.synthesizer = new SystemSignalSynthesizer();
        this.M01_C = M01_CONSTRAINTS; 
        this.log = new Log('SRM'); // Initialize logger for this module
    }

    /**
     * Synthesizes complex system signals and generates a high-fidelity M-01 Mutation Intent Request.
     * @param {Object} signals - Aggregated data bundles { fbaData, seaReport, edpSchedule }.
     * @returns {{ success: boolean, M01?: Object, error?: Object }} M-01 Request Package or failure object.
     */
    generateM01(signals) {
        // 1. Synthesize signals to derive the systemic need.
        const criticalNeed = this.synthesizer.synthesize(signals);

        // Fail early if systemic pressure is insufficient.
        if (!criticalNeed || criticalNeed.priorityScore < this.M01_C.MIN_PRIORITY) {
            this.log.debug("Insufficient systemic pressure detected.", { score: criticalNeed ? criticalNeed.priorityScore : 'N/A' });
            return { success: false, error: { code: 'P_SCORE_LOW', message: "Systemic pressure score below minimum activation threshold." } };
        }

        // 2. Formulate Mutation Intent structure
        const justificationText = this._generateJustificationText(criticalNeed);

        const M01 = {
            timestamp: Date.now(),
            sourceModule: 'SRM',
            signalSources: criticalNeed.sources, 
            intentType: criticalNeed.type, 
            targetComponent: criticalNeed.component,
            priorityScore: Math.min(criticalNeed.priorityScore, this.M01_C.MAX_PRIORITY), 
            justification: justificationText,
            justificationHash: this._hashJustification(justificationText),
            mutationParams: criticalNeed.mutationParams || {}
        };

        // 3. High-Integrity Validation
        const validationResult = this._validateM01(M01);
        if (!validationResult.isValid) {
            // Structured failure required for traceability.
            this.log.error(`Generated M-01 failed validation for ${M01.targetComponent}.`, { details: validationResult.errors, M01_data: M01 });
            return { 
                success: false, 
                error: { 
                    code: 'M01_VALIDATION_FAILURE', 
                    message: "Generated M-01 failed internal structure and integrity checks.",
                    details: validationResult.errors
                }
            };
        }

        this.log.info(`Generated M-01 (${M01.intentType}) for ${M01.targetComponent}. P:${M01.priorityScore}.`);
        return { success: true, M01 };
    }

    _generateJustificationText(criticalNeed) {
        const sourcesStr = criticalNeed.sources.join(', ');
        return `SRM Synthesis (P:${criticalNeed.priorityScore}): Modulated request type=${criticalNeed.type} targeting component=${criticalNeed.component}. Origin signals: [${sourcesStr}].`;
    }

    _hashJustification(justification) {
        return crypto.createHash('sha256').update(justification, 'utf8').digest('hex');
    }

    /**
     * Performs strict structural validation against defined M01 constraints.
     * @param {Object} m01 
     * @returns {{ isValid: boolean, errors: string[] }}
     */
    _validateM01(m01) {
        const errors = [];
        
        // A. Required Fields Check
        this.M01_C.requiredFields.forEach(key => {
            if (m01[key] === undefined || m01[key] === null) {
                errors.push(`Missing required field: ${key}`);
            }
        });
        if (errors.length > 0) return { isValid: false, errors };
        
        // B. Intent Type Check
        if (!this.M01_C.validIntentTypes.has(m01.intentType)) {
             errors.push(`Invalid intentType: '${m01.intentType}'.`);
        }
        
        // C. Priority Score Check
        const ps = m01.priorityScore;
        if (typeof ps !== 'number' || ps < this.M01_C.MIN_PRIORITY || ps > this.M01_C.MAX_PRIORITY) {
             errors.push(`Invalid priorityScore: ${ps}. Must be between ${this.M01_C.MIN_PRIORITY} and ${this.M01_C.MAX_PRIORITY}.`);
        }
        
        // D. Integrity Check (Hash verification)
        if (m01.justificationHash !== this._hashJustification(m01.justification)) {
             errors.push(`Justification hash failed integrity verification.`);
        }
        
        // E. Target Component Check (Basic sanity)
        if (typeof m01.targetComponent !== 'string' || m01.targetComponent.length < 3) {
             errors.push(`Invalid targetComponent format or length.`);
        }

        return { isValid: errors.length === 0, errors };
    }
}

module.exports = SystemicRequirementModulator;