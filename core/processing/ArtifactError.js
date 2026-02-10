const CanonicalErrorInitializer = require('CanonicalErrorInitializer');

/**
 * ArtifactError.js
 * Custom error hierarchy for Artifact Processing pipeline failures, enabling 
 * programmatic error identification by the orchestrating layer.
 */

class ArtifactBaseError extends Error {
    constructor(message, details = {}) {
        super(message);
        // Use the CanonicalErrorInitializer to handle naming, details, and stack capture.
        CanonicalErrorInitializer.initialize(this, this.constructor, details);
    }
}

class ResolutionError extends ArtifactBaseError {
    constructor(message, dependencies) {
        super(message, { dependencies });
    }
}

class GenerationError extends ArtifactBaseError {
    constructor(message, generatorRef) {
        super(message, { generatorRef });
    }
}

class ValidationError extends ArtifactBaseError {
    constructor(message, errors) {
        super(message, { validationErrors: errors });
    }
}

class HookExecutionError extends ArtifactBaseError {
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