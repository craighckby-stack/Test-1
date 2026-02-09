useEffect(() => {
    // Adaptive Heartbeat Activation (Self-Improvement v7.4.0)
    if (!user || state.kernel_ready !== true) return; 

    // V7.9.0: Constraint Externalization (Completed Integration)
    // Retrieves critical operational constraints from state.config, defaulting to system specification.
    const MAX_EVOLUTION_LEVEL = state.config.max_evolution_level || 100; 
    const MAX_PERFORMANCE_GAIN = state.config.max_performance_gain || 0.15; 

    const pulse = () => {
      runKernelCycle();
      
      // V7.5.0: Dynamic Multiplier Calculation based on Maturity (Autonomy integration)
      const configuredMultiplier = state.config.pulse_multiplier || 1.0;
      const evolutionLevel = state.evolution_level || 0; // Assume 0-100 scale for maturity
      
      // V7.9.5: Integrity Score Clamping and Safety Floor Enforcement (DCCA Policy Compliance)
      const rawIntegrityScore = state.policy_integrity_score ?? 0.0; 
      
      // 1. Ensure integrity score adheres to [0.0, 1.0] bounds for calculation stability
      const clampedIntegrityScore = Math.min(1.0, Math.max(0.0, rawIntegrityScore)); 
      
      // Safety Factor: Ensures minimum operational multiplier of 0.5 (Safety Floor).
      // Scales down overall speed gain based on integrity risk (aligned with DCCA)
      const safetyFactor = Math.max(0.5, clampedIntegrityScore); 
      
      // Maturity Factor: System speeds up slightly as evolution level increases.
      // Calculation: 1.0 + (Level / MaxLevel * MaxGain)
      const maturityGain = (evolutionLevel / MAX_EVOLUTION_LEVEL) * MAX_PERFORMANCE_GAIN;
      const maturityFactor = 1.0 + maturityGain; 
      
      const adjustedMaturityFactor = maturityFactor * safetyFactor;
      
      const combinedMultiplier = configuredMultiplier * adjustedMaturityFactor;
      
      const interval = calculatePulseInterval(BASE_PULSE_MS, combinedMultiplier);
      
      // Schedule next pulse using setTimeout for adaptive timing
      cycleRef.current = setTimeout(pulse, interval);
    };

    // Initial activation
    pulse();

    // Cleanup function
    return () => {
      if (cycleRef.current) {
        clearTimeout(cycleRef.current);
      }
    };
  }, [BASE_PULSE_MS, state.config.pulse_multiplier, state.config.max_evolution_level, state.config.max_performance_gain, state.evolution_level, state.policy_integrity_score, user, state.kernel_ready])