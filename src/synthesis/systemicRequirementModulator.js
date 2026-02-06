// Sovereign AGI v94.4 - Systemic Requirement Modulator (SRM)
// Alignment: GSEP Stage 1 (Intent & Scoping)
// Function: Synthesizes aggregated system signals (FBA/SEA/EDP) into a structured, 
// validated M-01 Mutation Intent Request package ready for execution scheduling.

const crypto = require('crypto');
const SystemSignalSynthesizer = require('./SystemSignalSynthesizer');

class SystemicRequirementModulator {
    constructor() {
        // Define a strict M-01 schema internally.
        this.M01_SCHEMA = {
            required: ['targetComponent', 'priorityScore', 'intentType', 'justificationHash', 'signalSources'],
            types: {
                intentType: ['Optimization', 'Bugfix', 'Evolution', 'Refactor', 'Scaffold'],
                priorityScore: 'Number (0-100)',
                targetComponent: 'String (Path/ID)'
            }
        };
        this.synthesizer = new SystemSignalSynthesizer();
    }

    /**
     * Synthesizes complex system signals and generates a high-fidelity M-01 Mutation Intent Request.
     * @param {Object} signals - Aggregated data bundles { fbaData, seaReport, edpSchedule }.
     * @returns {Object} M-01 Request Package or failure object.
     */
    generateM01(signals) {
        // 1. Synthesize signals to derive the systemic need using the dedicated utility.
        const criticalNeed = this.synthesizer.synthesize(signals);

        if (!criticalNeed) {
            return { success: false, reason: "Insufficient systemic pressure detected (P-score below threshold)." };
        }

        // 2. Formulate Mutation Intent structure
        const justificationText = this._generateJustificationText(criticalNeed);

        const M01 = {
            timestamp: Date.now(),
            sourceModule: 'SRM',
            signalSources: criticalNeed.sources, // Track which systems contributed
            intentType: criticalNeed.type, 
            targetComponent: criticalNeed.component,
            priorityScore: criticalNeed.priorityScore, 
            justification: justificationText,
            justificationHash: this._hashJustification(justificationText),
            mutationParams: criticalNeed.mutationParams || {} // Parameters for the actual synthesis
        };

        // 3. Validation
        if (!this._validateM01Schema(M01)) {
            // High-integrity failure state requiring immediate diagnostic capture.
            throw new Error(`SRM_SCHEMA_VIOLATION: Generated M-01 failed internal validation for ${M01.targetComponent}.`);
        }

        console.log(`SRM: Generated M-01 (${M01.intentType}) for ${M01.targetComponent}, P:${M01.priorityScore}.`);
        return { success: true, M01 };
    }

    _generateJustificationText(criticalNeed) {
        return `SRM Synthesis: Requirement modulated to ${criticalNeed.type} on ${criticalNeed.component}. Priority Score: ${criticalNeed.priorityScore}. Input Signal Sources: ${criticalNeed.sources.join(', ')}.`;
    }

    _hashJustification(justification) {
        // Uses the imported crypto module
        return crypto.createHash('sha256').update(justification).digest('hex');
    }

    _validateM01Schema(m01) {
        // Enforce required fields
        const requiredCheck = this.M01_SCHEMA.required.every(key => m01.hasOwnProperty(key));
        
        // Basic type/value checking (Check intent type against accepted list)
        const typeCheck = this.M01_SCHEMA.types.intentType.includes(m01.intentType);
        
        return requiredCheck && typeCheck;
    }
}

module.exports = SystemicRequirementModulator;