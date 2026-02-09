// core/SchemaValidator_Engine.js
import { XEL_Specification } from '../config/XEL_Specification.json';
import Ajv from 'ajv'; 

/**
 * Custom error class for structured, machine-readable validation failures.
 */
class SchemaValidationError extends Error {
    constructor(schemaName, errors) {
        // Use a temporary Ajv instance to access the errorsText utility cleanly
        const tempAjv = new Ajv();
        // Fallback for potentially malformed errors structure
        const errorText = errors && Array.isArray(errors) 
            ? tempAjv.errorsText(errors, { separator: '; ', dataVar: schemaName })
            : 'Validation context missing or malformed.';
        
        // LOGIC IMPROVEMENT: Include the most critical error keyword in the top-level message
        const criticalKeyword = errors && errors.length > 0 ? `[${errors[0].keyword}]` : '';
        
        super(`XEL Validation Failed [${schemaName}] ${criticalKeyword}: ${errorText}`);
        this.name = 'SchemaValidationError';
        this.schemaName = schemaName; 
        this.validationErrors = errors; // Raw Ajv errors for programmatic handling
    }
}

/**
 * The Schema Validator enforces the structural integrity of data across the XEL environment.
 * It is designed for robustness (Error Handling) and dynamic updates (Autonomy).
 * 
 * Improvement: Accepts external dependency (onValidationFailure) to integrate with Nexus/MQM (Integration Requirement).
 * IMPROVEMENT: Accepts a component map to link schemas to specific AGI files/components for targeted Navigation refinement.
 */
class SchemaValidatorEngine {
    /**
     * @param {object} options - Configuration options.
     * @param {object} [options.componentSchemas] - Schema definitions to override defaults.
     * @param {function} [options.onValidationFailure] - Callback function for Nexus/MQM logging. (mqmPayload, failureEntry)
     * @param {string} [options.kernelVersion='N/A'] - The current kernel version for dynamic reporting (Meta-Reasoning).
     * @param {object} [options.schemaComponentMap] - Map of schemaName -> {componentPath: string, priority: number} for Navigation targeting. (NEW)
     */
    constructor(options = {}) {
        const { 
            componentSchemas, 
            onValidationFailure, 
            kernelVersion = 'N/A', 
            schemaComponentMap = {} // Accepting new input for Navigation context
        } = options;
        
        this.validator = null;
        this.SchemaValidationError = SchemaValidationError;
        
        // Store dynamic runtime metadata
        this.kernelVersion = kernelVersion;

        // NEW: Context for AGI Navigator System
        this.schemaComponentMap = schemaComponentMap;
        
        // INTEGRATION HOOK: Function provided by the kernel core (App.js -> logToDb/MQM)
        this.onValidationFailure = onValidationFailure || (() => {}); 
        
        // Meta-Reasoning: Persistent tracking of validation failures for pattern recognition
        this.failureHistory = []; 
        this.MAX_HISTORY = 100; // Store the last 100 failures
        
        // Initialize validator using provided schemas or default imported ones
        this.initializeValidator(componentSchemas || XEL_Specification.ComponentSchemas);
    }

    /**
     * Initializes or re-initializes the Ajv instance. This supports dynamic schema updates
     * when the AGI kernel autonomously modifies configuration files (Autonomy/Infrastructure).
     * @param {object} componentSchemas - Map of schema names to JSON Schema definitions.
     */
    initializeValidator(componentSchemas) {
        // Configuration for maximum robustness and data hygiene:
        // - allErrors: Collects all issues.
        // - strict: Ensures the schemas themselves are valid.
        // - removeAdditional: Strips extraneous properties, ensuring cleaner data flow (JSON Parsing).
        this.validator = new Ajv({
            allErrors: true,
            strict: true,
            removeAdditional: 'all' 
        });

        // Add all schemas dynamically
        if (componentSchemas && typeof componentSchemas === 'object' && !Array.isArray(componentSchemas)) {
            Object.entries(componentSchemas).forEach(([name, schema]) => {
                try {
                    // Check if schema is already defined to avoid strict mode errors on re-init
                    if (this.validator.getSchema(name)) {
                         this.validator.removeSchema(name);
                    }
                    this.validator.addSchema(schema, name);
                } catch (e) {
                    // Log schema registration failure, but continue initialization
                    console.error(`[SCHEMA_ENGINE]: Failed to register schema ${name}:`, e.message);
                }
            });
        }
    }

    /**
     * Public method to manually trigger a schema refresh, allowing the kernel
     * to update specifications without a full reboot (Autonomy).
     * @param {object} newSpecification - The new ComponentSchemas object.
     */
    refreshSchemas(newSpecification) {
        // Clear old instance and re-initialize
        this.initializeValidator(newSpecification);
    }

