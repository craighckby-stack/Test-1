# RESILIENCE & RECOVERY PROTOCOL (RRP) V2.0 - Adaptive Failover Matrix

## 0.0 Mandate, Scope, and Tiers

The RRP V2.0 is mandated by SGS V94.4 (Section 3.2). It is exclusively triggered upon detecting an irreversible systemic fault, classified as `CRITICAL` GSEP-C failure (S2, S3, S4, S4.5, S6, S6.5, S6.7, S8).

The RRP's function is to achieve rapid, cryptographically attested state rollback and define the appropriate Recovery Tier (RT-0 to RT-2). Efficiency is prioritized through the immediate, atomic creation of the RSCM (Recovery Snapshot & Chain-of-Custody Manifest).

## 1.0 Critical Incident Response Chain (CIRC)

Upon $V_{Critical\ Trigger}$, the sequence must be atomic and asynchronous to minimize data corruption scope:

1. **State Fencing & Isolation (GICM/PVLM):** Immediate resource fencing of the failing component, preventing further state pollution and prioritizing kernel stabilization.
2. **Snapshot Generation (RSCM):** The specialized Snapshot Utility captures a complete, immutable environment state ($\Omega_{Failure}$) including runtime metrics, execution stack trace, and specific volatile memory regions. This package forms the RSCM.
3. **VRRM & CRoT Registration:** The primary error payload and context (ECVM/GICM) are persisted. CRoT immediately validates and certifies the integrity signature of the generated RSCM, persisting the resulting hash (`rscm_integrity_hash`) into the VRRM.
4. **Recovery Triage & Execution (GAX):** GAX analyzes the VRRM, the veto agent, and the certified RSCM integrity to select and initiate the required Recovery Tier.

## 2.0 Recovery Tier Matrix (RT)

GAX maps the failure source and severity to a predictable recovery pathway, ensuring maximum speed based on risk profile.

| Tier | Action | Target State | Failure Context Examples | Priority |
|:---|:---|:---|:---|:---|
| **RT-0** (Soft-Halt) | Clean shutdown of current job; minimal persistence required. | $\Psi_{N+1}$ (Await manual restart) | Low-memory assertion, non-critical I/O suspension. | P3 |
| **RT-1** (Pipeline Re-entry) | Reprocessing using attested ingress data. | $\Psi_{Stage-1}$ | Input validation error, transient external API timeout recoverable within a time threshold. | P2 |
| **RT-2** (Attested Rollback) | Systemic rollback utilizing the RSCM state restore image. | $\Psi_{Stage-N}$ (Deepest verified safe state) | Integrity violation (MPAM/PVLM trigger), logic error leading to persistent uncontrolled state. | P1 (Highest) |

## 3.0 Veto/Rollback/Recovery Manifest (VRRM) Structure V2.0

The VRRM structure now mandates reference to the cryptographically attested RSCM integrity hash.

| Field | Type | Mandate | V2.0 Update Notes |
|:---|:---|:---|:---|
| `timestamp` | UTC | Time of Failure/Veto. | No Change. |
| `gsep_stage` | S[0-11] | Failing pipeline stage. | No Change. |
| `veto_agent` | GAX/CRoT/System | Agent asserting the veto. | Expanded scope. |
| `veto_artifact` | Acronym | Artifact triggering the veto. | No Change. |
| **`rscm_integrity_hash`**| SHA512 | *Immutable CRoT signature of the RSCM package.* | **New Mandatory Field (RT-2 Reliance).** |
| `rollback_target` | $\Psi_{ID}$/RT-N | The targeted safe state / Recovery Tier selected. | Uses RT classification for clarity. |
| `is_resolved` | Boolean | Final flag set upon successful action. | No Change. |