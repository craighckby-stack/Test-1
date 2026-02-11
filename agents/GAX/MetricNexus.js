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
    // Utilize the injected plugin interface for reliable, standardized data extraction.
    const extractEQM = (metrics) => EQM_Extractor.execute(metrics);

    // Identify the preceding historical metric snapshot using defensive indexing.
    const previousMetrics = historicalTrends?.[1];

    // Calculate standardized scores for current and previous states concurrently.
    const [currentEQM, previousEQM] = [
        extractEQM(currentMetrics),
        extractEQM(previousMetrics)
    ];

    // Determine the directional change.
    // Precision is stabilized to prevent floating point inaccuracies across kernel nodes.
    const rawDelta = currentEQM - previousEQM;
    const delta = parseFloat(rawDelta.toFixed(6));

    return { delta, previousEQM, currentEQM };
};