import { IndexingPolicy } from '../config/schemas/ArtifactIndexingPolicy.json';
import { FileWatcher } from '../core/FileSystemWatcher';
import { VectorDB } from '../data/VectorDatabase';

// Interface definition for the extracted tool (simulating kernel/DI access)
interface PathPolicyRuleMatcherTool {
    execute(args: { path: string, rules: IndexingPolicy['policies'] }): IndexingPolicy['policies'][number] | null;
}

declare const PathPolicyRuleMatcher: PathPolicyRuleMatcherTool;

/**
 * ArtifactIndexingService
 * Responsible for watching filesystem changes, prioritizing indexing jobs
 * based on the configured policy, managing the content chunking pipeline,
 * and interfacing with the Vector/Keyword database layer.
 */
export class ArtifactIndexingService {
    private policy: IndexingPolicy;
    private watcher: FileWatcher;
    private vectorDb: VectorDB;
    
    constructor(policyConfig: IndexingPolicy, vectorDb: VectorDB) {
        // CRITICAL: Policy must be sorted before use by the PathPolicyRuleMatcherTool
        this.policy = this.sortPolicy(policyConfig);
        this.vectorDb = vectorDb;
        this.watcher = new FileWatcher();
    }

    /**
     * Sorts policies by priority (descending) so the rule matcher finds specific rules first.
     */
    private sortPolicy(policy: IndexingPolicy): IndexingPolicy {
        // Sort policies by priority (descending) so specific rules are checked first
        policy.policies.sort((a, b) => b.priority - a.priority);
        return policy;
    }

    public startIndexing() {
        console.log(`[IndexingService] Starting watch on artifacts based on v${this.policy.version} policy.`);
        
        this.watcher.watch('.', (path: string, event: 'added' | 'changed' | 'deleted') => {
            this.handleArtifactChange(path, event);
        });
    }

    private async handleArtifactChange(path: string, event: 'added' | 'changed' | 'deleted') {
        
        // Use the dedicated tool to find the highest priority matching rule
        const applicableRule = PathPolicyRuleMatcher.execute({
            path: path,
            rules: this.policy.policies
        });
        
        if (!applicableRule) {
            console.log(`[Indexing] Path ${path} matches default policy: ${this.policy.defaultPolicy}`);
            // Implementation of default indexing logic
            return;
        }

        if (applicableRule.strategy === 'IGNORE') {
            console.log(`[Indexing] Ignoring artifact: ${path} via priority ${applicableRule.priority}`);
            return;
        }

        // Asynchronous worker invocation for processing and database insertion
        await this.processAndIndexArtifact({ path, rule: applicableRule, event });
    }

    private async processAndIndexArtifact(job: { path: string, rule: any, event: string }) {
        // Detailed implementation would include:
        // 1. Reading content
        // 2. Applying chunking logic (based on job.rule.chunking)
        // 3. Generating embeddings (based on job.rule.embeddingModel)
        // 4. Storing in VectorDB (handling TTL, metadata, etc.)
        console.log(`[Indexing] Processing ${job.path} using strategy ${job.rule.strategy}.`);
    }
}