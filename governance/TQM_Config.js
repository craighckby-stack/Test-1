/**
 * TQM Configuration Loader
 * Loads the Total Quality Management thresholds and configuration data.
 */
const TQM_THRESHOLDS = require('./TQM_Thresholds.json');

module.exports = {
    /**
     * Retrieves the full TQM configuration object.
     * @returns {object}
     */
    getThresholds: () => TQM_THRESHOLDS,

    /**
     * Performs a basic structural validation of the loaded configuration.
     * @returns {boolean}
     * @throws {Error} if core configuration is missing.
     */
    validateConfig: () => {
        if (!TQM_THRESHOLDS || !TQM_THRESHOLDS.TQM_Core_Config) {
            throw new Error("TQM Configuration is invalid or missing core structure.");
        }
        return true;
    }
};