import { IndexingStrategy, ArtifactMetadata } from '../types/ArtifactTypes';
import { EmbeddingService } from './EmbeddingService';
import { VectorDBClient } from '../data/VectorDBClient';

// AGI_KERNEL Interface Stub for the extracted plugin
interface ArtifactContentAggregatorTool {
    execute(args: { artifact: ArtifactMetadata; targetFields: string[]; separator?: string }): string;
}

/**
 * Manages the transformation, insertion, and querying of artifact content
 * into the vector store based on the defined ArtifactIndexingPolicy.
 * This service is critical for enabling semantic search across the artifact history.
 */
export class ArtifactVectorizationManager {
  private artifactContentAggregator: ArtifactContentAggregatorTool;

  constructor(private embeddingService: EmbeddingService, private dbClient: VectorDBClient) {
    // Simulation of AGI-KERNEL plugin injection for Type Safety
    this.artifactContentAggregator = (global as any).ArtifactContentAggregator || { 
        execute: ({ artifact, targetFields }) => { 
            return targetFields
                .map(field => (artifact as any)[field] || '')
                .join('\n\n---\n\n');
        }
    } as ArtifactContentAggregatorTool;
  }

  public async indexArtifact(artifact: ArtifactMetadata, policy: IndexingStrategy): Promise<void> {
    if (!policy.vectorIndexing.enabled) {
      return;
    }

    const { embeddingModel, targetFields, vectorStoreAlias } = policy.vectorIndexing;
    
    // Using the extracted tool for content aggregation
    const contentToEmbed = this.artifactContentAggregator.execute({
        artifact: artifact,
        targetFields: targetFields,
        // Separator defaults to '\n\n---\n\n' within the plugin
    });

    if (!contentToEmbed) {
        console.warn(`Artifact ${artifact.id}: No meaningful content found for vector indexing.`);
        return;
    }

    const vector = await this.embeddingService.generateEmbedding(contentToEmbed, embeddingModel);

    await this.dbClient.insertVector({
      vector: vector,
      id: artifact.id,
      metadata: artifact.metadata, 
    }, vectorStoreAlias);

    console.log(`Artifact ${artifact.id} successfully vectorized using ${embeddingModel}.`);
  }

  public async semanticSearch(query: string, policy: IndexingStrategy, topK: number = 10): Promise<any[]> {
    if (!policy.vectorIndexing.enabled) {
      throw new Error("Vector indexing is disabled for this artifact type.");
    }

    const queryVector = await this.embeddingService.generateEmbedding(query, policy.vectorIndexing.embeddingModel);

    return this.dbClient.queryVectors(queryVector, policy.vectorIndexing.vectorStoreAlias, topK);
  }
}