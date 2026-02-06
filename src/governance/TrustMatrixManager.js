/**
 * src/governance/TrustMatrixManager.js
 * Purpose: Manages the dynamic evolution of the RCDM weighting_matrix (trust matrix)
 * based on real-time performance, compliance history, and behavioral audits of actors.
 * This separation ensures the PolicyEngine remains a fast, read-only enforcer.
 *
 * Refactoring Rationale:
 * 1. Implemented a robust, asynchronous internal debouncer (`_performSave` and `scheduleSave`) to handle race conditions
 *    where updates occur while a disk write is already in progress (`isSaving`, `needsSave`), ensuring high I/O efficiency and eventual consistency.
 * 2. Formalized initial synchronous loading into `_loadMatrix` for clearer initialization flow.
 * 3. Enhanced `recalculateWeight` with stricter input validation and standard clamping.
 * 4. Added a synchronous `getWeight` utility method for fast lookups.
 */
class TrustMatrixManager {

    static DEFAULT_CONFIG = {
        smoothingFactor: 0.15,   // Base EMA learning rate (alpha)
        penaltyBoost: 0.35,      // Higher alpha applied immediately on negative feedback for faster decay
        saveDebounceMs: 4000,    // Time (ms) to wait before writing to persistent storage
        initialTrustScore: 0.5   // Default trust for new actors
    };

    /**
     * @param {Object} persistenceLayer - Must implement load(key) and save(key, data)
     * @param {Object} auditLog - Must implement log() and error()
     * @param {Object} [config={}] - Optional configuration overrides.
     */
    constructor(persistenceLayer, auditLog, config = {}) {
        this.persistence = persistenceLayer;
        this.auditLog = auditLog;
        this.config = { ...TrustMatrixManager.DEFAULT_CONFIG, ...config };

        // Internal state for controlling asynchronous writes
        this.saveTimer = null;
        this.isSaving = false;  // Flag indicating if an async write is currently happening
        this.needsSave = false; // Flag indicating if an update occurred while 'isSaving' was true

        // Synchronous Load: Required for immediate service startup.
        this._loadMatrix();
    }

    _loadMatrix() {
        try {
            this.currentMatrix = this.persistence.load('weighting_matrix') || {};
            this.auditLog.log({ type: 'MATRIX_LOAD', status: 'Success', size: Object.keys(this.currentMatrix).length });
        } catch (error) {
            // Fail safe: If load fails, start with an empty matrix to prevent blocking execution.
            this.currentMatrix = {};
            this.auditLog.error({ type: 'MATRIX_LOAD_ERROR', message: `Failed to load initial matrix: ${error.message}` });
        }
    }

    /**
     * Executes the actual persistence write operation.
     * Handles concurrent updates by checking the needsSave flag upon completion.
     */
    async _performSave() {
        if (this.isSaving) {
            // Should not happen if called correctly via scheduleSave, but as a safeguard:
            this.needsSave = true;
            return;
        }

        this.isSaving = true;
        this.needsSave = false;

        try {
            await this.persistence.save('weighting_matrix', this.currentMatrix);
            this.auditLog.log({ type: 'MATRIX_PERSIST', status: 'Complete', size: Object.keys(this.currentMatrix).length });
        } catch (error) {
            this.auditLog.error({ type: 'MATRIX_PERSIST_ERROR', error: error.message });
        } finally {
            this.isSaving = false;
            
            // Critical check: If new updates occurred during the slow save process, reschedule immediately.
            if (this.needsSave) {
                this.scheduleSave();
            }
        }
    }

    /**
     * Schedules persistence of the matrix using a debounce delay.
     */
    scheduleSave() {
        if (this.saveTimer) {
            // Reset the timer to extend the debounce period.
            clearTimeout(this.saveTimer);
        }

        this.saveTimer = setTimeout(() => {
            this.saveTimer = null;
            this._performSave();
        }, this.config.saveDebounceMs);

        // Optimization for Node.js event loop
        if (this.saveTimer.unref) {
            this.saveTimer.unref();
        }
    }

    /**
     * Updates the weight of a specific actor using Exponential Moving Average (EMA).
     * @param {string} actorId - The ID of the component or agent.
     * @param {number} performanceMetric - Calculated score (0.0 to 1.0).
     * @returns {number} The new calculated trust score/weight.
     */
    recalculateWeight(actorId, performanceMetric) {
        // Input validation
        if (typeof performanceMetric !== 'number' || isNaN(performanceMetric)) {
             this.auditLog.error({ type: 'MATRIX_INVALID_METRIC', actor: actorId, score: performanceMetric });
             return this.getWeight(actorId);
        }
        
        // Initialize score if new actor, otherwise use current weight
        const currentWeight = this.currentMatrix[actorId] ?? this.config.initialTrustScore;
        
        // 1. Determine Alpha (Smoothing Factor)
        let alpha = this.config.smoothingFactor;
        
        // Adaptive Learning: Apply penalty boost if performance is worse than current trust.
        if (performanceMetric < currentWeight) {
            alpha = this.config.penaltyBoost; 
        }

        // 2. Calculate New Weight (EMA)
        const rawNewWeight = (alpha * performanceMetric) + ((1 - alpha) * currentWeight);
        
        // 3. Clamp weight between 0.0 and 1.0
        const finalWeight = Math.max(0.0, Math.min(1.0, rawNewWeight));
        
        this.currentMatrix[actorId] = finalWeight;
        
        // 4. Schedule Persistence (Debounced)
        this.scheduleSave();
        
        // 5. Audit Log 
        this.auditLog.log({
            type: 'MATRIX_UPDATE',
            actor: actorId,
            metric: performanceMetric.toFixed(3),
            alpha: alpha.toFixed(3),
            old: currentWeight.toFixed(3),
            new: finalWeight.toFixed(3)
        });

        return finalWeight;
    }

    /**
     * Returns the current, dynamically updated weighting matrix.
     * @returns {Object<string, number>}
     */
    getMatrix() {
        return this.currentMatrix;
    }

    /**
     * Synchronously retrieves the trust score for a specific actor.
     * @param {string} actorId 
     * @returns {number} The actor's current trust weight.
     */
    getWeight(actorId) {
        return this.currentMatrix[actorId] ?? this.config.initialTrustScore;
    }
}

module.exports = TrustMatrixManager;