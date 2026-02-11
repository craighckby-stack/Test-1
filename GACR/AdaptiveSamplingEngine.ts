        // V7 SYNERGY LOGIC INJECTION: Self-Correcting Hook Logging
        // Pre-calculate constraint details for cleaner log payload structure and AGI telemetry standardization.
        const constraintDetails = restrictingConstraint 
            ? {
                name: restrictingConstraint.name,
                current: restrictingConstraint.current,
                target: restrictingConstraint.target,
                // Measure magnitude of constraint breach relative to target. Renamed to align with kernel standards.
                breachSignificance: restrictingConstraint.current / restrictingConstraint.target,
            }
            : null;

        // Log decision parameters using standardized payload structure and property shorthand
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