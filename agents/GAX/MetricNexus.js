        const previousMetrics = historicalTrends[1];

        // Helper for robust EQM retrieval (EQM preferred, MQM_EQM fallback, safe default 0).
        // Uses Optional Chaining (?.) and Nullish Coalescing (??) for maximum compatibility and safety.
        const getEQM = (metrics) => metrics?.EQM ?? metrics?.MQM_EQM ?? 0;

        // Retrieve current and previous scores using the robust utility.
        // Note: Assumes 'currentMetrics' is available in the execution scope.
        const currentEQM = getEQM(currentMetrics);
        const previousEQM = getEQM(previousMetrics);

        const delta = currentEQM - previousEQM;

        return { delta: delta, previousEQM: previousEQM };
    }
}