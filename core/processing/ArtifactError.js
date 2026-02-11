const { CanonicalBaseError } = require('CanonicalBaseError');

/**
 * ArtifactError.js
 * Custom error hierarchy for Artifact Processing pipeline failures, enabling 
 * programmatic error identification by the orchestrating layer.
 */

class ArtifactBaseError extends CanonicalBaseError {
    /** @type {string} Canonical prefix for all Artifact Processing errors. */
    static ERROR_PREFIX = 'AGI_ARTIFACT_PROCESS';
    /** @type {number} Default HTTP status code for general processing failures. */
    static HTTP_STATUS_CODE = 500;
}

class ResolutionError extends ArtifactBaseError {
    static ERROR_NAME = 'ResolutionError';

    constructor(message, dependencies) {
        super(message, { dependencies });
    }
}

class GenerationError extends ArtifactBaseError {
    static ERROR_NAME = 'GenerationError';

    constructor(message, generatorRef) {
        super(message, { generatorRef });
    }
}

class ValidationError extends ArtifactBaseError {
    static ERROR_NAME = 'ValidationError';
    // 400 is used here as validation typically implies the input artifact/data was malformed or non-compliant.
    static HTTP_STATUS_CODE = 400;

    constructor(message, errors) {
        super(message, { validationErrors: errors });
    }
}

class HookExecutionError extends ArtifactBaseError {
    static ERROR_NAME = 'HookExecutionError';

    constructor(message, hookName) {
        super(message, { hookName });
    }
}

module.exports = {
    ArtifactBaseError,
    ResolutionError,
    GenerationError,
    ValidationError,
    HookExecutionError
};
