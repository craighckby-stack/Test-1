        // V7 SYNERGY LOGIC INJECTION: Self-Correcting Hook Logging
        // Log decision parameters 
        KERNEL_SYNERGY_CAPABILITIES.telemetry.log('AdaptiveSamplingDecision', {
            finalRate: finalRate,
            requiredRate: requiredRate,
            source: calculationSource,
            rateLimits: {
                max: this.config.MaxSamplingRate,
                min: this.config.MinSamplingRate,
            },
            restrictingConstraint: restrictingConstraint 
                ? {
                    name: restrictingConstraint.name,
                    current: restrictingConstraint.current,
                    target: restrictingConstraint.target,
                    // Ratio provides immediate insight into constraint breach
                    breachRatio: restrictingConstraint.current / restrictingConstraint.target,
                }
                : null,
        });

        return finalRate;
    }
}