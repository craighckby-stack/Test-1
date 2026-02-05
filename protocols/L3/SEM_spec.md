# L3 Simulation Environment Manager (SEM) Specification

## V94.1 | GSEP LAYER 3

The SEM is a critical prerequisite execution utility for the Metric Synthesis phase (L3), responsible for enforcing the operational constraints defined in the Simulation Fidelity Manifest (SFM).

### 1. SEM Mandate
The SEM MUST ensure a fully deterministic, sandboxed execution environment for both the Efficacy Reporting Agent (SDR) and the Risk Synthesis Agent (HMC). Non-compliance results in an immediate GSEP L3 failure (SEM_FAIL_001), triggering GFRM.

### 2. Core Constraints (Enforced via SFM)
SEM must strictly validate and enforce the following SFM parameters before SDR/HMC execution:

1. **Resource Segmentation:** Verify CPU/Memory limits adherence to prevent side-channel interference or unexpected termination.
2. **Input Provenance Lock:** Verify cryptographic checksums of all required simulation datasets, ensuring no drift from accepted inputs.
3. **Execution Time Threshold:** Enforce the maximum allowed runtime for metric synthesis to prevent Denial-of-Service vectors.
4. **Environment Hashing:** Generate a cryptographic hash of the resulting L3 execution environment (pre-output stage) to be included in the $S\text{-}01$ and $S\text{-}02$ artifacts' metadata, establishing audit linkage.

### 3. SEM Output
The successful execution of SEM provides the L3 agents with a certified environment pointer, allowing them to proceed with metric generation, ensuring SFM compliance is immutably established prior to metric synthesis.