    /**
     * Maps the type of validation error (Ajv keyword) to the primary AGI capability under stress.
     * This enhances meta-reasoning by providing strategic context to the Nexus-Database.
     * @param {string} keyword - Ajv error keyword (e.g., 'required', 'type', 'serialization_fail').
     * @returns {string} Primary AGI capability dimension.
     */
    _mapErrorToCapability(keyword) {
        switch (keyword) {
            case 'required':
            case 'additionalProperties':
                // Data structure errors frequently impact the Logic component consuming the data.
                return 'Logic';
            case 'type':
            case 'format':
            case 'maximum':
            case 'minimum':
                // Failures related to data types/constraints stress underlying Logic/Implementation integrity, but often stem from bad input source (Navigation context).
                return 'Navigation';
            case 'serialization_fail':
            case 'nonSerializable':
                // Direct failure of data persistence/handling requires robust recovery logic (Memory component handling persistence).
                return 'Memory';
            case 'const':
            case 'enum':
                // Failures in specific value constraints relate to decision boundaries (Meta-Reasoning/Governance).
                return 'Governance';
            case 'not':
            case 'if':
            case 'then':
            case 'else':
            case 'dependencies':
                // Complex conditional errors suggest architectural problems or flawed integration patterns.
                return 'Integration';
            default:
                // General structural failures or unknown issues relate to foundational schema design/quality.
                return 'Creativity'; 
        }
    }

    /**
     * Internal method to log validation failures for Meta-Reasoning analysis and trigger MQM/Nexus logging.
     * This is the critical integration point for Requirements 2 (Log to Nexus) and 3 (Use MQM metrics).
     * @param {string} schemaName 
     * @param {Array<object>} errors 
     * @param {boolean} isCritical 
     * @param {object} dataSample - The data being validated (for context extraction).
     */
    _trackFailure(schemaName, errors, isCritical, dataSample) {
        // 1. Prepare history and summary
        const summary = errors?.map(e => ({
            path: e.instancePath || e.dataPath || 'N/A',
            keyword: e.keyword,
            message: e.message
        })) || [];
        
        // Determine Capability Impact dynamically (Meta-Reasoning)
        const firstErrorKeyword = summary[0]?.keyword || 'N/A';
        const capabilityImpact = this._mapErrorToCapability(firstErrorKeyword);

        const failureEntry = {
            timestamp: Date.now(),
            schemaName,
            isCritical, 
            summary,
            count: summary.length,
            capabilityImpact: capabilityImpact // STORED for internal analysis/Memory
        };
        
        // 2. Log to Internal History (Requirement 4: Store trends in Nexus memory)
        this.failureHistory.unshift(failureEntry);
        if (this.failureHistory.length > this.MAX_HISTORY) {
            this.failureHistory.pop();
        }
        
        // 3. Trigger External Nexus/MQM Logging (Integration Points)
        const mqmPayload = {
            metric_type: 'AGI_INTEGRATION_FAILURE',
            kernel_version: this.kernelVersion, // Dynamic versioning
            source_component: 'SchemaValidatorEngine',
            // Dynamic link to core AGI capabilities for strategy refinement
            AGI_CAPABILITY_IMPACT: capabilityImpact, 
            schema_name: schemaName,
            criticality: isCritical ? 'CRITICAL_THROW' : 'SOFT_RECOVERY',
            error_count: summary.length,
            // Detailed error context for LLM output analysis
            first_error_keyword: firstErrorKeyword,
            first_error_path: summary[0]?.path || 'N/A',
            data_structure_keys: dataSample ? Object.keys(dataSample).slice(0, 8).join(', ') : 'N/A',
        };
        
        // APPLY existing tools: Use the injected function to log the metrics to Nexus/MQM system
        // Robustness Improvement: Ensure logging failure does not crash the core system.
        try {
            this.onValidationFailure(mqmPayload, failureEntry);
        } catch (e) {
            console.warn(`[MQM_LOG_FAIL]: Failed to execute onValidationFailure hook for ${schemaName}:`, e.message);
        }

        // 4. Console log only critical failures
        if (isCritical) {
             console.error(`[KERNEL_VALIDATION_CRITICAL]: Schema=${schemaName}, Errors=${summary.length}, KeyPath=${summary[0]?.path || 'N/A'}`);
        }
    }

    /**
     * Provides the recent failure history to the Nexus-Database/kernel for strategy optimization (Meta-Reasoning).
     * @returns {Array<object>} Recent validation failure records.
     */
    getFailureHistory() {
        return this.failureHistory;
    }

