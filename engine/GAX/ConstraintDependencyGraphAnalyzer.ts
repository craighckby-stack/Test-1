/**
 * ConstraintDependencyGraphAnalyzer.ts
 * Pre-validates the dependency graph defined in the ConstraintResolutionEngineDefinition.
 */

import { ConstraintResolutionEngineDefinition } from "./types";

export class ConstraintDependencyGraphAnalyzer {
  private definition: ConstraintResolutionEngineDefinition;

  constructor(definition: ConstraintResolutionEngineDefinition) {
    this.definition = definition;
  }

  /**
   * Analyzes the dependency graph for cycles and reports structural configuration issues.
   * @returns An array of diagnostic messages (cycles, duplicates, or missing dependencies).
   */
  public analyzeForCycles(): string[] {
    const phases = this.definition.resolutionPhases;
    const phaseIdSet: Set<string> = new Set(phases.map(p => p.phaseId));
    const adj: Map<string, string[]> = new Map();
    const diagnostics: string[] = [];

    // 1. Initial build and validation for existence and duplicates
    for (const phase of phases) {
      if (adj.has(phase.phaseId)) {
          diagnostics.push(`Configuration Error: Duplicate phase ID detected: ${phase.phaseId}`);
      }
      adj.set(phase.phaseId, phase.dependencies);
      
      // 1b. Validate dependencies point to existing phases
      for (const dependentId of phase.dependencies) {
        if (!phaseIdSet.has(dependentId)) {
            diagnostics.push(`Configuration Warning: Phase '${phase.phaseId}' depends on non-existent phase: '${dependentId}'`);
        }
      }
    }

    // 2. Cycle Detection using DFS
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();
    
    // DFS implementation using path tracing for detailed cycle reporting
    const dfs = (phaseId: string, currentPath: string[]) => {
      // Skip if phaseId wasn't properly defined
      if (!adj.has(phaseId)) return; 

      visited.add(phaseId);
      recursionStack.add(phaseId);
      const nextPath = [...currentPath, phaseId];

      for (const dependentId of adj.get(phaseId) || []) {
        // Ensure the dependentId is part of the graph before trying to traverse 
        if (!adj.has(dependentId)) continue; 

        if (!visited.has(dependentId)) {
          dfs(dependentId, nextPath);
        } else if (recursionStack.has(dependentId)) {
          // Cycle detected. dependentId is the point where the cycle closes.
          const cycleStartIndex = nextPath.indexOf(dependentId);
          // The path starts at the cycle closing point up to the current node (phaseId)
          const cyclePath = nextPath.slice(cycleStartIndex); 
          
          diagnostics.push(`Cycle detected: ${cyclePath.join(' -> ')} -> ${dependentId}`);
        }
      }
      recursionStack.delete(phaseId);
    };

    for (const phase of phases) {
      if (!visited.has(phase.phaseId)) {
        // Start DFS for this connected component
        dfs(phase.phaseId, []);
      }
    }

    return diagnostics;
  }

  public validateDefinition(): void {
    const diagnostics = this.analyzeForCycles();
    
    const errors = diagnostics.filter(d => d.includes("Cycle detected") || d.includes("Duplicate phase ID"));
    const warnings = diagnostics.filter(d => d.includes("Warning"));

    if (errors.length > 0) {
      throw new Error(`Configuration Error: Structural issues found in resolution phases: ${errors.join('; ')}`);
    }

    if (warnings.length > 0) {
        console.warn(`Configuration Warnings during validation: ${warnings.join('; ')}`);
    }

    console.log("Constraint definition graph validated successfully.");
  }
}