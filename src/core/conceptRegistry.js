// src/core/conceptRegistry.js

/**
 * @fileoverview A centralized registry for all formalized AGI and Architectural Concepts.
 * This file serves as the single source of truth for concept IDs used throughout the Sovereign codebase
 * and ensures consistency between the architecture (README) and implementation.
 */

export const AGI_CONCEPTS = {
    'AGI-C-01': { name: 'General vs. Narrow Intelligence', definition: 'Achieving cross-domain reasoning.' },
    'AGI-C-02': { name: 'Emergent Behavior', definition: 'Complex patterns from simple rules interacting at scale.' },
    'AGI-C-03': { name: 'Adaptive Strategic Refinement', definition: 'Improving own learning process based on ATM/SIC history.' },
    'AGI-C-04': { name: 'Self-Modification (Autogeny)', definition: 'The capacity for the system to rewrite its own source code.' },
    'AGI-C-05': { name: 'Multi-Agent Systems', definition: 'Intelligence arising from cooperating and competing specialized agents.' },
    'AGI-C-06': { name: 'Embodied Cognition', definition: 'Interaction with the codebase as the environment.' },
    'AGI-C-07': { name: 'Theory of Mind', definition: 'Inferring developer intent from context clues.' },
    'AGI-C-08': { name: 'Common Sense Reasoning', definition: 'Applying internalized general principles to code decisions.' },
    'AGI-C-09': { name: 'Continual Learning', definition: 'Persistent learning across sessions without catastrophic forgetting.' },
    'AGI-C-10': { name: 'Goal-Directed Behavior', definition: 'Autonomously generating and pursuing goals (driven by AGI-C-14).' },
    'AGI-C-11': { name: 'Meta-Cognitive Risk Assessment (MCRA)', definition: 'Calculating the system-wide impact (risk/reward) of a proposed mutation.' },
    'AGI-C-12': { name: 'Contextual Influence Weighting (CIW)', definition: 'Dynamically modulating agent ATM based on task context and required skill set.' },
    'AGI-C-13': { name: 'Strategic Intent Cache (SIC)', definition: 'Formalizing successful novel insights (Type 3 Hallucinations) into abstract strategic blueprints.' },
    'AGI-C-14': { name: 'Cooperative Goal Discovery (CGD)', definition: 'Agent negotiation protocol for setting the highest priority goal/agenda.' }
};

export const ARCHITECTURAL_CONCEPTS = {
    'ARCH-ATM-01': { name: 'ATM Trust Calibration', definition: 'Measures real-time output quality to establish and update baseline trust scores.' },
    'ARCH-ATM-02': { name: 'Trust Decay Schedule (TDS)', definition: 'Systematically decays established trust scores (ATM) over time to prevent stagnation.' }
};

export const HALLUCINATION_TYPES = {
    'Type 1': { description: 'Pure Noise', action: 'Discard' },
    'Type 2': { description: 'Misformatted Truth', action: 'Salvage/Reformulate' },
    'Type 3': { description: 'Novel Insight (Validated Creativity)', action: 'Capture, Validate, and Cache via SIC' }
};

// Map IDs to expected implementation files for quick reference
export const IMPLEMENTATION_MAP = {
    'AGI-C-11': 'src/consensus/mcraEngine.js',
    'AGI-C-12': 'src/consensus/critique.js',
    'AGI-C-13': 'src/memory/strategicCache.js',
    'AGI-C-14': 'src/agents/goalDiscovery.js',
    'ARCH-ATM-02': 'src/consensus/atmSystem.js'
    // ... others map to corresponding conceptual directories
};