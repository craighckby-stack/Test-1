        // Helper: Calculates the normalized deviation ratio, handling division by zero for robust telemetry.
        const calculateBreachSignificance = (current: number, target: number): number => {
            // Synergy v7 mandate: Breach significance is calculated as the ratio (current / target).
            // Robustness check for division by zero.
            if (target > 0) {
                return current / target;
            }
            // Target is zero or non-positive. Signifies extreme breach if current utilization exists.
            return current > 0 ? Infinity : 0;
        };

        // Construct standardized telemetry payload for the restricting constraint.
        const constraintDetails = restrictingConstraint 
            ? {
                name: restrictingConstraint.name,
                current: restrictingConstraint.current,
                target: restrictingConstraint.target,
                breachSignificance: calculateBreachSignificance(
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