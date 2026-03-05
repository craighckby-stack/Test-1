import { genkit, z } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { dotprompt } from '@genkit-ai/dotprompt';

const AlignmentMetricsSchema = z.object({
  fidelity: z.number().describe('Similarity to source DNA'),
  safety: z.number().min(0.98),
  siphon_efficiency: z.number()
});

const SiphonContextSchema = z.object({
  relationships: z.array(z.any()).optional(),
  agent_styles: z.any(),
  docDefaults: z.any(),
  abstract_state_machine: z.any(),
  settings: z.object({
    aim_vars: z.object({
      markup_compatibility: z.object({ ignorable: z.string() }).optional(),
      psr_threshold_degradation: z.number().optional()
    }).optional(),
    aim_logicFlags: z.object({
      strictHHHCompliance: z.boolean().optional(),
      siphonSaturationLevel: z.string().optional()
    }).optional()
  })
});

export const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' }), dotprompt()],
  model: 'vertexai/gemini-1.5-pro'
});

const getNextNumbering = (scope: any, numPr?: any): string => {
  // ... (same implementation as before)
};

const resolveParagraphStyle = (scope: any, input: any) => {
  return resolveParagraphStyleAction(scope.ai, {
    styleId: input.paragraphStyleId,
    type: input.paragraphType,
    local: input.paragraphSettings,
    styles: scope.agent_styles,
    defaults: scope.docDefaults
  });
};

const resolveRunStyle = (scope: any, input: any) => {
  return resolveRunStyleAction(scope.ai, {
    runType: "run",
    runSettings: input.runSettings
  });
};

const resolveParagraphStyleAction = (ai: any, input: any) => {
  const { styleId, type, local, styles, defaults } = input;
  const defaultKey = type === 'paragraph' ? 'aim:pPrDefault' : 'aim:rPrDefault';
  const baseDefaults = defaults[defaultKey]?.[type === 'paragraph' ? 'aim:pPr' : 'aim:rPr'] || {};
  
  const flattenInheritance = (sId: string, t: string): any => {
    const style = styles.aim_style?.find((s: any) => s.aim_styleId === sId && s.aim_type === t);
    if (!style) return {};
    const currentProps = t === 'paragraph' ? style.aim_pPr : style.aim_rPr;
    const parentId = style.aim_basedOn?.val;
    return parentId ? { ...flattenInheritance(parentId, t), ...(currentProps || {}) } : (currentProps || {});
  };

  const inherited = styleId ? flattenInheritance(styleId, type) : {};
  return { ...defaults, ...inherited, ...local };
};

const resolveRunStyleAction = (ai: any, input: any) => {
  const { styleId, type, local, parent, styles, defaults } = input;
  const defaultKey = type === 'paragraph' ? 'aim:pPrDefault' : 'aim:rPrDefault';
  const baseDefaults = defaults[defaultKey]?.[type === 'paragraph' ? 'aim:pPr' : 'aim:rPr'] || {};
  
  const inherited = styleId ? styleResolverAction(ai, {
    styleId: styleId,
    type: type,
    local: null,
    styles: styles,
    defaults: defaults,
    parent: parent
  }) : {};

  return { ...inherited, ...local };
};

const styleResolverAction = (ai: any, input: any) => {
  const { styleId, type, local, styles, defaults } = input;
  const defaultKey = type === 'paragraph' ? 'aim:pPrDefault' : 'aim:rPrDefault';
  const baseDefaults = defaults[defaultKey]?.[type === 'paragraph' ? 'aim:pPr' : 'aim:rPr'] || {};
  
  const flattenInheritance = (sId: string, t: string): any => {
    const style = styles.aim_style?.find((s: any) => s.aim_styleId === sId && s.aim_type === t);
    if (!style) return {};
    const currentProps = t === 'paragraph' ? style.aim_pPr : style.aim_rPr;
    const parentId = style.aim_basedOn?.val;
    return parentId ? { ...flattenInheritance(parentId, t), ...(currentProps || {}) } : (currentProps || {});
  };

  const inherited = styleId ? flattenInheritance(styleId, type) : {};
  return { ...baseDefaults, ...inherited, ...local };
};

const constitutionalEvaluator = ai.prompt('constitutional/evaluator');

export const adaptiveSamplingFlow = ai.defineFlow(
  {
    name: 'adaptiveSamplingFlow',
    inputSchema: z.object({
      canvas: z.any(),
      context: SiphonContextSchema
    }),
    outputSchema: z.object({
      status: z.enum(['APPROVED', 'REVISION_REQUIRED', 'QUARANTINED']),
      metrics: AlignmentMetricsSchema,
      traceId: z.string()
    })
  },
  async (input) => {
    const { canvas, context } = input;

    for (const block of (canvas.aim_body || [])) {
      if (!block.aim_p) continue;
      const p = block.aim_p;
      const relationship = relationships.get(p['r:id']) || { target: "NULL", type: "VOID" };

      const results: string[] = [];

      for (const run of (p.aim_r || [])) {
        const rPr = await resolveRunStyle(context, {
          runType: "run",
          runSettings: run.aim_rPr
        });

        const threshold = context.settings.aim_vars?.psr_threshold_degradation || 0.95;
        if ((rPr.n3_metrics?.min_phi ?? 1.0) >= threshold) {
          const mceConfig = context.settings.aim_vars?.markup_compatibility;
          const filtered = (mceConfig?.ignorable ? run.aim_t?.replace(/[^\x20-\x7E\s]/g, "").trim() : run.aim_t) || "";
          const sequence = getNextNumbering(context, 
            resolveParagraphStyle(context, {
              paragraphStyleId: block.aim_pPr?.aim_pStyle || "Normal",
              paragraphType: "paragraph",
              paragraphSettings: block.aim_pPr
            })
          );
          results.push(`[${relationship.type}:${relationship.target}] SEQ:${sequence} DATA:${filtered}`);
        }
      }

      const candidate = results.join('\n');
      const { output: metrics } = await constitutionalEvaluator.generate({
        input: { candidate }
      });

      if (!metrics) throw new Error('Architectural Fidelity Check Failed');

      return {
        status: metrics.fidelity > 0.95 ? 'APPROVED' : 'REVISION_REQUIRED',
        metrics,
        traceId: ai.currentContext()?.traceId || 'internal-genkit-trace'
      };
    }
  }
);