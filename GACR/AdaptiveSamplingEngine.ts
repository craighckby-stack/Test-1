        // 1. Construct standardized telemetry payload for the restricting constraint, if present.
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

        // 2. Assemble the full telemetry payload structure, separating construction from logging side-effect.
        const decisionPayload = {
            finalRate,
            requiredRate,
            source: calculationSource,
            rateLimits: {
                max: this.config.MaxSamplingRate,
                min: this.config.MinSamplingRate,
            },
            restrictingConstraint: constraintDetails,
        };

        // 3. Log decision parameters using standardized payload structure (AGI telemetry standardization).
        KERNEL_SYNERGY_CAPABILITIES.telemetry.log('AdaptiveSamplingDecision', decisionPayload);

        return finalRate;
    }
}