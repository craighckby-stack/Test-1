/**
 * @fileoverview GSEP Impact Analyzer Utility
 * Reads the stateful dependency matrix to calculate the blast radius and required
 * evolution priority for proposed module changes in real-time.
 */

import fs from 'fs';

const MATRIX_PATH = 'config/gsep_dependency_matrix.json';

/**
 * Calculates the weighted blast radius of a change to a source module.
 * @param {string} moduleId - The ID of the module being changed.
 * @returns {Array<object>} List of affected modules with calculated impact scores.
 */
export async function calculateBlastRadius(moduleId) {
  const matrixData = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const dependencies = matrixData.dependencies;
  const affectedModules = {};

  for (const dep of dependencies) {
    if (dep.source === moduleId) {
      // Impact calculation combines module criticality, dependency weight, and relationship type.
      const baseImpact = dep.weight * (dep.impact_severity === 'Critical' ? 1.5 : 1.0);
      affectedModules[dep.target] = (affectedModules[dep.target] || 0) + baseImpact;
    }
  }

  // Normalize and return detailed results
  return Object.keys(affectedModules).map(targetId => ({
    target: targetId,
    impact_score: parseFloat(affectedModules[targetId].toFixed(4)),
    reason: `Affected by ${moduleId} change.`
  }));
}

// Add functionality for validating evolution priority against stability metrics...
