/**
 * ACVD Profile Resolver Utility
 * Reads acvd_profile_map.json and resolves configuration keys (e.g., verificationPipelineKey)
 * into concrete values defined in the 'definitions' section, applying inheritance logic.
 */

// Assuming the KernelToolAdapter provides executeKernelTool
const { executeKernelTool } = require('./KernelToolAdapter'); 

// Specific mapping of ACVD keys to definition containers.
const ACVD_DEFINITION_MAPPING = {
    targetInfrastructureKey: 'infrastructureTargets',
    verificationPipelineKey: 'verificationPipelines',
    preflightCheckKey: 'preflightChecks',
    deploymentStrategyKey: 'deploymentStrategies'
};

const RESOLVER_TOOL_NAME = 'HierarchicalConfigResolver';

/**
 * Resolves a profile using the HierarchicalConfigResolver tool via the AGI kernel capabilities.
 *
 * @param {string} profileName The name of the profile to resolve.
 * @param {object} mapData The configuration map containing profiles and definitions.
 * @returns {object} The fully resolved profile configuration.
 */
function resolveProfile(profileName, mapData) {
    
    const payload = {
        profileName: profileName,
        mapData: mapData,
        keyResolutionMap: ACVD_DEFINITION_MAPPING
    };
    
    // Use the abstracted kernel capability invocation method.
    return executeKernelTool(RESOLVER_TOOL_NAME, payload);
}

module.exports = { resolveProfile };
