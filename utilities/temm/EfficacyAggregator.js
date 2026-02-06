// utilities/temm/EfficacyAggregator.js
/**
 * EfficacyAggregator: Calculates the mandatory Transition Efficacy & Metric Measure (\Delta\Psi)
 * based on the weighted arithmetic mean, ensuring normalization constraints [0.0, 1.0].
 */
class EfficacyAggregator {
    constructor(policyConfig) {
        this.weights = policyConfig.temm_efficacy_weights || {};
        this.weightSum = Object.values(this.weights).reduce((a, b) => a + b, 0);
        if (this.weightSum <= 0 || Object.keys(this.weights).length < 3) {
            throw new Error("TEMM Policy Weights must be configured and sum to a positive value.");
        }
    }

    /**
     * Calculates the TEMM scalar (\Delta\Psi).
     * @param {Object} vectors - Must contain GHS_score, RES_score, SRS_score, all in [0.0, 1.0].
     * @returns {number} The normalized TEMM score \Delta\Psi \in [0.0, 1.0].
     */
    calculate(vectors) {
        const {
            GHS_score: V_GHS,
            RES_score: V_RES,
            SRS_score: V_SRS
        } = vectors;

        // Enforcement of [0.0, 1.0] input constraint (Critical Safety Measure)
        [V_GHS, V_RES, V_SRS].forEach(score => {
            if (typeof score !== 'number' || score < 0.0 || score > 1.0) {
                throw new RangeError("Efficacy vector score input must be a number within [0.0, 1.0].");
            }
        });

        // Weighted Sum Calculation: V_ID * W_ID
        let weightedSum =
            (V_GHS * (this.weights.W_GHS || 0)) +
            (V_RES * (this.weights.W_RES || 0)) +
            (V_SRS * (this.weights.W_SRS || 0));

        // Normalization: Division by Sum(W_ID)
        const deltaPsi = weightedSum / this.weightSum;
        
        // Guaranteed Constraint Adherence
        return Math.max(0.0, Math.min(1.0, deltaPsi)); 
    }
}

module.exports = EfficacyAggregator;