/**
 * GovernanceLoader: Critical Configuration Handler for Sovereign AGI
 * Role: Loads, validates, and distributes immutable, externally mandated governance configuration (OGT thresholds).
 * Note: Uses synchronous file reading during startup initialization. Failure results in process halt.
 */

import fs from 'fs';
import yaml from 'js-yaml';
import logger from '../utils/logger';
import ConfigPaths from '../config/ConfigPaths';
import GovernanceSchema from './governance/GovernanceSchema'; // Import decoupled schema
import { GovernanceKeys } from './governance/GovernanceKeys'; // Import keys for safe accessors

class GovernanceLoader {
    constructor() {
        this._config = null; 
    }

    /**
     * Internal helper to load and validate the configuration file contents.
     * @param {string} path - The path to the governance YAML file.
     * @returns {Object} The validated configuration object.
     */
    _loadAndValidateConfig(path) {
        try {
            const fileContents = fs.readFileSync(path, 'utf8');
            const rawConfig = yaml.load(fileContents);
            
            // Determine validation strictness based on the governance file itself
            const validationIsStrict = rawConfig[GovernanceKeys.STRICT_VALIDATION] !== false;

            const validationOptions = {
                abortEarly: false,
                allowUnknown: !validationIsStrict, // Allow unknowns if strict_validation is explicitly false
                stripUnknown: validationIsStrict, // Strip unknown properties if strict (cleaner final config)
            };

            const { error, value } = GovernanceSchema.validate(rawConfig, validationOptions);

            if (error) {
                // Improved structured error reporting
                const errorMessages = error.details
                    .map(d => `[${d.path.join('.') || 'Root'}]: ${d.message}`)
                    .join('; ');

                logger.error('Governance Configuration Validation Failed. Strictness:', validationIsStrict, { errors: error.details.length });
                throw new Error(`Governance Contract Validation Failed: ${errorMessages}`);
            }
            
            return value;
        } catch (e) {
            // Standardize exceptions from file access or YAML parsing
            if (e.name === 'YAMLException' || e.code === 'ENOENT') {
                throw new Error(`File access/parsing failed: ${e.message}`);
            }
            throw e; // Re-throw validation errors
        }
    }

    /**
     * Initializes the governance config. This must be called successfully before operations begin.
     * @returns {Object} The immutable governance configuration object.
     */
    initialize() {
        if (this._config) {
            logger.debug('Governance configuration already initialized. Skipping reload.');
            return this._config;
        }

        const configPath = ConfigPaths.GOVERNANCE_CONFIG;

        try {
            const validatedConfig = this._loadAndValidateConfig(configPath);
            
            // Remove the internal 'strict_validation' key before freezing the exposed configuration
            const { [GovernanceKeys.STRICT_VALIDATION]: _, ...exposedConfig } = validatedConfig;
            
            // Enforce immutability upon successful loading to ensure governance contract stability
            this._config = Object.freeze(exposedConfig); 
            logger.info('Governance configuration loaded and verified (Immutable).');
            return this._config;

        } catch (e) {
            // Mandatory halt if governance thresholds cannot be established (Compliance requirement)
            logger.fatal(`FATAL OGT ERROR: Could not establish governance contract using ${configPath}. Reason: ${e.message}`);
            process.exit(1); // Non-recoverable startup failure
        }
    }

    /**
     * Retrieves the entire immutable configuration object.
     * @returns {Object} The immutable governance configuration.
     */
    get config() {
        if (!this._config) {
             throw new Error('Sovereign AGI Initialization Failure: Governance configuration not established. Call initialize() first.');
        }
        return this._config; 
    }

    /**
     * Accessor for critical AI risk thresholds (e.g., used by C-11 MCRA module)
     */
    getRiskThresholds() {
        return {
            requiredConfidenceDefault: this.config[GovernanceKeys.REQUIRED_CONFIDENCE_DEFAULT],
            riskWeights: this.config[GovernanceKeys.RISK_MODEL_WEIGHTS]
        };
    }
    
    /**
     * Accessor for Autonomous Timeline Management (ATM) settings
     */
    getAtmSettings() {
        return {
            decayRate: this.config[GovernanceKeys.ATM_DECAY_RATE],
        };
    }
}

export default new GovernanceLoader();