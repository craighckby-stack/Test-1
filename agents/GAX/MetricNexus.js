/**
 * Helper function to stabilize floating point precision across kernel nodes.
 * @param {number} value
 * @returns {number}
 */
const _stabilizePrecision = (value) => {
    // Stabilizes precision to 6 decimal places for kernel consistency
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    return parseFloat(safeValue.toFixed(6));
};

/**
 * Calculates the directional change (delta) in the standardized Equilibrium Metric (EQM)
 * between the current state and the immediate preceding historical state.
 * This function relies on an external EQM_Extractor plugin for robust data handling.
 *
 * @param {object} currentMetrics - The current metric snapshot.
 * @param {Array<object>} historicalTrends - Array of historical snapshots (trend[1] is previous).
 * @param {object} EQM_Extractor - Interface adhering to EquilibriumMetricExtractor.
 * @returns {{delta: number, previousEQM: number, currentEQM: number}}
 */
const calculateEquilibriumDelta = (currentMetrics, historicalTrends, EQM_Extractor) => {
    
    // Internal function combining extraction and precision stabilization.
    const extractAndStabilizeEQM = (metrics) => {
        // Assume baseline EQM of 0 if historical data is missing (e.g., initialization).
        if (!metrics) {
            return 0; 
        }
        
        // Execute the external extractor and stabilize the resulting floating-point value.
        const rawEQM = EQM_Extractor.execute(metrics);
        return _stabilizePrecision(rawEQM);
    };

    // Identify the preceding historical metric snapshot using defensive indexing.
    const previousMetrics = historicalTrends?.[1];

    // Calculate standardized and stabilized scores for both states.
    const currentEQM = extractAndStabilizeEQM(currentMetrics);
    const previousEQM = extractAndStabilizeEQM(previousMetrics);
    
    // Determine the directional change.
    // Since inputs are already stabilized numbers, direct subtraction is safe.
    // Stabilize the final delta to ensure absolute precision consistency in the resulting metric.
    const rawDelta = currentEQM - previousEQM;
    const delta = _stabilizePrecision(rawDelta);

    return {
        delta: delta,
        previousEQM: previousEQM,
        currentEQM: currentEQM
    };
};