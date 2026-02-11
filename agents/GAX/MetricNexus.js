        const previousMetrics = historicalTrends[1];

        // Functional metric extractor: ensures safe retrieval of EQM or fallback metric.
        // Uses Optional Chaining (?.) and Nullish Coalescing (??) for maximum compatibility and safety.
        const getEQM = (metrics) => metrics?.EQM ?? metrics?.MQM_EQM ?? 0;

        // Calculate current and previous standardized EQM scores.
        // Note: Assumes 'currentMetrics' is available in the execution scope.
        const currentEQM = getEQM(currentMetrics);
        const previousEQM = getEQM(previousMetrics);

        const delta = currentEQM - previousEQM;

        // Use property value shorthand for cleaner return object construction.
        return { delta, previousEQM };
    }
}