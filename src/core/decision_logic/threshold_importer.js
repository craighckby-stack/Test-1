/**
 * @file threshold_importer.js
 * @component Axiomatic Configuration Importer (L7)
 * 
 * Loads, validates, and freezes the core failure manifest. This enforces
 * configuration immutability critical for Core Decision Axioms (COF/P-01)
 * across all distributed consumers in the L7 GSEP-C V3.5 layer.
 */

import THRESHOLD_MANIFEST from '../../../config/core_failure_thresholds_manifest_v2.json';
// Import the abstracted configuration loading plugin
import { ImmutableConfigImporter } from 'AGI_PLUGINS/ImmutableConfigImporter'; 

// Step 1: Structure the raw configuration manifest data.
const RawCoreConfigData = {
    VERSION: THRESHOLD_MANIFEST.version,
    
    // Fundamental constants accessible directly
    CONSTANTS: {
        TAU_NORM: THRESHOLD_MANIFEST.CONSTANTS.TAU_NORM,
        EPSILON_MIN: THRESHOLD_MANIFEST.CONSTANTS.EPSILON_MIN
    },

    // Tiered thresholds
    THRESHOLDS: THRESHOLD_MANIFEST.THRESHOLDS
};

/**
 * Use the ImmutableConfigImporter plugin to deep-freeze the structured configuration.
 * This prevents runtime modification, upholding the Axiomatic contract (COF/P-01).
 */
export const CoreFailureManifest = ImmutableConfigImporter.load(RawCoreConfigData);

// Example Usage:
// import { CoreFailureManifest } from './threshold_importer';
// const tau = CoreFailureManifest.CONSTANTS.TAU_NORM;
