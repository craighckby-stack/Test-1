import { FloorBreach } from './RiskFloorComplianceUtility';
import { PersistenceService } from '../../infrastructure/persistence/PersistenceService';
import { TelemetrySnapshot } from '../telemetry/TelemetryService';

// Assuming the plugin interface is imported for dependency injection
import { ComplianceRecordCanonicalizerPlugin } from '../plugins/ComplianceRecordCanonicalizerPlugin';

/**
 * ComplianceReportingService
 * 
 * Handles persistent logging, auditing, and aggregation of all risk floor compliance events
 * and breaches. This service decouples immediate enforcement actions from critical audit trail generation.
 */
export class ComplianceReportingService {
    private persistence: PersistenceService;
    private canonicalizer: ComplianceRecordCanonicalizerPlugin | null;

    /**
     * @param persistence Assumed external persistence mechanism
     * @param canonicalizer Optional plugin used to standardize breach records before persistence.
     */
    constructor(
        persistence: PersistenceService,
        canonicalizer: ComplianceRecordCanonicalizerPlugin | null = null
    ) {
        this.persistence = persistence;
        this.canonicalizer = canonicalizer;
    }

    /**
     * Logs a detected risk floor breach to persistent storage for auditing and analysis.
     * Ensures that an audit record is always created, falling back to raw data if canonicalization fails or is unavailable.
     * @param breach The detailed breach event.
     * @param snapshot The telemetry context at the time of the breach.
     */
    public async logBreach(breach: FloorBreach, snapshot: TelemetrySnapshot): Promise<void> {
        const rawRecord = {
            breach: breach,
            snapshot: snapshot,
            timestamp: Date.now() // Essential for robust auditing
        };
        
        let recordToPersist: any = rawRecord;

        if (this.canonicalizer) {
            let canonicalizedResult = this.canonicalizer.execute(rawRecord);

            if (canonicalizedResult && canonicalizedResult.error) {
                // Canonicalization failed. Log error, but fall back to persisting raw data.
                console.error(`[ComplianceAudit]: Canonicalization failed: ${canonicalizedResult.error}. Logging raw record instead.`);
            } else if (canonicalizedResult) {
                recordToPersist = canonicalizedResult;
            } else {
                 // Safety check if canonicalizer returns null/undefined
                 console.warn("[ComplianceAudit]: Canonicalizer returned empty result. Logging raw record.");
            }
        } else {
            // Plugin unavailable. Log warning, but proceed with raw data to ensure audit trail integrity.
            console.warn("[ComplianceAudit]: ComplianceRecordCanonicalizer plugin unavailable. Logging raw breach data.");
        }

        console.log(`[ComplianceAudit]: Logging persistent breach record for ${breach.floorName}`);
        await this.persistence.save('compliance_breach_log', recordToPersist);
    }

    // Future methods: getRecentBreaches, generateAuditReport, alertExternalMonitoring
}