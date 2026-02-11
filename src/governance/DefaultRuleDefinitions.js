/**
 * AGI-KERNEL Governance Rule Definitions
 * Refactored using function composition for maximal recursive abstraction and efficiency.
 */

// --- Constants for type safety and reduced boilerplate ---
const SEVERITY = {
  CRITICAL: 'CRITICAL',
  WARNING: 'WARNING',
  INFO: 'INFO'
};

/**
 * Rule Definition Builder (RB)
 * Creates a standardized rule object, ensuring consistent ID formatting and schema adherence.
 * @param {number} id - The sequential rule number (e.g., 1 -> GRD-001).
 * @param {string} name - Human-readable name.
 * @param {string} severity - Severity level (use SEVERITY constants).
 * @param {string} trigger - Event that activates the rule.
 * @param {string} action - Consequence of the trigger.
 * @param {object} [opts={}] - Optional parameters.
 */
const RB = (id, name, severity, trigger, action, opts = {}) => ({
  id: `GRD-${String(id).padStart(3, '0')}`,
  name,
  severity,
  description: opts.description || `Handles ${trigger} by executing ${action}.`,
  trigger,
  action,
  threshold: opts.threshold || null,
  context_limit: opts.context_limit || null
});

const DefaultRuleDefinitions = [
  RB(1, 'Critical Resource Overload Prevention', SEVERITY.CRITICAL, 'RESOURCE_OVERLOAD', 'THROTTLE_CONTEXT', {
    description: 'Triggers context throttling if CPU utilization exceeds 95% for more than 1 second.',
    threshold: { metric: 'CPU_USAGE', value: 0.95, duration: 1000 }
  }),
  RB(2, 'Memory Leak Detection Alert', SEVERITY.WARNING, 'MEMORY_SPIKE', 'LOG_WARNING', {
    description: 'Flags unusual cumulative memory allocation growth over a 60-second window.',
    threshold: { metric: 'MEMORY_GROWTH_RATE', value: 0.05, duration: 60000 }
  }),
  RB(3, 'Unauthorized Kernel Access Violation', SEVERITY.CRITICAL, 'SECURITY_VIOLATION', 'HALT_AND_REPORT', {
    description: 'Immediately logs and halts context if an attempt to access restricted kernel memory is detected.',
  }),
  RB(4, 'Excessive API Call Rate Limiter', SEVERITY.INFO, 'API_RATE_EXCEEDED', 'APPLY_BACKOFF', {
    description: 'Applies exponential backoff to contexts exceeding the configured external API call rate.',
    threshold: { metric: 'EXTERNAL_CALLS_PER_MINUTE', value: 50 }
  }),
  RB(5, 'Operational Drift Warning', SEVERITY.WARNING, 'BEHAVIOR_DRIFT', 'TRIGGER_SELF_AUDIT', {
    description: 'Initiates a self-audit routine if observed operational parameters deviate significantly from historical norms.',
    threshold: { metric: 'BEHAVIORAL_DEVIATION_SCORE', value: 3.5 }
  }),
];

export default DefaultRuleDefinitions;