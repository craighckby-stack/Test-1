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
  private definition: ConstraintResolutionEngineDefinition;
  private graphAnalyzer: DependencyGraphAnalyzer;

  constructor(definition: ConstraintResolutionEngineDefinition) {
    this.definition = definition;
    this.graphAnalyzer = new DependencyGraphAnalyzer();
  }

  /**
   * Analyzes the dependency graph for cycles, duplicates, and missing references.
   * Logic delegated to the DependencyGraphAnalyzer tool.
   * @returns An array of structured diagnostic messages.
   */
  public analyzeForCycles(): GraphDiagnostic[] {
    const diagnostics = this.graphAnalyzer.analyze({
      // The input structure (resolutionPhases) matches the expected format
      nodes: this.definition.resolutionPhases as AnalysisNode[], 
      idKey: 'phaseId',
      depsKey: 'dependencies',
    });
    
    return diagnostics;
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