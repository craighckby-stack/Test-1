/**
 * TrustMatrixManager.js
 * Purpose: Manages the dynamic evolution of the RCDM weighting_matrix (trust matrix)
 * based on real-time performance, compliance history, and behavioral audits of actors.
 * This separation ensures the PolicyEngine remains a fast, read-only enforcer.
 *
 * Refactor Rationale: Implemented configuration parameters (leveraging proposed governanceConfig),
 * introduced an asynchronous debounce mechanism for persistent storage writes to significantly improve
 * I/O efficiency during high-frequency updates, and switched to adaptive Exponential Moving Average (EMA) logic
 * for faster decay on negative performance signals.
 */
class TrustMatrixManager {
    
    static DEFAULT_CONFIG = {
        smoothingFactor: 0.15,
        penaltyBoost: 0.30,
        saveDebounceMs: 5000,
        initialTrustScore: 0.5
    };

    constructor(persistenceLayer, auditLog, config = {}) {
        this.persistence = persistenceLayer;
        this.auditLog = auditLog;
        this.config = { ...TrustMatrixManager.DEFAULT_CONFIG, ...config };
        
        // Load synchronously for immediate availability, requires fast persistence layer (e.g., in-memory cache)
        this.currentMatrix = this.persistence.load('weighting_matrix') || {};
        
        this.saveTimer = null;
        this.pendingSave = false;
        
        // Bind the debounced function
        this.scheduleSave = this.scheduleSave.bind(this);
    }

    /**
     * Internal debounce mechanism for asynchronously persisting the matrix.
     * Prevents excessive disk writes during high-frequency updates.
     */
    scheduleSave() {
        if (this.pendingSave) {
            return; 
        }

        this.pendingSave = true;
        this.saveTimer = setTimeout(async () => {
            try {
                // Save the entire matrix state
                await this.persistence.save('weighting_matrix', this.currentMatrix);
                this.auditLog.log({ type: 'MATRIX_PERSIST', status: 'Success', size: Object.keys(this.currentMatrix).length });
            } catch (error) {
                this.auditLog.error({ type: 'MATRIX_PERSIST_ERROR', error: error.message });
            } finally {
                this.pendingSave = false;
            }
        }, this.config.saveDebounceMs);
        
        if (this.saveTimer.unref) {
            this.saveTimer.unref(); 
        }
    }

    /**
     * Updates the weight of a specific actor based on calculated performance signals.
     * Uses Exponential Moving Average (EMA) with an adaptive smoothing factor.
     * @param {string} actorId - The ID of the component or agent.
     * @param {number} performanceMetric - Calculated performance score (0.0 to 1.0).
     */
    async recalculateWeight(actorId, performanceMetric) {
        const currentWeight = this.currentMatrix[actorId] !== undefined 
            ? this.currentMatrix[actorId] 
            : this.config.initialTrustScore;
        
        // 1. Determine Alpha (Smoothing Factor)
        let alpha = this.config.smoothingFactor;
        
        // Adaptive Learning: Apply penalty boost if performance is significantly negative
        if (performanceMetric < currentWeight) {
            alpha = Math.max(alpha, this.config.penaltyBoost); 
        }

        // 2. Calculate New Weight (EMA: New = Alpha * Metric + (1 - Alpha) * Current)
        const newWeight = (alpha * performanceMetric) + ((1 - alpha) * currentWeight);
        
        // 3. Clamp weight between 0.0 and 1.0
        const finalWeight = Math.max(0.0, Math.min(1.0, newWeight));
        
        this.currentMatrix[actorId] = finalWeight;
        
        // 4. Schedule Persistence (Debounced)
        this.scheduleSave();
        
        // 5. Audit Log 
        this.auditLog.log({ 
            type: 'MATRIX_UPDATE', 
            actor: actorId, 
            score: performanceMetric, 
            alpha: alpha,
            old: currentWeight,
            new: finalWeight 
        });

        return finalWeight;
    }

    /**
     * Returns the current, dynamically updated weighting matrix.
     */
    getMatrix() {
        return this.currentMatrix;
    }
}

module.exports = TrustMatrixManager;