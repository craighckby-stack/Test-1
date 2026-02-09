useEffect(() => {
    // Adaptive Heartbeat Activation (Self-Improvement v7.4.0)
    if (!user || state.kernel_ready !== true) return; 

    // V7.9.0: Constraint Externalization (Completed Integration)
    // V8.1.0: Dynamic Safety Constraint Injection (APTE Aggression Layer Integration)
    // Retrieves critical operational constraints from state.config, defaulting to system specification.
    const MAX_EVOLUTION_LEVEL = state.config.max_evolution_level || 100; 
    
    // APTE Aggression Modulation: Retrieves potential maximum gain and applies the APTE tuning multiplier (GAX control).
    const BASELINE_MAX_GAIN = state.config.max_performance_gain || 0.15; 
    const APTE_TUNE_MULTIPLIER = state.config.apte_tune_multiplier || 1.0; 
    const EFFECTIVE_MAX_PERFORMANCE_GAIN = BASELINE_MAX_GAIN * APTE_TUNE_MULTIPLIER;

    // Defines the minimum operational multiplier floor, allowing GAX/APTE to dynamically tune safety response.
    const MIN_SAFETY_FLOOR = state.config.min_pulse_safety_floor || 0.5;

    const pulse = () => {
      runKernelCycle();
      
      // V7.5.0: Dynamic Multiplier Calculation based on Maturity (Autonomy integration)
      const configuredMultiplier = state.config.pulse_multiplier || 1.0;
      const evolutionLevel = state.evolution_level || 0; // Assume 0-100 scale for maturity
      
      // V7.9.5: Integrity Score Clamping and Safety Floor Enforcement (DCCA Policy Compliance)
      const rawIntegrityScore = state.policy_integrity_score ?? 0.0; 
      
      // 1. Ensure integrity score adheres to [0.0, 1.0] bounds for calculation stability
      const clampedIntegrityScore = Math.min(1.0, Math.max(0.0, rawIntegrityScore)); 
      
      // Safety Factor: Ensures minimum operational multiplier (MIN_SAFETY_FLOOR) set by config.
      // Scales down overall speed gain based on integrity risk (aligned with DCCA)
      const safetyFactor = Math.max(MIN_SAFETY_FLOOR, clampedIntegrityScore); 
      
      // Maturity Factor: System speeds up slightly as evolution level increases.
      // Calculation: 1.0 + (Level / MaxLevel * EFFECTIVE_MAX_PERFORMANCE_GAIN)
      const maturityGain = (evolutionLevel / MAX_EVOLUTION_LEVEL) * EFFECTIVE_MAX_PERFORMANCE_GAIN;
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
  }, [BASE_PULSE_MS, state.config.pulse_multiplier, state.config.max_evolution_level, state.config.apte_tune_multiplier, state.config.min_pulse_safety_floor, state.evolution_level, state.policy_integrity_score, user, state.kernel_ready])