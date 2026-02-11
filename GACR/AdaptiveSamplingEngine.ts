        // Construct standardized telemetry payload for the restricting constraint.
        const constraintDetails = restrictingConstraint 
            ? {
                name: restrictingConstraint.name,
                current: restrictingConstraint.current,
                target: restrictingConstraint.target,
                breachSignificance: this._calculateBreachSignificance(
                    restrictingConstraint.current,
                    restrictingConstraint.target
                ),
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