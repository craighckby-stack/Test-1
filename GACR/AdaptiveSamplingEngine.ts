        // 1. Assemble detailed constraint metrics for telemetry reporting.
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

        // 2. Construct the full telemetry payload, integrating all decision factors.
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

        // 3. Dispatch standardized telemetry event.
        KERNEL_SYNERGY_CAPABILITIES.telemetry.log('AdaptiveSamplingDecision', decisionPayload);

        return finalRate;
    }
}