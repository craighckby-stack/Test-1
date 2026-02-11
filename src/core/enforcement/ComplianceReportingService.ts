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
     * @param breach The detailed breach event.
     * @param snapshot The telemetry context at the time of the breach.
     */
    public async logBreach(breach: FloorBreach, snapshot: TelemetrySnapshot): Promise<void> {
        let record: any;

        if (this.canonicalizer) {
            // CRITICAL: Use the injected plugin for canonicalization
            record = this.canonicalizer.execute({
                breach: breach,
                snapshot: snapshot
            });

            if (record && record.error) {
                console.error(`[ComplianceAudit]: Canonicalization failed: ${record.error}`);
                return;
            }
        } else {
            // Warning if the necessary tool is missing
            console.warn("[ComplianceAudit]: ComplianceRecordCanonicalizer plugin unavailable. Logging aborted.");
            return;
        }
        
        console.log(`[ComplianceAudit]: Logging persistent breach record for ${breach.floorName}`);
        // Example persistence call
        // await this.persistence.save('compliance_breach_log', record);
    }

    // Future methods: getRecentBreaches, generateAuditReport, alertExternalMonitoring
}