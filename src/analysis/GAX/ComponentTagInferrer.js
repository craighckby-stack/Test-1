/**
 * ComponentTagInferrer
 * v94.1 Sovereign AGI Component for Autonomous Configuration Refinement.
 * MISSION: Analyze component metrics (static/runtime) and suggest optimal Tags
 *          to minimize reliance on manual ComponentProfileMap updates.
 */

class ComponentTagInferrer {
  /**
   * @param {Object} staticAnalyzer
   * @param {Object} telemetryEngine
   * @param {RuleBasedTaggingEngine} tagInferenceEngine - Injected reusable tool
   */
  constructor(staticAnalyzer, telemetryEngine, tagInferenceEngine) {
    this.staticAnalyzer = staticAnalyzer;
    this.telemetryEngine = telemetryEngine;
    this.tagInferenceEngine = tagInferenceEngine;
    this.tagRules = this.loadInferenceRules(); // Load structured rules for the engine
  }

  loadInferenceRules() {
    // Rules are defined structurally to be executed by the RuleBasedTaggingEngine plugin.
    // Structure: { source: 'static'|'runtime', field: string, operator: string, value: any, tag: string }
    return [
      // 1. Static Analysis Inference (e.g., high dependency count suggests criticality)
      {
        source: 'static',
        field: 'dependency_count',
        operator: '>',
        value: 50,
        tag: 'INFRASTRUCTURE_CRITICAL'
      },
      // 2. Runtime/Telemetry Inference (e.g., constant high queue depth suggests high throughput)
      {
        source: 'runtime',
        field: 'queue_depth_avg',
        operator: '>',
        value: 100,
        tag: 'HIGH_THROUGHPUT'
      }
    ];
  }

  infer(componentDescriptor) {
    const analysis = this.staticAnalyzer.analyze(componentDescriptor.path);
    const runtimeData = this.telemetryEngine.getRecentData(componentDescriptor.id);

    // Use the external engine to apply all rules simultaneously
    const suggestedTags = this.tagInferenceEngine.execute({
      rules: this.tagRules,
      staticData: analysis,
      runtimeData: runtimeData
    });
    
    return suggestedTags;
  }
}

module.exports = ComponentTagInferrer;