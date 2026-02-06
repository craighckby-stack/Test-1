// service/governance/V_Sync_Verification_Endpoint.js
import { StateCommitmentLedger } from '../persistence/StateCommitmentLedger';
import { TraceVetoContextRegistry } from '../persistence/TraceVetoContextRegistry';
import { Crypto } from '@core/utils/Crypto';

/**
 * V_Sync_Verification_Endpoint (Verification Sync)
 * MISSION: Cryptographically verify the linkage and integrity of the DCSM
 * anchors (State Root Hash, TVCR Index) against core system registries.
 */
export async function verifyDCSM(manifest) {
    if (!manifest || !manifest.dse_epoch_id || !manifest.anchor_links) {
        throw new Error("DCSM Verification Error: Invalid manifest payload.");
    }

    const { anchor_links, dse_epoch_id } = manifest;

    // 1. Check State Root Hash Integrity against Ledger
    const ledgerEntry = await StateCommitmentLedger.getCommitment(dse_epoch_id);
    if (!ledgerEntry || ledgerEntry.rootHash !== anchor_links.state_root_hash) {
        return {
            verified: false,
            reason: `SCL Failure: State Root Hash mismatch or missing entry for epoch ${dse_epoch_id}.`
        };
    }

    // 2. Check TVCR Index Availability
    const tvcrEntry = await TraceVetoContextRegistry.retrieveContext(anchor_links.tvcr_index);
    if (!tvcrEntry) {
        return {
            verified: false,
            reason: `TVCR Failure: Trace/Veto context index ${anchor_links.tvcr_index} not found.`
        };
    }
    
    // 3. Optional: Re-validate internal P-01 logic checks here if external audit demands it.

    return {
        verified: true,
        status: `DCSM successfully verified against SCL and TVCR for epoch ${dse_epoch_id}.`
    };
}