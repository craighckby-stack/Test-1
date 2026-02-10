/**
 * ACVD Profile Resolver Utility
 * Reads acvd_profile_map.json and resolves configuration keys (e.g., verificationPipelineKey)
 * into concrete values defined in the 'definitions' section, applying inheritance logic.
 */

const fs = require('fs');
const path = require('path');

// Specific mapping of ACVD keys to definition containers.
const ACVD_DEFINITION_MAPPING = {
    targetInfrastructureKey: 'infrastructureTargets',
    verificationPipelineKey: 'verificationPipelines',
    preflightCheckKey: 'preflightChecks',
    deploymentStrategyKey: 'deploymentStrategies'
};

/**
 * Resolves a profile using the HierarchicalConfigResolver tool via the AGI kernel capabilities.
 *
 * @param {string} profileName The name of the profile to resolve.
 * @param {object} mapData The configuration map containing profiles and definitions.
 * @returns {object} The fully resolved profile configuration.
 */
function resolveProfile(profileName, mapData) {
    // Ensure the required kernel capability is available.
    if (typeof KERNEL_SYNERGY_CAPABILITIES === 'undefined' || typeof KERNEL_SYNERGY_CAPABILITIES.Tool === 'undefined') {
        throw new Error('AGI Tool Dependency Error: KERNEL_SYNERGY_CAPABILITIES.Tool is required.');
    }
    
    const payload = {
        profileName: profileName,
        mapData: mapData,
        keyResolutionMap: ACVD_DEFINITION_MAPPING
    };
    
    try {
        // Use the standardized kernel capability invocation method.
        return KERNEL_SYNERGY_CAPABILITIES.Tool.execute('HierarchicalConfigResolver', payload);
    } catch (e) {
        // Re-throw the error, potentially wrapping it for context.
        if (e instanceof Error) {
             throw e;
        }
        throw new Error(`Profile resolution failed for '${profileName}': ${e}`);
    }
}

// Example usage (assuming map file is loaded externally):
// const mapData = JSON.parse(fs.readFileSync(path.join(__dirname, 'acvd_profile_map.json'), 'utf8'));
// const productionConfig = resolveProfile('production', mapData);

module.exports = { resolveProfile };