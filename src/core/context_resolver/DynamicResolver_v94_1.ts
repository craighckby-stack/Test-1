interface IPathNormalizer {
    normalize(criteria: any): any;
}

// We assume CriteriaPathNormalizer (the implementation from the plugin) is available 
// and fulfills the IPathNormalizer interface.
declare class CriteriaPathNormalizer implements IPathNormalizer {
    normalize(criteria: any): any;
}

export class DynamicResolver_v94_1 {
    private engineMap: any;
    private normalizer: IPathNormalizer;

    constructor(mapConfig: any) {
        this.engineMap = mapConfig;
        // Instantiate the abstracted dependency
        this.normalizer = new CriteriaPathNormalizer(); 
        this.validateMapStructure(mapConfig);
    }

    private validateMapStructure(config: any): void {
        if (!config || typeof config !== 'object') {
            throw new Error("Invalid Logic Engine Map structure: Configuration must be an object.");
        }
        if (!Array.isArray(config.mapping_rules)) {
            throw new Error("Invalid Logic Engine Map structure: 'mapping_rules' must be an array.");
        }
        if (!config.default_behavior || typeof config.default_behavior !== 'object') {
             throw new Error("Invalid Logic Engine Map structure: 'default_behavior' must be an object defining the fallback target.");
        }
    }

    public resolveEngineTarget(context: ExecutionContext): ResolvedTarget {
        // Rule prioritization remains local orchestration logic
        const rules = [...this.engineMap.mapping_rules].sort((a, b) => b.priority - a.priority);

        for (const rule of rules) {
            if (this.contextMatches(context, rule.context_match_criteria)) {
                return {
                    target: rule.engine_target,
                    ruleId: rule.id,
                    failurePolicy: rule.failure_policy
                };
            }
        }

        // Fallback to default behavior
        const defaultBehavior = this.engineMap.default_behavior;
        return {
            target: defaultBehavior.engine_target || 'DEFAULT_TARGET',
            ruleId: 'DEFAULT',
            failurePolicy: defaultBehavior.failure_policy || 'ALLOW'
        };
    }

    private contextMatches(context: ExecutionContext, criteria: any): boolean {
        const CriteriaEvaluator = (globalThis as any).CriteriaEvaluatorUtility;

        if (!CriteriaEvaluator || typeof CriteriaEvaluator.execute !== 'function') {
            // Fallback or secure failure if utility is missing
            throw new Error("CriteriaEvaluatorUtility plugin is required but not loaded or improperly configured.");
        }
        
        // 1. Delegate normalization of legacy criteria paths
        const runtimeCriteria = this.normalizer.normalize(criteria);

        // 2. Delegate complex comparison logic to the utility
        try {
            return CriteriaEvaluator.execute({ context, criteria: runtimeCriteria });
        } catch (e) {
            console.error("Context matching failed during evaluation.", e);
            return false;
        }
    }
}

interface ExecutionContext {
    severity: string;
    origin_path: string;
    task_type: string;
    metrics: { load: number };
}

interface ResolvedTarget {
    target: string;
    ruleId: string;
    failurePolicy: string;
}