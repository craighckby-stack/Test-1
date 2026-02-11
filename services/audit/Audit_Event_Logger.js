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
        this.canonicalizer = auditRecordCanonicalizerTool;

        if (!this.canonicalizer || typeof this.canonicalizer.createCanonicalRecord !== 'function') {
             throw new Error("AuditRecordCanonicalizer utility must be provided and implement createCanonicalRecord.");
        }

        // Placeholder for persistence layer (e.g., Immutable Store) required for the dispersal strategy.
        // NOTE: The store is defined here as per original implementation, but managed by the disperser.
        const localImmutableStore = { save: (id, data) => console.log(`[AEL] Stored Audit Hash ID: ${id}`) };

        // Abstracting the multi-target dispersal logic into a dedicated plugin.
        this.disperser = new MultiTargetAuditDisperser(dependency_ACM, dependency_SDR, localImmutableStore);
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
            
        // 2. Disperse the record to all mandated L5 destinations (Persistence, ACM, SDR)
        this.disperser.disperse(audit_hash_id, event_data, source_acronym);

        return audit_hash_id;
    }
}