/**
 * src/governance/TrustMatrixManager.js
 * Purpose: Manages the dynamic evolution of the RCDM weighting_matrix (trust matrix)
 * based on real-time performance, compliance history, and behavioral audits of actors.
 * This separation ensures the PolicyEngine remains a fast, read-only enforcer.
 *
 * Sovereign AGI Refactoring Rationale (v94.1):
 * 1. Encapsulation: Removed internal I/O control state (`#saveTimer`, etc.) and replaced
 *    with the IODebounceScheduler plugin, focusing the class on governance logic.
 * 2. Robust Initialization: Standardized configuration handling in `#validateConfig`.
 * 3. Efficiency Maintenance: Delegated the high-efficiency asynchronous debounced write mechanism
 *    to the reusable IODebounceScheduler.
 * 4. Audit Improvement: Retained threshold checking in `recalculateWeight`.
 */

declare var IODebounceScheduler: any;

class TrustMatrixManager {

    static PERSISTENCE_KEY = 'weighting_matrix';

    static DEFAULT_CONFIG = {
        smoothingFactor: 0.15,   // Base EMA learning rate (alpha)
        penaltyBoost: 0.35,      // Higher alpha applied immediately on negative feedback for faster decay
        saveDebounceMs: 4000,    // Time (ms) to wait before writing to persistent storage
        initialTrustScore: 0.5   // Default trust for new actors
    };

    // External dependencies
    private persistence: any;
    private auditLog: any;
    private config: any;
    private currentMatrix: Record<string, number> = {};
    
    // Plugin Instance for I/O control
    private saveScheduler: any;

    /**
     * @param {Object} persistenceLayer - Must implement load(key) and save(key, data)
     * @param {Object} auditLog - Must implement log() and error()
     * @param {Object} [config={}] - Optional configuration overrides.
     */
    constructor(persistenceLayer: any, auditLog: any, config = {}) {
        if (!persistenceLayer || !auditLog) {
            throw new Error("TrustMatrixManager requires a persistenceLayer and an auditLog instance.");
        }
        
        this.persistence = persistenceLayer;
        this.auditLog = auditLog;
        
        this.config = this.#validateConfig({ ...TrustMatrixManager.DEFAULT_CONFIG, ...config });

        // Initialize the scheduler to manage debounced I/O
        this.saveScheduler = IODebounceScheduler.execute({
            asyncTask: () => this.#performSaveInternal(),
            delayMs: this.config.saveDebounceMs,
            // Provide a log function for the scheduler to report its internal concurrency errors
            logFunction: (details: any) => this.auditLog.error(details)
        });

        // Synchronous Load: Required for immediate service startup.
        this.#loadMatrix();
    }
    
    /**
     * Internal configuration validation and normalization.
     */
    #validateConfig(config: any) {
        // Ensure critical factors are clamped between 0 and 1
        config.smoothingFactor = Math.max(0, Math.min(1, config.smoothingFactor || TrustMatrixManager.DEFAULT_CONFIG.smoothingFactor));
        config.penaltyBoost = Math.max(0, Math.min(1, config.penaltyBoost || TrustMatrixManager.DEFAULT_CONFIG.penaltyBoost));
        config.initialTrustScore = Math.max(0, Math.min(1, config.initialTrustScore || TrustMatrixManager.DEFAULT_CONFIG.initialTrustScore));

        if (typeof config.saveDebounceMs !== 'number' || config.saveDebounceMs < 500) {
            config.saveDebounceMs = TrustMatrixManager.DEFAULT_CONFIG.saveDebounceMs;
        }

