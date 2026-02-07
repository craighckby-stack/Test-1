/**
 * ProofStrategyResolver
 * Central utility for dynamic loading and retrieval of configured validation modules.
 * This implementation uses internal configuration to map strategy names to code modules.
 */

import ValidationConfig from 'config/governance/ProofValidationParameters.v94.config.json';

// NOTE: This internal map links configured module names to their physical file paths/classes.
const VALIDATOR_MAP = {
  'StakeWeightedValidator': './strategies/StakeWeightedValidator.js',
  'SimpleMajorityValidator': './strategies/SimpleMajorityValidator.js',
  'CoreBFTValidator': './strategies/CoreBFTValidator.js'
};

export class ProofStrategyResolver {
  constructor() {
    this.mechanisms = ValidationConfig.mechanisms;
    this.cache = new Map();
  }

  async getValidator(mechanismId) {
    const mechanism = this.mechanisms[mechanismId];

    if (!mechanism) {
      throw new Error(`[Resolver] Mechanism ID not found: ${mechanismId}`);
    }

    if (mechanism.status !== 'ACTIVE' && mechanism.status !== 'EXPERIMENTAL') {
        throw new Error(`[Resolver] Mechanism ${mechanismId} is not operational (Status: ${mechanism.status}).`);
    }

    const moduleName = mechanism.validationStrategyModule;

    if (this.cache.has(moduleName)) {
      return this.cache.get(moduleName);
    }

    const modulePath = VALIDATOR_MAP[moduleName];
    if (!modulePath) {
       throw new Error(`[Resolver] Strategy module path not defined for: ${moduleName}`);
    }

    // Dynamic import assumes a modular environment and returns the class/function.
    const { default: ValidatorClass } = await import(modulePath);
    
    // Instantiate the validator, passing validation constraints from the config.
    const validatorInstance = new ValidatorClass(mechanism.validationParameters);
    
    this.cache.set(moduleName, validatorInstance);
    return validatorInstance;
  }
}