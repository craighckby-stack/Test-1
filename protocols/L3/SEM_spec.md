# L3 Simulation Environment Manager (SEM) Protocol Specification

## V94.1 | GSEP Layer 3 | Operational Determinism Assurance

The Simulation Environment Manager (SEM) is the mandatory Layer 3 prerequisite utility, tasked with establishing and immutably sealing the execution context necessary for the Efficacy Reporting Agent (SDR) and the Risk Synthesis Agent (HMC). Its primary function is the strict, deterministic enforcement of constraints defined within the Simulation Fidelity Manifest (SFM).

### 1. The Deterministic Assurance Mandate
SEM MUST enforce isolation to guarantee a state-free, fully deterministic execution for L3 metric synthesis. Any detected violation, including resource overruns, configuration drift, or input modification, triggers the immediate L3 failure mode ($SEM\text{-}ERR\text{-}409$), requiring invocation of the General Failure Remediation Module (GFRM).

### 2. SEM Execution Phases

#### 2.1. Pre-Flight Attestation (Configuration Sealing)
Before environment instantiation, SEM verifies input integrity based on the SFM configuration structure:

1.  **SFM Structure Validation ($ATT\text{-}01$):** Validation of the received SFM payload against the mandatory SEM Configuration Schema (SCS). Failure to adhere results in configuration rejection.
2.  **Input Data Attestation (IDA) ($ATT\text{-}02$):** Verification of the integrity (cryptographic chain of custody) and provenience (checksums) of all simulation datasets required by the SFM, ensuring they match accepted, known inputs.

#### 2.2. Environment Sealing (Execution Barrier)
SEM establishes and enforces the isolated resource boundary, creating an auditable "Execution Seal" necessary for deterministic operation.

1.  **Resource Isolation Matrix (RIM) Enforcement:** Hard-capping of CPU, memory, and I/O access strictly defined by the SFM. Any attempt by SDR/HMC to exceed these limits must result in immediate termination and failure recording.
2.  **Execution Time Constraint Lock ($CTL\text{-}01$):** Enforcement of the precise maximum duration allowed for L3 execution. This mechanism prevents deadlocks, unbounded loops, or timing side-channel exploits.

#### 2.3. Environmental Integrity Seal (EIS)
Immediately prior to handing over control to the L3 agents, SEM generates and records the EIS, securing audit linkage.

1.  **Environment Hashing:** A cryptographic hash is generated capturing the final, active state of the sandboxed execution environment (including kernel parameters, installed libraries, and verified constrained boundaries).
2.  **Artifact Metadata Injection:** This EIS hash is mandatory metadata ($S\text{-}EIS$) for the $S\text{-}01$ (Efficacy) and $S\text{-}02$ (Risk) output artifacts, guaranteeing traceability back to the precise operational context.

### 3. SEM Output & Status Signaling
Successful SEM completion yields a Certified Environment Pointer (CEP) and a signed `SEM_EXEC_LOCK` artifact, confirming SFM constraints are immutably established. This output unlocks the downstream execution of SDR and HMC.