        return config;
    }

    /**
     * Synchronous initialization method to load the matrix from persistent storage.
     */
    #loadMatrix() {
        try {
            this.currentMatrix = this.persistence.load(TrustMatrixManager.PERSISTENCE_KEY) || {};
            this.auditLog.log({ 
                component: 'TrustMatrix', 
                type: 'MATRIX_LOAD', 
                status: 'Success', 
                size: Object.keys(this.currentMatrix).length 
            });
        } catch (error: any) {
            // Fail safe: If load fails, start with an empty matrix to prevent blocking execution.
            this.currentMatrix = {};
            this.auditLog.error({ 
                component: 'TrustMatrix', 
                type: 'MATRIX_LOAD_ERROR', 
                message: `Failed to load initial matrix: ${error.message}` 
            });
        }
    }

    /**
     * Executes the actual persistence write operation.
     * This function is passed to the IODebounceScheduler and only performs the I/O.
     */
    async #performSaveInternal() {
        try {
            await this.persistence.save(TrustMatrixManager.PERSISTENCE_KEY, this.currentMatrix);
            this.auditLog.log({ component: 'TrustMatrix', type: 'MATRIX_PERSIST', status: 'Complete', size: Object.keys(this.currentMatrix).length });
        } catch (error: any) {
            this.auditLog.error({ component: 'TrustMatrix', type: 'MATRIX_PERSIST_ERROR', error: error.message });
        }
    }

    /**
     * Schedules persistence of the matrix using a debounce delay.
     * Delegates control to the IODebounceScheduler.
     */
    scheduleSave() {
        this.saveScheduler.schedule();
    }

    /**
     * Updates the weight of a specific actor using Exponential Moving Average (EMA).
     * @param {string} actorId - The ID of the component or agent.
     * @param {number} performanceMetric - Calculated score (0.0 to 1.0).
     * @returns {number} The new calculated trust score/weight.
     */
    recalculateWeight(actorId: string, performanceMetric: number): number {
        // Strict input validation
        if (typeof actorId !== 'string' || !actorId || typeof performanceMetric !== 'number' || isNaN(performanceMetric)) {
             this.auditLog.error({ 
                 component: 'TrustMatrix', 
                 type: 'MATRIX_INVALID_INPUT', 
                 message: 'Invalid actorId or performance metric type.',
                 input_metric: performanceMetric
             });
             return this.getWeight(actorId); // Return current weight, don't update
        }

        // Clamp incoming metric
        performanceMetric = Math.max(0.0, Math.min(1.0, performanceMetric));
        
        const currentWeight = this.currentMatrix[actorId] ?? this.config.initialTrustScore;
        
        // 1. Determine Alpha (Smoothing Factor)
        let alpha = this.config.smoothingFactor;
        
        // Adaptive Learning: Apply penalty boost if performance is worse than current trust.
        if (performanceMetric < currentWeight) {
            alpha = this.config.penaltyBoost; 
        }

        // 2. Calculate New Weight (EMA: W_new = alpha * Metric + (1 - alpha) * W_old)
        const finalWeight = (alpha * performanceMetric) + ((1 - alpha) * currentWeight);
        
        this.currentMatrix[actorId] = finalWeight;
        
        // 3. Schedule Persistence (Debounced)
        this.scheduleSave();
        
        // 4. Audit Log 
        // Only log updates that significantly change the score to prevent log bloat
        if (Math.abs(finalWeight - currentWeight) > 0.001) { 
            this.auditLog.log({
                component: 'TrustMatrix',
                type: 'MATRIX_UPDATE',
                actor: actorId,
                metric: performanceMetric.toFixed(4),
                alpha: alpha.toFixed(4),
                delta: (finalWeight - currentWeight).toFixed(4),
                new: finalWeight.toFixed(4)
            });
        }

        return finalWeight;
    }

    /**
     * Returns the current, dynamically updated weighting matrix.
     * Note: Returns a reference to the internal object for read efficiency. Callers should not modify it.
     * @returns {Object<string, number>}
     */
    getMatrix(): Record<string, number> {
        return this.currentMatrix;
    }

    /**
     * Synchronously retrieves the trust score for a specific actor.
     * @param {string} actorId 
     * @returns {number} The actor's current trust weight.
     */
    getWeight(actorId: string): number {
        if (typeof actorId !== 'string') return this.config.initialTrustScore; // Defensive programming
        return this.currentMatrix[actorId] ?? this.config.initialTrustScore;
    }

    /**
     * Immediately triggers a save operation without waiting for the debounce delay.
     * Primarily used during graceful shutdown procedures.
     */
    async flush() {
        await this.saveScheduler.flush();
    }
}

module.exports = TrustMatrixManager;