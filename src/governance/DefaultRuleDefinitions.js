/**
 * G-03 Rule Definitions
 * 
 * Defines the standard set of governance rules, enabling the RuleExecutorRegistry
 * to be initialized via dependency injection, ensuring clean separation of logic and configuration.
 * 
 * Format: Array<{ code: string, handler: function }>
 */

// --- Handler Implementation Examples ---

// Rule 1: Dependency Integrity Check (Simulated Async Check)
const dependencyIntegrityCheck = async (payload, config) => {
    // Simulation: Replace with actual filesystem or manifest lookup
    await new Promise(resolve => setTimeout(resolve, 5)); 
    return { 
        compliant: true, 
        message: "Dependencies validated against system manifest.",
        code: 'DEPENDENCY_INTEGRITY'
    };
};

// Rule 2: Resource Limit Check (Synchronous Check)
const resourceLimitCheck = (payload, config) => {
    // Standard invariant check
    const maxSize = config.maxCodeSize || 5000; // default 5KB limit
    const currentSize = payload.content?.length || 0;
    const compliant = currentSize <= maxSize;

    return {
        compliant,
        message: compliant ? "Resource limits check passed." : `Code size (${currentSize} bytes) exceeds limit (${maxSize} bytes).`,
        details: { currentSize, maxSize },
        code: 'RESOURCE_LIMITS'
    };
};

// Rule 3: Governance History Marker Signal Check (Traceability requirement)
const ghmSignalCheck = (payload) => {
    const compliant = !!payload.metadata?.ghm_signal;
    return {
        compliant,
        message: compliant ? "GHM signal detected." : "Missing mandatory GHM traceability signal in metadata.",
        code: 'GHM_SIGNAL'
    };
};

module.exports = [
    { code: 'DEPENDENCY_INTEGRITY', handler: dependencyIntegrityCheck },
    { code: 'RESOURCE_LIMITS', handler: resourceLimitCheck },
    { code: 'GHM_SIGNAL', handler: ghmSignalCheck },
];
