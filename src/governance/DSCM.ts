/**
 * DSCM (Decisional State Checkpoint Manager)
 * Role: Manages atomic, verifiable state capture prior to P-01 Calculus execution.
 * Activated: Boundary between GSEP Stage 3 and Stage 4 (Verification Boundary).
 */

import { MICM_Input } from './MICM';
import { AIA_Ledger } from '../aia/D01'; // Assuming AIA_Ledger provides deterministic serialization and hashing

/**
 * Interface representing the key calculation context locked down at time of decision boundary.
 */
interface CalculationContext { 
    s01_model_id: string;      // Attested Trust Model version
    s02_rfci: string;          // Risk Floor Configuration Integrity hash
    telemetry_attestation: string; // TIAR input attestation hash
}

/**
 * The definitive, immutable record of the state immediately preceding the P-01 decision.
 */
interface DSCM_StateSnapshot {
    checksum_micm: string;         // Integrity check against locked MICM inputs (Hash of MICM_Input)
    calculation_context: CalculationContext;
    timestamp_utc: number;
    snapshot_hash: string;         // Immutable cryptographic hash of the entire checkpoint data structure
}

export class DecisionalStateCheckpointManager {

    private checkpointHistory: DSCM_StateSnapshot[] = [];
    
    // Note: This class utilizes the globally attested AIA_Ledger for all cryptographic integrity checks.

    /**
     * Takes an immutable, time-stamped checkpoint of the entire P-01 calculation context.
     * This ensures F-01 (Failure Trace) can accurately trace the exact state leading to the decision.
     * @param input Data locked by MICM.
     * @param telemetryHash Telemetry/Sensor input attestation hash (from TIAR).
     * @returns The generated DSCM state snapshot object.
     */
    public createCheckpoint(input: MICM_Input, telemetryHash: string): DSCM_StateSnapshot {
        
        // 1. Lock down input data integrity
        // The MICM checksum locks the raw data inputs themselves.
        const checksum_micm = AIA_Ledger.hash(input);

        // 2. Define Context
        const calculation_context: CalculationContext = {
            s01_model_id: input.atm_version,
            s02_rfci: input.rfci_hash,
            telemetry_attestation: telemetryHash
        };

        const timestamp_utc = Date.now();
        
        // 3. Create provisional snapshot structure (everything needed for hashing)
        const provisionalSnapshot: Omit<DSCM_StateSnapshot, 'snapshot_hash'> = {
            checksum_micm,
            calculation_context,
            timestamp_utc
        };

        // 4. Generate final definitive hash based on the entire structure 
        // DSCM checkpoint must be verifiable by hashing all content deterministically.
        const snapshot_hash = AIA_Ledger.hash(provisionalSnapshot);
        
        const snapshot: DSCM_StateSnapshot = {
            ...provisionalSnapshot,
            snapshot_hash
        };

        this.checkpointHistory.push(snapshot);
        return snapshot;
    }

    /**
     * Retrieves a specific checkpoint using its verified cryptographic hash.
     * @param hash The snapshot_hash identifier.
     */
    public retrieveSnapshot(hash: string): DSCM_StateSnapshot | undefined {
        return this.checkpointHistory.find(s => s.snapshot_hash === hash);
    }
    
    /**
     * Clears local history based on a minimum required timestamp.
     * Snapshots committed to D-01 or successfully resolved by F-01 should be pruned locally.
     * @param cutoff UTC timestamp (milliseconds)
     */
    public purgeStaleSnapshots(cutoff: number): void {
        this.checkpointHistory = this.checkpointHistory.filter(s => s.timestamp_utc > cutoff);
    }
}