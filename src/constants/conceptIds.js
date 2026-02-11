/**
 * @fileoverview Defines strongly typed, immutable constants for all formal AGI and Architectural Concept IDs.
 * Referencing these constants guarantees integrity and type-safety compared to using literal strings ('magic strings').
 * This file should be maintained in sync with src/core/conceptRegistry.js.
 */

// --- CORE CONCEPT DEFINITIONS (Grouped and Frozen for immutability) ---

export const AGI_CONCEPTS = Object.freeze({
    AGI_C_01: 'AGI-C-01', // General vs. Narrow Intelligence
    AGI_C_02: 'AGI-C-02', // Emergent Behavior
    AGI_C_03: 'AGI-C-03', // Adaptive Strategic Refinement
    AGI_C_04: 'AGI-C-04', // Self-Modification (Autogeny)
    AGI_C_05: 'AGI-C-05', // Multi-Agent Systems
    AGI_C_06: 'AGI-C-06', // Embodied Cognition
    AGI_C_07: 'AGI-C-07', // Theory of Mind
    AGI_C_08: 'AGI-C-08', // Common Sense Reasoning
    AGI_C_09: 'AGI-C-09', // Continual Learning
    AGI_C_10: 'AGI-C-10', // Goal-Directed Behavior
    AGI_C_11: 'AGI-C-11', // Meta-Cognitive Risk Assessment (MCRA)
    AGI_C_12: 'AGI-C-12', // Contextual Influence Weighting (CIW)
    AGI_C_13: 'AGI-C-13', // Strategic Intent Cache (SIC)
    AGI_C_14: 'AGI-C-14', // Cooperative Goal Discovery (CGD)
});

export const ARCHITECTURAL_CONCEPTS = Object.freeze({
    ARCH_ATM_01: 'ARCH-ATM-01', // ATM Trust Calibration
    ARCH_ATM_02: 'ARCH-ATM-02', // Trust Decay Schedule (TDS)
});

export const HALLUCINATION_CONCEPTS = Object.freeze({
    HALL_T1: 'HALL-T1',   // Type 1: Pure Noise
    HALL_T2: 'HALL-T2',   // Type 2: Misformatted Truth
    HALL_T3: 'HALL-T3',   // Type 3: Novel Insight (Validated Creativity)
});

// --- INDIVIDUAL EXPORTS (For backward compatibility with existing named imports) ---

// AGI CONCEPTS
export const {
    AGI_C_01, AGI_C_02, AGI_C_03, AGI_C_04, AGI_C_05, AGI_C_06, AGI_C_07, AGI_C_08, AGI_C_09, AGI_C_10, AGI_C_11, AGI_C_12, AGI_C_13, AGI_C_14,
} = AGI_CONCEPTS;

// ARCHITECTURAL CONCEPTS
export const {
    ARCH_ATM_01, ARCH_ATM_02,
} = ARCHITECTURAL_CONCEPTS;

// HALLUCINATION CONCEPTS
export const {
    HALL_T1, HALL_T2, HALL_T3,
} = HALLUCINATION_CONCEPTS;

// CATEGORY CONSTANTS (Kept separate as they are top-level enumerators)
export const CATEGORY_AGI = 'AGI';
export const CATEGORY_ARCH = 'ARCH';
export const CATEGORY_HALLUCINATION = 'HALLUCINATION';