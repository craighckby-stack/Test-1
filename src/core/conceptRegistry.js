// src/core/conceptRegistry.js

/**
 * @fileoverview A centralized, unified, and type-safe registry for all formalized AGI and Architectural Concepts.
 * This registry serves as the single source of truth for concept IDs used throughout the Sovereign codebase,
 * facilitating documentation, cross-referencing, and runtime concept validation.
 *
 * Refactored to use a single-pass initialization for improved efficiency and better API organization.
 */

// --- Internal Data Structure ---

const CONCEPT_DEFINITIONS = [
    // AGI CONCEPTS
    { id: 'AGI-C-01', category: 'AGI', name: 'General vs. Narrow Intelligence', definition: 'Achieving cross-domain reasoning.', status: 'Fundamental', implementationPath: null },
    { id: 'AGI-C-02', category: 'AGI', name: 'Emergent Behavior', definition: 'Complex patterns from simple rules interacting at scale.', status: 'Fundamental', implementationPath: null },
    { id: 'AGI-C-03', category: 'AGI', name: 'Adaptive Strategic Refinement', definition: 'Improving own learning process based on ATM/SIC history.', status: 'In Development', implementationPath: null },
    { id: 'AGI-C-04', category: 'AGI', name: 'Self-Modification (Autogeny)', definition: 'The capacity for the system to rewrite its own source code.', status: 'Critical Core', implementationPath: 'src/core/evolutionEngine.js' },
    { id: 'AGI-C-05', category: 'AGI', name: 'Multi-Agent Systems', definition: 'Intelligence arising from cooperating and competing specialized agents.', status: 'Core', implementationPath: 'src/agents/agentOrchestrator.js' },
    { id: 'AGI-C-06', category: 'AGI', name: 'Embodied Cognition', definition: 'Interaction with the codebase as the environment.', status: 'Philosophical/Core', implementationPath: 'src/fileSystem/codebaseInterface.js' },
    { id: 'AGI-C-07', category: 'AGI', name: 'Theory of Mind', definition: 'Inferring developer intent from context clues.', status: 'Core', implementationPath: 'src/critique/intentAnalyzer.js' },
    { id: 'AGI-C-08', category: 'AGI', name: 'Common Sense Reasoning', definition: 'Applying internalized general principles to code decisions.', status: 'In Development', implementationPath: 'src/memory/knowledgeGraph.js' },
    { id: 'AGI-C-09', category: 'AGI', name: 'Continual Learning', definition: 'Persistent learning across sessions without catastrophic forgetting.', status: 'Core', implementationPath: 'src/memory/longTermMemory.js' },
    { id: 'AGI-C-10', category: 'AGI', name: 'Goal-Directed Behavior', definition: 'Autonomously generating and pursuing goals (driven by AGI-C-14).', status: 'Core', implementationPath: null },
    { id: 'AGI-C-11', category: 'AGI', name: 'Meta-Cognitive Risk Assessment (MCRA)', definition: 'Calculating the system-wide impact (risk/reward) of a proposed mutation.', status: 'Critical Consensus', implementationPath: 'src/consensus/mcraEngine.js' },
    { id: 'AGI-C-12', category: 'AGI', name: 'Contextual Influence Weighting (CIW)', definition: 'Dynamically modulating agent ATM based on task context and required skill set.', status: 'Core ATM', implementationPath: 'src/consensus/critique.js' },
    { id: 'AGI-C-13', category: 'AGI', name: 'Strategic Intent Cache (SIC)', definition: 'Formalizing successful novel insights (Type 3 Hallucinations) into abstract strategic blueprints.', status: 'Memory/Strategic', implementationPath: 'src/memory/strategicCache.js' },
    { id: 'AGI-C-14', category: 'AGI', name: 'Cooperative Goal Discovery (CGD)', definition: 'Agent negotiation protocol for setting the highest priority goal/agenda.', status: 'Agent Protocol', implementationPath: 'src/agents/goalDiscovery.js' },

    // ARCHITECTURAL CONCEPTS
    { id: 'ARCH-ATM-01', category: 'ARCH', name: 'ATM Trust Calibration', definition: 'Measures real-time output quality to establish and update baseline trust scores.', status: 'Critical Consensus', implementationPath: 'src/consensus/atmSystem.js' },
    { id: 'ARCH-ATM-02', category: 'ARCH', name: 'Trust Decay Schedule (TDS)', definition: 'Systematically decays established trust scores (ATM) over time to prevent stagnation.', status: 'Critical Consensus', implementationPath: 'src/consensus/atmSystem.js' },

    // HALLUCINATION CONCEPTS (Integrated)
    { id: 'HALL-T1', category: 'HALLUCINATION', name: 'Type 1: Pure Noise', definition: 'Unsalvageable factual errors or irrelevant outputs.', action: 'Discard' },
    { id: 'HALL-T2', category: 'HALLUCINATION', name: 'Type 2: Misformatted Truth', definition: 'Contains valuable truth but requires significant structural reform to be useful.', action: 'Salvage/Reformulate' },
    { id: 'HALL-T3', category: 'HALLUCINATION', name: 'Type 3: Novel Insight (Validated Creativity)', definition: 'Highly successful, non-obvious solutions that exceed direct expectation, requiring formalization.', action: 'Capture, Validate, and Cache via SIC (AGI-C-13)' }
];

/**
 * Performs a single pass over the definitions array to construct all required lookup structures (by ID and by Category).
 * This initializes the entire registry efficiently.
 * @returns {{all: Array<Object>, byId: Object, byCategory: Object, getConceptById: Function, getConceptsByCategory: Function}}
 */
function initializeRegistry() {
    const registryById = {};
    const registryByCategory = {};

    CONCEPT_DEFINITIONS.forEach(concept => {
        // 1. By ID (O(1) access)
        registryById[concept.id] = concept;

        // 2. By Category (Optimized grouping)
        const categoryKey = concept.category;
        if (!registryByCategory[categoryKey]) {
            registryByCategory[categoryKey] = [];
        }
        registryByCategory[categoryKey].push(concept);
    });

    // Ensure structures are read-only to enforce Conceptual Integrity
    Object.freeze(registryById);
    Object.freeze(registryByCategory);

    return {
        // The raw list, useful for iteration/documentation
        all: CONCEPT_DEFINITIONS,

        // O(1) Lookup map
        byId: registryById,

        // Categorized list map
        byCategory: registryByCategory,

        /** Retrieves a concept definition by its unique ID. */
        getConceptById: (id) => registryById[id] || null,

        /** Retrieves all concepts within a specific category. */
        getConceptsByCategory: (category) => registryByCategory[category] || [],
    };
}

// --- Public Exports ---

/**
 * The unified, immutable Concept Registry instance, containing all data and lookup methods.
 */
export const ConceptRegistry = initializeRegistry();

// Backward compatibility / convenience exports
export const getConceptById = ConceptRegistry.getConceptById;
export const CONCEPT_REGISTRY = ConceptRegistry.byId;
export const CONCEPT_CATEGORIES = ConceptRegistry.byCategory;