    /**
     * Performs a rapid self-diagnostic analysis of recent validation failures.
     * Identifies the most stressed schema and the primary AGI capability impact.
     * This emergent tool supports AGI-Kernel's Navigation and Logic refinement (Meta-Learning).
     * 
     * ENHANCEMENT: Synthesizes actionable advice for the Navigator, linking schema failures 
     * to known component paths using the injected schemaComponentMap.
     * 
     * @returns {{mostStressedSchema: string, mostImpactedCapability: string, totalFailures: number, historyLength: number, analysisDate: number, suggestedNavigatorTarget: {path: string, reason: string, increasedWeight: number} | null}}
     */
    analyzeFailureTrends() {
        const baseAnalysis = {
            mostStressedSchema: 'None',
            mostImpactedCapability: 'None',
            totalFailures: 0,
            historyLength: 0,
            analysisDate: Date.now(),
            suggestedNavigatorTarget: null
        };
        
        const history = this.failureHistory;
        if (history.length === 0) {
            return baseAnalysis;
        }

        const schemaCounts = {};
        const capabilityCounts = {};
        let totalFailures = 0;

        history.forEach(entry => {
            // Count total failure occurrences (not just entry count)
            totalFailures += entry.count;
            
            // Count by schema name
            schemaCounts[entry.schemaName] = (schemaCounts[entry.schemaName] || 0) + entry.count;
            
            // Count by capability impact
            const cap = entry.capabilityImpact || 'Unknown';
            capabilityCounts[cap] = (capabilityCounts[cap] || 0) + entry.count;
        });

        // Helper to find the key with the maximum count
        const findMax = (counts) => Object.entries(counts).reduce(
            (max, [key, count]) => (count > max.count ? { key, count } : max),
            { key: 'N/A', count: 0 }
        );

        const mostStressedSchema = findMax(schemaCounts).key;
        const mostImpactedCapability = findMax(capabilityCounts).key;
        
        baseAnalysis.mostStressedSchema = mostStressedSchema;
        baseAnalysis.mostImpactedCapability = mostImpactedCapability;
        baseAnalysis.totalFailures = totalFailures;
        baseAnalysis.historyLength = history.length;
        
        // --- Navigator Strategy Synthesis (Emergent Logic) ---
        if (mostStressedSchema !== 'None' && this.schemaComponentMap[mostStressedSchema]) {
            const mapEntry = this.schemaComponentMap[mostStressedSchema];
            
            // Suggest the primary component responsible for producing/consuming the failed schema
            baseAnalysis.suggestedNavigatorTarget = {
                path: mapEntry.componentPath,
                reason: `Schema '${mostStressedSchema}' (linked to ${mostImpactedCapability} failure) is critically unstable. Investigate and refactor source component.`, 
                // Calculate weight based on historical failure rate (higher failure => higher proposed weight increase)
                increasedWeight: Math.min(0.25, totalFailures / this.MAX_HISTORY) * (mapEntry.priority || 1) // Cap weight increase at 25% for stability
            };
        } else if (mostStressedSchema !== 'None') {
             // If component mapping is missing, suggest fixing the Schema Definition itself.
             baseAnalysis.suggestedNavigatorTarget = {
                path: `config/XEL_Specification.json`,
                reason: `Schema '${mostStressedSchema}' is highly stressed but lacks a component map link. Analyze schema definition or update governance mapping.`, 
                increasedWeight: 0.10
            };
        }


        return baseAnalysis;
    }

    /**
     * Validates an object against a specific XEL component schema (Strict Mode).
     * @param {string} schemaName - The key in ComponentSchemas (e.g., 'TaskRequest').
     * @param {object} data - The object to validate (will be modified if removeAdditional is active).
     * @throws {SchemaValidationError} If validation fails.
     */
    validate(schemaName, data) {
        const validateFn = this.validator.getSchema(schemaName);
        
        if (!validateFn) {
            throw new Error(`Configuration Error: Schema '${schemaName}' not registered in the Validator.`);
        }
        
        const valid = validateFn(data); // Data is potentially mutated here (clean up)
        
        if (!valid) {
            // Integration: Track critical failure, passing the original data structure context
            this._trackFailure(schemaName, validateFn.errors, true, data); 
            
            // Error Handling: Throw custom error 
            throw new this.SchemaValidationError(schemaName, validateFn.errors);
        }
        
        // Return the validated and cleaned data structure
        return data;
    }
    
    /**
     * Performs a soft validation, returning the validated data or null on failure.
     * Useful for robust JSON Parsing recovery logic where a hard crash is undesirable.
     * @param {string} schemaName 
     * @param {object} data 
     * @returns {object|null} Validated and cleaned data if successful, null otherwise.
     */
    tryValidate(schemaName, data) {
        const validateFn = this.validator.getSchema(schemaName);
        if (!validateFn) return null; 
        
        let dataCopy;
        try {
            // Deep copy needed for try mode, as Ajv mutates the input object when removeAdditional is used.
            // Using JSON stringify/parse for broader compatibility and explicit serialization check.
            dataCopy = JSON.parse(JSON.stringify(data));
        } catch (e) {
            // Track failure of the copying process itself if data is non-serializable (Robust JSON Parsing)
            const serializationError = {
                keyword: 'serialization_fail', 
                message: `Input data non-serializable (${e.message})`,
                instancePath: 'root'
            };
            this._trackFailure(schemaName, [serializationError], false, data);
            return null; 
        }
        
        const valid = validateFn(dataCopy);
        
        if (!valid) {
            // Integration: Track soft schema failure, passing the original data structure context
            this._trackFailure(schemaName, validateFn.errors, false, data);
            return null;
        }
        
        return dataCopy;
    }
    
    /**
     * Returns the custom structured error class for external use/catching.
     * @returns {SchemaValidationError}
     */
    getValidationErrorClass() {
        return this.SchemaValidationError;
    }
}

// We rely on the integrating kernel (App.js) to instantiate SchemaValidatorEngine with necessary hooks.
export { SchemaValidatorEngine, SchemaValidationError };
