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

export class ConstraintDependencyGraphAnalyzer {
  private definition: ConstraintResolutionEngineDefinition;

  constructor(definition: ConstraintResolutionEngineDefinition) {
    this.definition = definition;
  }

  /**
   * Analyzes the dependency graph for cycles and reports structural configuration issues.
   * @returns An array of structured diagnostic messages (cycles, duplicates, or missing dependencies).
   */
  public analyzeForCycles(): GraphDiagnostic[] {
    const phases = this.definition.resolutionPhases;
    const phaseIdSet: Set<string> = new Set();
    const adj: Map<string, string[]> = new Map();
    const diagnostics: GraphDiagnostic[] = [];

    // 1. Initial build and validation for duplicates
    for (const phase of phases) {
      const phaseId = phase.phaseId;

      if (phaseIdSet.has(phaseId)) {
        diagnostics.push({
          severity: 'error',
          type: 'DUPLICATE_ID',
          message: `Configuration Error: Duplicate phase ID detected: ${phaseId}`,
        });
        continue; 
      }
      
      phaseIdSet.add(phaseId);
      adj.set(phaseId, phase.dependencies);
    }
    
    // 1b. Validate dependencies point to existing phases (Needs full phaseIdSet)
    for (const phase of phases) {
        for (const dependentId of phase.dependencies) {
            if (!phaseIdSet.has(dependentId)) {
                diagnostics.push({
                    severity: 'warning',
                    type: 'MISSING_DEPENDENCY',
                    message: `Configuration Warning: Phase '${phase.phaseId}' depends on non-existent phase: '${dependentId}'`,
                });
            }
        }
    }

    // 2. Cycle Detection using DFS
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();
    
    // DFS implementation using path tracing for detailed cycle reporting
    const dfs = (phaseId: string, currentPath: string[]) => {
      // Skip if phaseId wasn't properly defined (e.g., if it was a duplicate)
      if (!adj.has(phaseId)) return; 

      visited.add(phaseId);
      recursionStack.add(phaseId);
      const nextPath = [...currentPath, phaseId];

      for (const dependentId of adj.get(phaseId) || []) {
        // Only attempt traversal if the dependent ID actually exists in our defined graph nodes.
        if (!phaseIdSet.has(dependentId)) continue; 

        if (!visited.has(dependentId)) {
          dfs(dependentId, nextPath);
        } else if (recursionStack.has(dependentId)) {
          // Cycle detected. dependentId is the point where the cycle closes.
          const cycleStartIndex = nextPath.indexOf(dependentId);
          const cyclePath = nextPath.slice(cycleStartIndex); 
          
          diagnostics.push({
            severity: 'error',
            type: 'CYCLE',
            message: `Cycle detected: ${cyclePath.join(' -> ')} -> ${dependentId}`,
          });
        }
      }
      recursionStack.delete(phaseId);
    };

    // Only iterate over the phases that were successfully added to the map (i.e., not duplicates)
    for (const phaseId of phaseIdSet) {
      if (!visited.has(phaseId)) {
        dfs(phaseId, []);
      }
    }

    return diagnostics;
  }

  public validateDefinition(): void {
    const diagnostics = this.analyzeForCycles();
    
    // Use structured data for filtering instead of brittle string checks
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