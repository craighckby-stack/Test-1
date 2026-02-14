/**
 * ConstraintDependencyGraphAnalyzer.ts
 * Pre-validates the dependency graph defined in the ConstraintResolutionEngineDefinition.
 */

import { ConstraintResolutionEngineDefinition } from "./types";
import {
  DependencyGraphAnalyzer,
  GraphDiagnostic,
  AnalysisNode
} from 'AGI_KERNEL/DependencyGraphAnalyzer';

/**
 * ConstraintDependencyGraphAnalyzer
 * Delegates complex graph analysis (cycles, duplicates, missing dependencies)
 * to the reusable AGI_KERNEL:DependencyGraphAnalyzer plugin.
 */
export class ConstraintDependencyGraphAnalyzer {
  #definition: ConstraintResolutionEngineDefinition;
  #graphAnalyzer: DependencyGraphAnalyzer;

  constructor(definition: ConstraintResolutionEngineDefinition) {
    this.#definition = definition;
    this.#setupDependencies();
  }

  /**
   * Encapsulates dependency resolution and initialization.
   * Satisfies Synchronous Setup Extraction goal.
   */
  #setupDependencies(): void {
    // Dependency: AGI_KERNEL/DependencyGraphAnalyzer
    this.#graphAnalyzer = new DependencyGraphAnalyzer();
  }

  /**
   * Isolates the direct interaction with the external DependencyGraphAnalyzer tool.
   * Satisfies I/O Proxy Creation goal.
   */
  #delegateToGraphAnalyzer(config: { nodes: AnalysisNode[], idKey: string, depsKey: string }): GraphDiagnostic[] {
    return this.#graphAnalyzer.analyze(config);
  }

  /**
   * Analyzes the dependency graph for cycles, duplicates, and missing references.
   * @returns An array of structured diagnostic messages.
   */
  public analyzeForCycles(): GraphDiagnostic[] {
    // Synchronous data preparation: creating the configuration structure
    const analysisConfig = {
      // The input structure (resolutionPhases) matches the expected format
      nodes: this.#definition.resolutionPhases as AnalysisNode[],
      idKey: 'phaseId',
      depsKey: 'dependencies',
    };

    // Delegate I/O to the proxy function
    return this.#delegateToGraphAnalyzer(analysisConfig);
  }

  public validateDefinition(): void {
    const diagnostics = this.analyzeForCycles();

    // Error/Warning processing remains local validation logic.
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');

    if (errors.length > 0) {
      const errorMessages = errors.map(e => e.message).join('; ');
      throw new Error(`Configuration Error: Structural issues found in resolution phases: ${errorMessages}`);
    }

    if (warnings.length > 0) {
        const warningMessages = warnings.map(w => w.message).join('; ');
        console.warn(`Configuration Warnings during validation: ${warningMessages}`);
    }

    console.log("Constraint definition graph validated successfully.");
  }
}
