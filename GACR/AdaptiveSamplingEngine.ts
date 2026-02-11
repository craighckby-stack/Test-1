        // Construct standardized telemetry payload for the restricting constraint.
        const constraintDetails = restrictingConstraint 
            ? {
                name: restrictingConstraint.name,
                current: restrictingConstraint.current,
                target: restrictingConstraint.target,
                // Synergy v7 mandate: Breach significance is calculated as the ratio (current / target).
                // Added robustness check for division by zero.
                breachSignificance: restrictingConstraint.target > 0
                    ? restrictingConstraint.current / restrictingConstraint.target
                    : (restrictingConstraint.current > 0 ? Infinity : 0), // Signifies extreme breach if target is zero but current is positive.
            }
            : null;

        // Log decision parameters using standardized payload structure (AGI telemetry standardization).
        KERNEL_SYNERGY_CAPABILITIES.telemetry.log('AdaptiveSamplingDecision', {
            finalRate,
            requiredRate,
            source: calculationSource,
            rateLimits: {
                max: this.config.MaxSamplingRate,
                min: this.config.MinSamplingRate,
            },
            restrictingConstraint: constraintDetails,
        });

        return finalRate;
    }
}