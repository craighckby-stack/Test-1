/**
 * Configuration Schema Definition.
 * Provides structure, types, and constraints for system configuration.
 */

// --- Internal Schema Definition Helpers ---

/**
 * Creates a generic schema field definition.
 * @param {string} type - The expected data type (e.g., 'string', 'number').
 * @param {object} props - Additional properties (required, default, description, enum, etc.).
 */
const Field = (type, props) => ({ type, ...props });

/**
 * Creates a schema field definition for strings.
 * @param {object} props - Properties including required, default, description, and optionally enum.
 */
const StringField = (props) => Field('string', props);

// --- Configuration Schema Definition ---

const configSchema = {
    app: {
        id: StringField({ required: true, description: 'Application identifier' }),
        root: StringField({ required: true, description: 'Absolute root directory path' })
    },
    dirs: {
        logs: StringField({ required: true, description: 'Name of the logging directory' }),
        temp: StringField({ required: true, description: 'Name of the temporary files directory' })
    },
    logging: {
        logLevel: StringField({
            required: true,
            default: 'info',
            enum: ['debug', 'info', 'warn', 'error'],
            description: 'Logging verbosity level'
        }),
        auditFileName: StringField({ required: true, description: 'Filename for OGT decisions audit log' }),
        auditPath: StringField({ required: false, description: 'Derived full path to the audit file' })
    }
};

module.exports = configSchema;
