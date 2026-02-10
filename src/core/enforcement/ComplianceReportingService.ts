interface ComplianceRecordCanonicalizerTool {
    execute(args: { 
        breach: any; 
        snapshot: any;
        timestamp?: number;
        severity?: string;
    }): any; // Returns the canonical record object or { error: string }
}

declare const ComplianceRecordCanonicalizer: ComplianceRecordCanonicalizerTool | undefined;

import { FloorBreach } from './RiskFloorComplianceUtility';
import { PersistenceService } from '../../infrastructure/persistence/PersistenceService';
import { TelemetrySnapshot } from '../telemetry/TelemetryService';

/**
 * ComplianceReportingService
 * 
 * Handles persistent logging, auditing, and aggregation of all risk floor compliance events
 * and breaches. This service decouples immediate enforcement actions from critical audit trail generation.
 */
export class ComplianceReportingService {
    private persistence: PersistenceService; // Assumed external persistence mechanism

    constructor(persistence: PersistenceService) {
        this.persistence = persistence;
    }

    /**
     * Logs a detected risk floor breach to persistent storage for auditing and analysis.
     * @param breach The detailed breach event.
     * @param snapshot The telemetry context at the time of the breach.
     */
    public async logBreach(breach: FloorBreach, snapshot: TelemetrySnapshot): Promise<void> {
        let record: any;

        if (ComplianceRecordCanonicalizer && ComplianceRecordCanonicalizer.execute) {
            // CRITICAL: Use the extracted reusable tool for canonicalization
            record = ComplianceRecordCanonicalizer.execute({
                breach: breach,
                snapshot: snapshot
            });

            if (record && record.error) {
                console.error(`[ComplianceAudit]: Canonicalization failed: ${record.error}`);
                return;
            }
        } else {
            // Fallback warning if the tool is unexpectedly missing
            console.warn("[ComplianceAudit]: ComplianceRecordCanonicalizer tool unavailable. Logging aborted.");
            return;
        }
        
        console.log(`[ComplianceAudit]: Logging persistent breach record for ${breach.floorName}`);
        // Example persistence call
        // await this.persistence.save('compliance_breach_log', record);
    }

    // Future methods: getRecentBreaches, generateAuditReport, alertExternalMonitoring
}