/**
 * ConstraintDependencyGraphAnalyzer.ts
 * Pre-validates the dependency graph defined in the ConstraintResolutionEngineDefinition.
 */

import { ConstraintResolutionEngineDefinition } from "./types";

// START: Structured Diagnostic Types for robust error reporting
export type DiagnosticType = 'CYCLE' | 'DUPLICATE_ID' | 'MISSING_DEPENDENCY';

export interface GraphDiagnostic {
  severity: 'error' | 'warning';
  type: DiagnosticType;
  message: string;
}
// END: Structured Diagnostic Types

// Placeholder for the external analysis tool interface
interface AnalysisNode {
    [key: string]: any;
}
type AnalysisResult = GraphDiagnostic[];

/** 
 * IMPORTANT: This function represents the delegated call to the AGI_KERNEL plugin 
 * (DependencyGraphAnalyzer) which encapsulates the complex graph traversal logic.
 */
declare function runDependencyAnalysis(args: {
    nodes: AnalysisNode[];
    idKey: string;
    depsKey: string;
}): AnalysisResult;


export class ConstraintDependencyGraphAnalyzer {
  private definition: ConstraintResolutionEngineDefinition;

  constructor(definition: ConstraintResolutionEngineDefinition) {
    this.definition = definition;
  }

  /**
   * Analyzes the dependency graph for cycles, duplicates, and missing references.
   * Logic delegated to the DependencyGraphAnalyzer tool.
   * @returns An array of structured diagnostic messages.
   */
  public analyzeForCycles(): GraphDiagnostic[] {
    const diagnostics = runDependencyAnalysis({
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