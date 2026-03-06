import { defineAction } from '@genkit-ai/core';
import { z } from 'zod';

const ImpactSchema = z.enum(['critical', 'high', 'medium', 'low', 'unclassified']);
const ScopeSchema = z.enum(['core', 'integration', 'peripheral', 'auxiliary']);

const TRE_POLICY_INTERNAL_MAP = {
  'critical:core': 'high_critical',
  'critical:integration': 'critical_integration',
  'high:core': 'medium_high',
  'critical': 'medium_high',
  'high': 'medium_high',
  'medium': 'medium_default',
  'low': 'low_default',
  'unclassified': 'low_default'
};

const NEXUS_EVOLUTION_STATE = {
  risk_floor_enabled: true,
  default_floor_level: 0.05,
  critical_thresholds: {
    core_execution: 0.10,
    integrity_check: 0.07
  },
  override_policy: "STRICT_COMPLIANCE"
};

/**
 * NEXUS_CORE Mutation: trePolicyLoader
 * Derived from tre_policy_loader.py via Genkit Action Pattern
 */
export const trePolicyLoader = defineAction(
  {
    name: 'trePolicyLoader',
    inputSchema: z.object({
      impact: ImpactSchema,
      scope: ScopeSchema.optional(),
      bypassOverride: z.boolean().optional().default(false)
    }),
    outputSchema: z.object({
      policy_key: z.string(),
      applied_threshold: z.number(),
      compliance_status: z.string(),
      meta: z.object({
        source: z.string(),
        version: z.string()
      })
    }),
  },
  async (input) => {
    const { impact, scope, bypassOverride } = input;
    const lookupKey = scope ? `${impact}:${scope}` : impact;

    let policyKey = TRE_POLICY_INTERNAL_MAP[lookupKey] || TRE_POLICY_INTERNAL_MAP[impact] || 'low_default';

    let activeThreshold = NEXUS_EVOLUTION_STATE.default_floor_level;
    
    if (NEXUS_EVOLUTION_STATE.risk_floor_enabled) {
      if (scope === 'core') {
        activeThreshold = NEXUS_EVOLUTION_STATE.critical_thresholds.core_execution;
      } else if (impact === 'critical') {
        activeThreshold = NEXUS_EVOLUTION_STATE.critical_thresholds.integrity_check;
      }
    }

    const complianceStatus = (!bypassOverride) 
      ? NEXUS_EVOLUTION_STATE.override_policy 
      : "DEVOLVED_AUTONOMY";

    return {
      policy_key: policyKey,
      applied_threshold: activeThreshold,
      compliance_status: complianceStatus,
      meta: {
        source: "NEXUS_CORE_EVOLUTION_ENGINE",
        version: "v3.1.SATURATION_AWARE"
      }
    };
  }
);

export const getPolicyMetadata = () => ({
  dimensions: Object.keys(TRE_POLICY_INTERNAL_MAP),
  state_memory: NEXUS_EVOLUTION_STATE
});