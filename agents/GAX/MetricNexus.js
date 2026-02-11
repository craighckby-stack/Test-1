        /**
         * Safely extracts the standardized Equilibrium Metric (EQM).
         * Falls back sequentially to MQM_EQM, or 0 if metrics object is unavailable or fields are missing.
         * This method adheres to the Synergy Registry principle of high functional cohesion.
         */
        const extractEquilibriumMetric = (metrics) => metrics?.EQM ?? metrics?.MQM_EQM ?? 0;

        // Identify the preceding historical metric snapshot.
        const previousMetrics = historicalTrends[1];

        // Calculate standardized scores for current and previous states.
        const currentEQM = extractEquilibriumMetric(currentMetrics);
        const previousEQM = extractEquilibriumMetric(previousMetrics);

        // Determine the directional change.
        const delta = currentEQM - previousEQM;

        return { delta, previousEQM };
    }
}