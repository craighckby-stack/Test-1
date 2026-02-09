import React, { useState, useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  ShieldCheck, Cpu, RefreshCcw, Binary, Fingerprint, Box, HardDrive, Terminal, ShieldAlert, Activity
} from 'lucide-react';

/**
 * AGI-KERNAL v6.9.7 - "VIRTUAL_OS" [GOVERNANCE PATCH]
 * INTEGRATED: AuditDataNormalizer & GovernanceSchemaDefs
 */

// --- GOVERNANCE CORE (Grafts) ---

class AuditDataNormalizer {
    normalize(actorId, rawTelemetry) {
        // Governance logic: Normalize latency against a 5000ms ceiling for AI generation
        const latencyScore = 1 - (rawTelemetry.p95LatencyMs / 5000); 
        const stabilityFactor = rawTelemetry.success ? 1 : 0;

        return {
            efficiencyScore: Math.max(0, Math.min(1, latencyScore)),
            complianceScore: stabilityFactor,
            violationCount: rawTelemetry.success ? 0 : 1,
            timestamp: Date.now()
        };
    }
}

/**
 * Role: State Reversion & Damage Control
 * Listens for high-priority integrity alerts (e.g., from IntegrityQuarantine)
 * and orchestrates necessary steps to revert system state to the last known
 * stable commit (LSC) or neutral boundary state, essential when a failed artifact
 * has already caused partial state pollution (e.g., database writes, file system changes).
 */
class SystemRollbackCoordinator {
    /**
     * @param {object} dependencies
     * @param {object} dependencies.stateManager - Access to global system state definitions and reversion utilities.
     * @param {object} dependencies.systemLogger - General system operation logger.
     */
    constructor({ stateManager, systemLogger }) {
        this.stateManager = stateManager;
        this.systemLogger = systemLogger;
        // Ensure only one rollback is active per proposal, if processing is asynchronous
        this.activeRollbacks = new Set();
    }

    /**
     * Initiates a mandatory rollback sequence based on a critical integrity failure.
     * This should be called immediately after IntegrityQuarantine signals a breach.
     * @param {string} proposalId - The failed artifact ID.
     * @param {object} failureContext - Details surrounding the integrity breach and impacted resources.
     * @returns {Promise<boolean>} True if rollback was successfully initiated or completed.
     */
    async initiateRollback(proposalId, failureContext) {
        if (this.activeRollbacks.has(proposalId)) {
            this.systemLogger.warn(`Rollback already in progress for ${proposalId}. Skipping initiation.`);
            return true;
        }

        this.systemLogger.critical(`[ROLLBACK REQUIRED] Initiating state reversion due to integrity failure: ${proposalId}`);
        this.activeRollbacks.add(proposalId);

        try {
            // 1. Analyze the scope of changes introduced by the failed proposal
            // Assumes stateManager can determine required revert actions.
            const scope = await this.stateManager.analyzeImpact(proposalId, failureContext);
            
            // 2. Execute reversion sequence (e.g., revert DB transactions, restore configurations)
            const success = await this.stateManager.revertToLastStableState(scope);

            if (success) {
                this.systemLogger.info(`Rollback complete for ${proposalId}. System returned to a known stable state.`);
                return true;
            } else {
                this.systemLogger.error(`Partial or failed rollback for ${proposalId}. Escalation required.`);
                // Future step: Trigger immediate external alert/human intervention protocol
                return false;
            }

        } catch (error) {
            this.systemLogger.fatal(`Unrecoverable error during rollback coordination for ${proposalId}: ${error.message}`);
            return false;
        } finally {
            this.activeRollbacks.delete(proposalId);
        }
    }
}

const GPC_CONFIG = {
    protocol_evolution_control: {
        risk_tolerance: "MODERATE\