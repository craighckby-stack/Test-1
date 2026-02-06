/**
 * TrustMatrixManager.js
 * Purpose: Manages the dynamic evolution of the RCDM weighting_matrix (trust matrix)
 * based on real-time performance, compliance history, and behavioral audits of actors.
 * This separation ensures the PolicyEngine remains a fast, read-only enforcer.
 */

class TrustMatrixManager {
    constructor(persistenceLayer, auditLog) {
        this.persistence = persistenceLayer;
        this.auditLog = auditLog;
        this.currentMatrix = this.persistence.load('weighting_matrix') || {};
    }

    /**
     * Updates the weight of a specific actor based on calculated performance signals.
     * @param {string} actorId - The ID of the component or agent.
     * @param {number} performanceMetric - Calculated performance score (0.0 to 1.0).
     */
    async recalculateWeight(actorId, performanceMetric) {
        const currentWeight = this.currentMatrix[actorId] || 0;
        let newWeight;

        // Implementation details for evolutionary weight adjustment (e.g., moving average, decay)
        // Simple implementation: 70% retention, 30% new metric influence.
        newWeight = (currentWeight * 0.7) + (performanceMetric * 0.3);
        
        // Clamp weight between 0.0 and 1.0
        this.currentMatrix[actorId] = Math.max(0.0, Math.min(1.0, newWeight));
        
        await this.persistence.save('weighting_matrix', this.currentMatrix);
        
        this.auditLog.log({ 
            type: 'MATRIX_UPDATE', 
            actor: actorId, 
            old: currentWeight,
            new: newWeight 
        });

        return newWeight;
    }

    /**
     * Returns the current, dynamically updated weighting matrix.
     */
    getMatrix() {
        return this.currentMatrix;
    }
}

module.exports = TrustMatrixManager;