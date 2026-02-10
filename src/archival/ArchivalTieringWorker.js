/**
 * ArchivalTieringWorker
 * Enforces policy defined in config/epru_archival_spec.json
 * Responsible for moving data across storage tiers (hot -> warm -> cold -> purge).
 */

import { loadConfig } from '../system/ConfigLoader.js';
import { StorageAdapter } from '../storage/StorageAdapter.js';

// Conceptual Plugin Interface definition (for demonstration purposes)
interface PolicyTimeDerivatorInterface {
    execute(args: { method: 'calculateTTLCutoff', ttlSeconds: number, referenceTime?: number }): number;
}

export class ArchivalTieringWorker {
    private spec: any;
    private adapter: StorageAdapter;
    private interval: number;
    private timer: NodeJS.Timeout | undefined;

    constructor() {
        this.spec = loadConfig('epru_archival_spec');
        this.adapter = new StorageAdapter(); // Hypothetical storage interface
        this.interval = 3600000; // Run every hour
    }

    // CRITICAL: Helper method mock/stub to simulate plugin execution
    private _getPlugin(name: 'PolicyTimeDerivator'): PolicyTimeDerivatorInterface {
        // In a real AGI-KERNEL environment, this would retrieve the registered plugin instance.
        if (name === 'PolicyTimeDerivator') {
            return {
                execute: (args) => {
                    const ttlSeconds = args.ttlSeconds;
                    const referenceTime = args.referenceTime || Date.now();
                    
                    if (typeof ttlSeconds !== 'number' || ttlSeconds <= 0) {
                        return referenceTime; 
                    }
                    const ttlMilliseconds = ttlSeconds * 1000;
                    return referenceTime - ttlMilliseconds;
                }
            };
        }
        throw new Error(`Plugin ${name} not found`);
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
            const PolicyTimeDerivator = this._getPlugin('PolicyTimeDerivator');
            
            const cutoffTimestamp = PolicyTimeDerivator.execute({
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