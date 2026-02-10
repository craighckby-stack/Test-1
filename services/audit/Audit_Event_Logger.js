/**
 * Component: Audit Event Logger (AEL)
 * Interface: audit.event.immutable
 * Governance: L5 (Auditability)
 *
 * Description: Implements a write-once, timestamped logging service responsible for capturing all high-priority architectural events. 
 * This includes (but is not limited to): compliance violations from CIL, conflict resolutions from MCRA, trust score variances from ATM, and final AIA-ENTRY commitments. 
 * Ensures non-repudiation of critical decisions necessary for GSEP L5 adherence. Data is immediately piped to SDR and ACM for telemetry aggregation and provenance anchoring.
 */
class AuditEventLogger {
    /**
     * @param {object} dependency_ACM - Provenance anchoring service dependency.
     * @param {object} dependency_SDR - Telemetry aggregation service dependency.
     * @param {object} auditRecordCanonicalizerTool - Utility for creating canonical, hashable audit records.
     */
    constructor(dependency_ACM, dependency_SDR, auditRecordCanonicalizerTool) {
        this.ACM = dependency_ACM;
        this.SDR = dependency_SDR;
        this.canonicalizer = auditRecordCanonicalizerTool;

        if (!this.canonicalizer || typeof this.canonicalizer.createCanonicalRecord !== 'function') {
             throw new Error("AuditRecordCanonicalizer utility must be provided and implement createCanonicalRecord.");
        }

        // Placeholder for real persistence layer (e.g., Immutable Store)
        this.localImmutableStore = { save: (id, data) => console.log(`[AEL] Stored Audit Hash ID: ${id}`) };
    }

    /**
     * Logs a critical system event with immutable metadata.
     * @param {string} source_acronym - The component acronym generating the event (e.g., CIL, MCRA).
     * @param {string} event_type - Classification (e.g., 'Veto', 'ConflictResolved', 'TrustScoreVariance').
     * @param {object} payload - The full state or decision payload.
     * @returns {string} Audit Hash ID.
     */
    logCriticalEvent(source_acronym, event_type, payload) {
        
        // 1. Generate canonical record and Audit Hash ID using the utility
        // This step handles timestamping, structure definition, serialization, and cryptographic hashing.
        const { record: event_data, auditHashId: audit_hash_id } = 
            this.canonicalizer.createCanonicalRecord(source_acronym, event_type, payload);
            
        // 2. Persist locally (immutable store)
        this.localImmutableStore.save(audit_hash_id, event_data);

        // 3. Transmit hash and context to ACM for provenance anchoring (PCA-104 input)
        this.ACM.anchorProvenance(audit_hash_id, event_data.timestamp, source_acronym);

        // 4. Transmit raw event data to SDR for metric calculation (PCA-101/102 input)
        this.SDR.ingestTelemetry(event_data);

        return audit_hash_id;
    }
}