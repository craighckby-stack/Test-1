/**
 * Configuration Schema Definition.
 * Provides structure, types, and constraints for system configuration.
 * This structure is designed to be consumed by the SchemaDefinitionIntegrityChecker
 * and subsequent declarative validation engines.
 */

interface ConfigField {
    type: string;
    required?: boolean;
    default?: any;
    enum?: string[];
    description: string;
    [key: string]: any; // Allow for future extensions
}

interface ConfigSection {
    [key: string]: ConfigField | ConfigSection;
}

const configSchema: ConfigSection = {
    app: {
        id: { type: 'string', required: true, description: 'Application identifier' },
        root: { type: 'string', required: true, description: 'Absolute root directory path' }
    },
    dirs: {
        logs: { type: 'string', required: true, description: 'Name of the logging directory' },
        temp: { type: 'string', required: true, description: 'Name of the temporary files directory' }
    },
    logging: {
        logLevel: { type: 'string', required: true, default: 'info', enum: ['debug', 'info', 'warn', 'error'], description: 'Logging verbosity level' },
        auditFileName: { type: 'string', required: true, description: 'Filename for OGT decisions audit log' },
        auditPath: { type: 'string', required: false, description: 'Derived full path to the audit file' }
    }
};

module.exports = configSchema;
