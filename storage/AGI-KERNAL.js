  useEffect(() => {
    // Adaptive Heartbeat Activation (Self-Improvement v7.4.0)
    if (!user || state.kernel_ready !== true) return; 

    // V7.8.1: Constraint Definition Consolidation (Readability & Consistency)
    const MAX_EVOLUTION_LEVEL = 100; // Constraint based on system documentation
    const MAX_PERFORMANCE_GAIN = 0.15; // Autonomous self-optimization target

    const pulse = () => {
      runKernelCycle();
      
      // V7.5.0: Dynamic Multiplier Calculation based on Maturity (Autonomy integration)
      const configuredMultiplier = state.config.pulse_multiplier || 1.0;
      const evolutionLevel = state.evolution_level || 0; // Assume 0-100 scale for maturity
      
      // V7.8.0: Integrity Cautious Default (Safety Posture Enhancement)
      // High integrityScore (1.0) maintains speed; low score (0.0) forces cautious operation.
      // Defaulting to 0.0 if score is undefined ensures operation defaults to the guaranteed safety floor (0.5)
      const integrityScore = state.policy_integrity_score ?? 0.0; // Assumed 0.0 to 1.0
      
      // Safety Factor: Scales down overall speed gain based on integrity risk. 
      // Ensures minimum operational multiplier of 0.5 relative to other factors.
      const safetyFactor = Math.max(0.5, integrityScore); 
      
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
  }, [BASE_PULSE_MS, state.config.pulse_multiplier, state.evolution_level, state.policy_integrity_score, user, state.kernel_ready])