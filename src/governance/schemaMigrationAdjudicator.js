// Schema Migration Adjudicator (SMA) V98.0 - Decoupled Simulation & Enhanced Scoring
// GSEP Stage 2/3 Interlock: Ensures state schema integrity during architectural mutation.

import { ASR } from './architectureSchemaRegistrar.js';
import { MCR } from './mutationChainRegistrar.js';
import { MPSE } from './mutationPayloadSpecEngine.js'; 
import { D_01 } from '../core/decisionAuditLogger.js';
// Dependency Injection: SMA delegates heavy computation to SMSE.
import { SMSE } from './schemaMigrationSimulationEngine.js'; 

const SCORE_WEIGHTS = {
    CONTRACT_COMPLIANCE: 0.4,
    MIGRATION_INTEGRITY: 0.6, // Derived from SMSE simulation outcome
};
const MINIMUM_ACCEPTANCE_SCORE = 0.75;
const VALIDATION_THRESHOLD_SCORE = 0.9;

/**
 * The SMA validates proposed schema changes within the M-02 payload against the
 * system state (MCR) and mandated contracts (ASR). It delegates heavy simulation
 * to SMSE, integrates results, and determines final acceptance.
 */
export class SchemaMigrationAdjudicator {

    constructor() {
        // Stateless, dependency injection occurs via import/runtime context.
    }

    /**
     * Executes the formal schema compatibility check.
     * @param {object} m02Payload - The Mutation Payload (contains the proposed new schema definitions).
     * @returns {Promise<{compatibilityScore: number, migrationPlanValidated: boolean, requiredRollbackProcedure: string}>}
     */
    async adjudicate(m02Payload) {
        // --- 0. Payload Pre-Validation ---
        if (!MPSE.validateM02Structure || !MPSE.validateM02Structure(m02Payload)) {
            await D_01.logFailure('SMA', 'M-02 payload failed structural validation against specs or MPSE utility unavailable.');
            return this._vetoResult('Immediate State Veto: Structural Failure');
        }

        const proposedSchema = m02Payload.architecturalSchema;
        if (!proposedSchema) {
            return this._vetoResult('Immediate State Veto: Missing Schema Definition');
        }

        // Fetch fresh context at runtime
        const currentSchemaHash = MCR.getCurrentSchemaHash(); 

        // --- 1. Contract Compliance Check (ASR) ---
        const contractCompliance = await ASR.validateSchemaCompliance(proposedSchema);
        if (contractCompliance.score === 0.0) {
            await D_01.logFailure('SMA', 'Proposed schema failed all architectural contract compliance checks (ASR).');
            return this._vetoResult('Immediate State Veto: Contract Breach');
        }

        // --- 2. Deep Simulation (SMSE Delegation) ---
        // 2a. Differential Analysis (Requires SMSE to fetch historical schema based on hash)
        const diffAnalysis = await SMSE.runDeepSchemaDiff(currentSchemaHash, proposedSchema);

        // 2b. Migration Simulation
        const migrationIntegrityResult = await SMSE.simulateMigrationPath(diffAnalysis, proposedSchema);

        // --- 3. Final Adjudication Score Calculation ---
        const compatibilityScore = this._calculateCompatibilityScore(
            contractCompliance.score,
            migrationIntegrityResult.integrity
        );

        // --- 4. Decision Logging and Output ---
        const migrationValidated = compatibilityScore >= VALIDATION_THRESHOLD_SCORE;

        if (compatibilityScore < MINIMUM_ACCEPTANCE_SCORE) {
            await D_01.logWarning('SMA', `Low Schema Compatibility Score: ${compatibilityScore.toFixed(4)} (Threshold: ${MINIMUM_ACCEPTANCE_SCORE}).`);
        } else {
             await D_01.logSuccess('SMA', `Schema Accepted. Score: ${compatibilityScore.toFixed(4)}. Validation: ${migrationValidated}`);
        }

        return {
            compatibilityScore: compatibilityScore,
            migrationPlanValidated: migrationValidated,
            requiredRollbackProcedure: migrationIntegrityResult.rollbackPlanHash
        };
    }
    
    /**
     * Utility method to standardize score aggregation based on defined weights.
     * @private
     * @param {number} contractScore
     * @param {number} integrityScore
     * @returns {number}
     */
    _calculateCompatibilityScore(contractScore, integrityScore) {
        return (contractScore * SCORE_WEIGHTS.CONTRACT_COMPLIANCE) +
               (integrityScore * SCORE_WEIGHTS.MIGRATION_INTEGRITY);
    }

    /**
     * Standardizes the immediate veto response structure.
     * @private
     * @param {string} reason 
     * @returns {{compatibilityScore: number, migrationPlanValidated: boolean, requiredRollbackProcedure: string}}
     */
    _vetoResult(reason) {
        return { 
            compatibilityScore: 0.0, 
            migrationPlanValidated: false, 
            requiredRollbackProcedure: reason 
        };
    }
}