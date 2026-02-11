/**
 * Dialect Analysis Normalization Service (DANS)
 * Abstracts lookup, conflict resolution, and caching of dialect/tone mappings.
 * Utilizes CascadedMappingResolverTool for efficient multi-stage text analysis.
 */

const mapConfig = require('../config/dial_analysis_map.json');
const CascadedMappingResolverTool = require('@kernel/plugins/CascadedMappingResolverTool');

class DialectNormalizationService {
  constructor() {
    // Initialize the stateful resolver instance using the configuration map.
    this.resolver = CascadedMappingResolverTool.initialize(mapConfig);

    console.log(`DANS initialized using CascadedMappingResolverTool with version ${mapConfig.version}`);
  }

  analyze(text) {
    // Delegate the entire complex analysis pipeline to the extracted tool.
    return this.resolver.execute(text);
  }
}

module.exports = new DialectNormalizationService();