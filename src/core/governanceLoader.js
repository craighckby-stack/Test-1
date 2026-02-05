/**
 * GovernanceLoader: Configuration Handler for OGT
 * Role: Loads, validates, and distributes external governance configuration.
 */

import fs from 'fs';
import yaml from 'js-yaml';
import Joi from 'joi';
import logger from '../utils/logger';

const CONFIG_PATH = 'config/governance.yaml';

// Define the required schema for external governance controls
const GovernanceSchema = Joi.object({
    required_confidence_default: Joi.number().min(0).max(1).required(),
    risk_model_weights: Joi.object().pattern(Joi.string(), Joi.number()).required(),
    atm_decay_rate: Joi.number().min(0).max(1).required(),
    // ... (other critical OGT thresholds)
});

class GovernanceLoader {
    constructor() {
        this.config = null;
    }

    async loadAndValidate() {
        try {
            const fileContents = fs.readFileSync(CONFIG_PATH, 'utf8');
            const rawConfig = yaml.load(fileContents);
            
            const { error, value } = GovernanceSchema.validate(rawConfig, { abortEarly: false });

            if (error) {
                logger.error('Governance Configuration Validation Failed:', error.details);
                throw new Error(`Invalid governance schema: ${error.message}`);
            }
            
            this.config = value;
            logger.info('Governance configuration loaded and validated successfully.');
            return this.config;

        } catch (e) {
            logger.fatal(`FATAL ERROR: Could not initialize OGT configuration: ${e.message}`);
            // Mandatory halt if governance thresholds cannot be established
            process.exit(1);
        }
    }

    /**
     * Distributes configuration subset to specific components (e.g., C-11 MCRA)
     */
    getThresholds() {
        if (!this.config) throw new Error('Configuration not loaded.');
        return {
            confidenceDefault: this.config.required_confidence_default,
            riskWeights: this.config.risk_model_weights
        };
    }
    
    // ... (Other getters for ATM settings)
}

export default new GovernanceLoader();