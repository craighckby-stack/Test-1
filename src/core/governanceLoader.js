/**
 * GovernanceLoader: Critical Configuration Handler for Sovereign AGI
 * Role: Loads, validates, and distributes immutable, externally mandated governance configuration (OGT thresholds).
 * Note: Uses synchronous file reading during startup initialization. Failure results in process halt.
 */

import fs from 'fs';
import yaml from 'js-yaml';
import Joi from 'joi';
import logger from '../utils/logger';
import ConfigPaths from '../config/ConfigPaths'; // Import proposed centralized path utility

// Define the required immutable schema for external governance controls
// Immutability is critical for compliance and deterministic operation.
const GovernanceSchema = Joi.object({
    required_confidence_default: Joi.number().min(0).max(1).strict().required().label('Required Confidence Default'),
    risk_model_weights: Joi.object().pattern(Joi.string().strict(), Joi.number().strict()).required().label('Risk Model Weights'),
    atm_decay_rate: Joi.number().min(0).max(1).strict().required().label('ATM Decay Rate'),
    // Allows governance file to temporarily override strictness if migration requires it
    strict_validation: Joi.boolean().default(true).label('Strict Validation Flag'),
}).unknown(false); // Disallow unknown properties by default (high compliance standard)

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
        const fileContents = fs.readFileSync(path, 'utf8');
        const rawConfig = yaml.load(fileContents);
        
        // Determine validation strictness based on the governance file itself
        const validationOptions = {
            abortEarly: false,
            allowUnknown: rawConfig.strict_validation === false
        };

        const { error, value } = GovernanceSchema.validate(rawConfig, validationOptions);

        if (error) {
            logger.error('Governance Configuration Validation Failed:', error.details);
            // Aggregate validation errors into a clean message
            const errorMessages = error.details.map(d => `${d.context.label} [${d.type}]: ${d.message}`).join('; ');
            throw new Error(`Validation Error Summary: ${errorMessages}`);
        }
        
        return value;
    }

    /**
     * Initializes the governance config. This must be called successfully before operations begin.
     * @returns {Object} The immutable governance configuration object.
     */
    initialize() {
        if (this._config) {
            logger.warn('Governance configuration already initialized. Skipping reload.');
            return this._config;
        }

        const configPath = ConfigPaths.GOVERNANCE_CONFIG;

        try {
            const validatedConfig = this._loadAndValidateConfig(configPath);
            
            // Enforce immutability upon successful loading to ensure governance contract stability
            this._config = Object.freeze(validatedConfig); 
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
             throw new Error('Governance configuration not initialized. Call initialize() first.');
        }
        return this._config; 
    }

    /**
     * Accessor for critical AI risk thresholds (e.g., used by C-11 MCRA module)
     */
    getRiskThresholds() {
        return {
            requiredConfidenceDefault: this.config.required_confidence_default,
            riskWeights: this.config.risk_model_weights
        };
    }
    
    /**
     * Accessor for Autonomous Timeline Management (ATM) settings
     */
    getAtmSettings() {
        return {
            decayRate: this.config.atm_decay_rate,
        };
    }
}

export default new GovernanceLoader();
