const { CanonicalBaseError } = require('CanonicalBaseError');

/**
 * ArtifactError.js
 * Custom error hierarchy for Artifact Processing pipeline failures, enabling 
 * programmatic error identification by the orchestrating layer.
 */

class ArtifactBaseError extends CanonicalBaseError {
    // Inherits standardized error initialization (naming, details, stack capture)
    // from CanonicalBaseError, abstracting away the direct use of CanonicalErrorInitializer.
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
