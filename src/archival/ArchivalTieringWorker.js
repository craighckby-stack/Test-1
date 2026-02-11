/**
 * ArchivalTieringWorker
 * Enforces policy defined in config/epru_archival_spec.json
 * Responsible for moving data across storage tiers (hot -> warm -> cold -> purge).
 */

import { loadConfig } from '../system/ConfigLoader.js';
import { StorageAdapter } from '../storage/StorageAdapter.js';
import { PolicyTimeDerivator } from '../policies/PolicyTimeDerivator.js'; 

export class ArchivalTieringWorker {
    private spec: any;
    private adapter: StorageAdapter;
    private interval: number;
    private timer: NodeJS.Timeout | undefined;
    private policyDerivator: PolicyTimeDerivator; 

    constructor() {
        this.spec = loadConfig('epru_archival_spec');
        this.adapter = new StorageAdapter(); // Hypothetical storage interface
        this.interval = 3600000; // Run every hour
        this.policyDerivator = new PolicyTimeDerivator(); // Instantiate the reusable plugin
    }

    async execute() {
        console.log("Starting Archival Tiering Sweep...");
        for (const dataClass of this.spec.data_classes) {
            await this.processDataClass(dataClass);
        }
        console.log("Archival Tiering Sweep Complete.");
    }

    async processDataClass(dataClass: { class_name: string, policy: { retention_policy: string, ttl_seconds: number | null, tier: string } }) {
        const { class_name, policy } = dataClass;
        const { retention_policy, ttl_seconds, tier } = policy;

        if (retention_policy === 'time_to_live' && ttl_seconds !== null) {
            
            // Utilize the extracted PolicyTimeDerivator utility for robust time calculation
            const cutoffTimestamp = this.policyDerivator.execute({
                method: 'calculateTTLCutoff',
                ttlSeconds: ttl_seconds 
            });
            
            // 1. Identify records older than TTL in the current tier
            const recordsToMove = await this.adapter.findExpiredRecords(class_name, tier, cutoffTimestamp);

            // 2. Determine next action (Move to colder tier or Purge)
            const nextTier = this.determineNextTier(tier);

            for (const record of recordsToMove) {
                if (nextTier) {
                    await this.adapter.migrate(record, nextTier);
                    console.log(`Migrated ${record.id} (${class_name}) to ${nextTier}`);
                } else {
                    await this.adapter.purge(record);
                    console.log(`Purged ${record.id} (${class_name})`);
                }
            }
        }
    }

    determineNextTier(currentTier: string): string | null {
        const tierOrder: Record<string, string | null> = { hot_storage: 'warm_storage', warm_storage: 'cold_storage', cold_storage: null };
        return tierOrder[currentTier] || null;
    }

    start() {
        this.timer = setInterval(() => this.execute(), this.interval);
        this.execute(); // Run immediately on startup
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}