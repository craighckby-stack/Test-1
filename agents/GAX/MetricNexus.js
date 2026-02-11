        const previousMetrics = historicalTrends[1];

        // Use robust key retrieval (EQM is preferred, MQM_EQM is fallback for legacy naming conventions).
        // Note: EQM values stored in Nexus are already sanitized scores (0-100), avoiding unnecessary re-normalization.
        const currentEQM = currentMetrics.EQM || currentMetrics.MQM_EQM || 0;
        const previousEQM = previousMetrics.EQM || previousMetrics.MQM_EQM || 0;

        const delta = currentEQM - previousEQM;

        return { delta: delta, previousEQM: previousEQM };
    }
}