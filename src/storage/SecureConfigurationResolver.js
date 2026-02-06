const fs = require('fs/promises');

/**
 * Component: SecureConfigurationResolver
 * Role: I/O Gateway for Critical Configurations
 * Mandate: Acts as the exclusive source of truth for critical configurations, 
 *          enforcing immediate integrity verification by the CIM before returning 
 *          the content to the consuming module. This prevents unverified data 
 *          from entering the runtime.
 */
class SecureConfigurationResolver {
    
    /**
     * @param {object} cim - Instance of ConfigIntegrityMonitor.
     * @param {object} auditLogger - D-01 Audit interface.
     */
    constructor(cim, auditLogger) {
        if (!cim || !auditLogger) {
            throw new Error("Resolver requires CIM and AuditLogger.");
        }
        this.cim = cim;
        this.auditLogger = auditLogger;
    }

    /**
     * Reads and verifies the content of a critical configuration file.
     * @param {string} filePath - The path to the configuration file.
     * @returns {Promise<string>} The verified content of the file.
     * @throws {CIMIntegrityError|Error} If integrity check fails or file read fails.
     */
    async resolve(filePath) {
        let content;
        try {
            // 1. Read the file content securely.
            content = await fs.readFile(filePath, { encoding: 'utf8' });
            
        } catch (e) {
            this.auditLogger.logCritical("CONFIG_IO_FAILURE", `Failed to read configuration file: ${filePath}.`, { error: e.message });
            throw new Error(`File system read error: ${filePath}`);
        }

        // 2. Immediately enforce integrity check via CIM (ConfigIntegrityMonitor)
        // CIM throws CIMIntegrityError on failure, which aborts resolution.
        try {
            this.cim.checkIntegrity(filePath, content);
            
        } catch (e) {
            // If CIM fails, the error is already logged critically by the CIM component.
            this.auditLogger.logSystemEvent("RESOLVER_VETO", `Resolution failed due to CIM integrity breach for ${filePath}.`);
            throw e; // Propagate CIMIntegrityError
        }

        this.auditLogger.logSystemEvent("RESOLVER_SUCCESS", `Configuration resolved and verified: ${filePath}.`);
        return content;
    }
}

module.exports = SecureConfigurationResolver;