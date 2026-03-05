import { genkit, z } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { dotprompt } from '@genkit-ai/dotprompt';

/**
 * @file GACR/AdaptiveSamplingEngine.ts
 * @version 5.1.0_MUTATED
 * @dna GOOGLE-GENKIT-V1-ULTIMATE
 * @description Siphoned Adaptive Sampling Engine. Refactored into Genkit Functional Flows.
 * Architecture enforces Zod-validated state transitions and Dotprompt-backed evaluation.
 */

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

const styleResolverAction = ai.defineAction(
  { name: 'styleResolver', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    const { styleId, type, local, parent, styles, defaults } = input;
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
    return { ...parent, ...baseDefaults, ...inherited, ...local };
  }
);

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
    const relationshipMap = new Map(context.relationships?.map(r => [r.rId, r]) || []);
    const counters = new Map<string, number>();

    const getNextNumberingState = (scope: string, numPr?: any): string => {
      const numId = numPr?.aim_numId || "101";
      const ilvl = numPr?.aim_ilvl || 0;
      const instance = context.abstract_state_machine.aim_num?.find((n: any) => n.aim_numId === numId);
      const abstractId = instance?.aim_abstractNumId || "0";
      const abstract = context.abstract_state_machine.aim_abstractNum?.find((a: any) => a.aim_abstractNumId === abstractId);
      const levelDef = abstract?.aim_lvl?.find((l: any) => l.aim_ilvl === ilvl) || abstract?.aim_lvl[0];
      const key = `${scope}::${abstractId}::${ilvl}`;
      
      let count = counters.get(key) ?? (instance?.aim_lvlOverride?.aim_ilvl === ilvl 
        ? parseInt(instance.aim_lvlOverride.aim_startOverride?.val) 
        : parseInt(levelDef.aim_start || "1"));
      
      if (counters.has(key)) count++;
      counters.set(key, count);
      return (levelDef.aim_lvlText?.val || `%${ilvl + 1}`).replace(`%${ilvl + 1}`, count.toString());
    };

    const results: string[] = [];

    for (const block of (canvas.aim_body || [])) {
      if (!block.aim_p) continue;
      const p = block.aim_p;
      const rel = relationshipMap.get(p['r:id']) || { target: "NULL", type: "VOID" };

      const resolvedPPr = await ai.run('resolve-paragraph-styles', () => 
        styleResolverAction({
          styleId: p.aim_pPr?.aim_pStyle || "Normal",
          type: "paragraph",
          local: p.aim_pPr,
          styles: context.agent_styles,
          defaults: context.docDefaults
        })
      );

      for (const run of (p.aim_r || [])) {
        const rPr = await ai.run('resolve-run-styles', () => 
          styleResolverAction({
            styleId: null,
            type: "run",
            local: run.aim_rPr,
            parent: resolvedPPr,
            styles: context.agent_styles,
            defaults: context.docDefaults
          })
        );

        const threshold = context.settings.aim_vars?.psr_threshold_degradation || 0.95;
        if ((rPr.n3_metrics?.min_phi ?? 1.0) >= threshold) {
          const mceConfig = context.settings.aim_vars?.markup_compatibility;
          const filtered = (mceConfig?.ignorable ? run.aim_t?.replace(/[^\x20-\x7E\s]/g, "").trim() : run.aim_t) || "";
          const sequence = getNextNumberingState(rel.target, resolvedPPr.aim_numPr);
          results.push(`[${rel.type}:${rel.target}] SEQ:${sequence} DATA:${filtered}`);
        }
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
);