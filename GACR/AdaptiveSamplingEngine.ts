        // V7 SYNERGY LOGIC INJECTION: Self-Correcting Hook Logging
        // Log decision parameters 
        KERNEL_HOOK.log('AdaptiveSamplingDecision', {
            finalRate: finalRate,
            requiredRate: requiredRate,
            source: calculationSource,
            MaxSamplingRate: this.config.MaxSamplingRate,
            MinSamplingRate: this.config.MinSamplingRate,
            restrictingConstraint: restrictingConstraint 
                ? {
                    name: restrictingConstraint.name,
                    current: restrictingConstraint.current,
                    target: restrictingConstraint.target,
                    // Ratio provides immediate insight into constraint breach
                    ratio: restrictingConstraint.current / restrictingConstraint.target,
                }
                : null,
        });

        return finalRate;
    }
}