/**
 * Governance Audit Service - src/governance/governanceAuditService.js
 * ID: GAS v1.0
 * Role: Immutable Logging and Traceability
 *
 * Provides an interface for recording all critical state transitions, decisions, 
 * and execution outcomes within the governance lifecycle.
 * This service is essential for debugging, compliance, and rollback analysis.
 */

interface AuditLogEntry {
    timestamp: number;
    componentId: string;
    transitionId: string;
    previousStatus: string;
    nextStatus: string;
    metadata: {
        actionType: string | 'N/A';
        reportSnapshot: any;
    };
}

// NOTE: In a production system, this would interface with an append-only, durable store (e.g., specialized database table or log stream).
const auditLogStore: AuditLogEntry[] = []; 

export class GovernanceAuditService {

    /**
     * Helper to simulate plugin execution of CanonicalAuditLogGenerator.
     * Delegates log entry construction to ensure canonical format.
     */
    private executeCanonicalGenerator(componentId: string, previousState: any, nextState: any): AuditLogEntry | null {
        // In a real system, this would call the plugin executor:
        // const result = PluginExecutor.execute('CanonicalAuditLogGenerator', { componentId, previousState, nextState });
        
        // Simulate CanonicalAuditLogGenerator logic:
        const timestamp = Date.now();
        
        const logEntry: AuditLogEntry = {
            timestamp: timestamp,
            componentId: componentId,
            transitionId: `${componentId}-${timestamp}`,
            previousStatus: previousState.status || 'UNKNOWN',
            nextStatus: nextState.status || 'UNKNOWN',
            metadata: { 
                actionType: nextState.actionType || 'N/A', 
                reportSnapshot: nextState.decisionReport || null
            }
        };

        return logEntry;
    }

    /**
     * Logs a state transition from a component registry.
     * Uses the canonical log generator tool to structure the entry.
     * @param {string} componentId
     * @param {Object} previousState
     * @param {Object} nextState
     */
    logTransition(componentId: string, previousState: any, nextState: any): void {
        
        const logEntry = this.executeCanonicalGenerator(componentId, previousState, nextState);
        
        if (!logEntry) {
            // Handle canonical generation failure
            return;
        }

        // In-memory simulation of persistent append log
        auditLogStore.push(logEntry);
        
        // NOTE: Production implementation would use a robust logger/database write here.
        // console.log(`[AUDIT] Transition logged for ${componentId}: ${logEntry.previousStatus} -> ${logEntry.nextStatus}`);
    }

    /**
     * Retrieves the history of a specific component.
     */
    getHistory(componentId: string): AuditLogEntry[] {
        return auditLogStore.filter(entry => entry.componentId === componentId)
                            .sort((a, b) => a.timestamp - b.timestamp);
    }
}

export const governanceAuditService = new GovernanceAuditService();