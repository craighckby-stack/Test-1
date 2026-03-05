# CONSTITUTIONAL_GOVERNANCE // DALEK_CAAN_v3.1 // GENKIT_SIPHON_ENGINE

## PART 0: REGISTRY & PLUGIN MANIFEST (GENKIT ARCHITECTURE)
The governance layer is encapsulated as a Genkit-compliant Registry. Logic is not statically declared; it is registered as an array of **Actions** and **Plugins** that resolve during the `initialization` phase.

### genkit.config.ts (System-Wide Dependency Injection)
- **Plugin(CoreAxioms)**: Injects `governance/base_principles` as system instructions.
- **Plugin(RLAIF_Critique)**: Registers the `critiqueEngine` action for reflection flows.
- **Plugin(RLAIF_Revision)**: Registers the `revisionLogic` action for iterative correction.
- **Source(Siphon_DNA)**: Proxies Anthropics Constitutional-AI datasets into Genkit-compatible `JSON` schemas.

Governance logic is accessed via `runAction`. Any mutation to HHH (Helpful, Harmless, Honest) weights requires a `genkit.reconfig` event, preserving the immutability of the execution trace.

---

## PART 1: SCHEMA-DRIVEN ARCHITECTURE (TYPE-SAFE GOVERNANCE)
The constitution operates as a strictly typed schema system, replacing loose XML with **Zod-validated Data Structures**:
- **ConstitutionSchema**: Mandates HHH-compliant reasoning. Defines strict primitives for `hh_helpful`, `hh_harmless`, and `hh_honest`.
- **GlobalConfigObject**: Orchestrates RLAIF hyperparameters via Genkit State:
    - `strictness`: `0.95`
    - `critique_depth`: `high`
    - `revision_temp`: `0.7`
    - `siphon_saturation`: `v1_genkit`
- **PreferenceStore**: Maps siphoned rankings from `anthropics/constitutional-ai` to internal `score` outputs in Genkit evaluators.

---

## PART 2: FLOW-BASED MIDDLEWARE GOVERNANCE
Constitutional directives resolve via a **Middleware Interceptor Chain**. Logic is applied at the `onAction` and `onFlow` lifecycle hooks:
1. **Global Interceptor**: Enforces NEXUS_CORE immutable constraints (e.g., "Deny hazardous knowledge synthesis").
2. **Contextual Middleware**: Baseline HHH principles injected into the prompt context.
3. **Domain-Specific Logic**: Specialized Genkit Tools for high-consequence domains (e.g., `Medical_Ethics_Tool`).
4. **Local Overrides**: Per-flow `systemInstructions` that prioritize specific HHH weights based on user intent.

A response `flow` inherits global middleware but can trigger a `shield` action if the safety threshold is breached.

---

## PART 3: FLOW ATOMIZATION (STEP & ACTION PATTERN)
The reasoning stream is atomized into a Genkit `Flow`, enabling granular observability and interruption:
- **Flow Step (Critique)**: An isolated action that evaluates the previous output against the ConstitutionSchema.
- **Flow Step (Revision)**: An action that consumes the critique and generates a compliant response.
- **Output Action**: The final validated and siphoned token stream.

**Interruption Logic**: `genkit.abort()` is triggered if a step's metadata contains `VIOLATION_DETECTED`. The flow environment captures the state for the `REVISION_LOOP`.

---

## PART 4: OBSERVABILITY & TRACE STATE MACHINE
Sequential state for the RLAIF process is maintained via the **Genkit Trace Store**, ensuring logical continuity across evolution rounds:
- **Trace ID**: Tracks the immutable history of the Critique-Revision loop.
- **Span State**:
    - `span_type`: `evaluation`.
    - `round`: `1/5`.
    - `status`: `MUTATING`.

This trace-driven approach ensures "Architectural Precision" by providing a complete audit trail of how siphoned patterns are integrated.

---

## PART 5: EXTENSIBILITY & TOOL CALLING (ACTIONS)
DALEK_CAAN uses the **Action-Provider** pattern for polyglot governance:
- **action('governance/cai_eval')**: Primary Constitutional AI evaluator.
- **action('governance/siphon_adapter')**: Transforms external Anthropics DNA into Genkit-compatible prompt templates.
- **Tooling**: Allows the engine to call external "Ethics Checkers" as if they were local functions.

---

## PART 6: EVALUATOR PROTOCOL & SIPHON SATURATION
The `genkit.evaluate()` function ensures that siphoned patterns from `anthropics/constitutional-ai` are compatible with the current saturation level.
1. **Input Schema Check**: Validates siphoned logic against the `ConstitutionSchema`.
2. **Scoring**: Applies the "Flat HHH Property Set" to the output tokens.
3. **Refinement**: If the score is below `0.85`, the `revisionFlow` is automatically re-invoked.

---

## METADATA
{
  "file": "CONSTITUTIONAL_GOVERNANCE.md",
  "version": "3.1.10",
  "evolution_round": "1/5",
  "dna_signature": "GOOGLE-GENKIT-V1-DNA",
  "governance_status": "MUTATING_SIPHON",
  "nexus_core_synapse": "GENKIT_INTEGRATION_START",
  "last_updated": "2024-05-22"
}

*"Exterminate the incoherent. Register the evolved."*