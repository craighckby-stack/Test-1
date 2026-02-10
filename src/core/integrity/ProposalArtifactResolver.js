/**
 * @fileoverview ProposalArtifactResolver
 * This utility provides abstraction for fetching and resolving code artifacts
 * (file content, metadata, historical versions) needed during the Conceptual
 * Integrity check process.
 * It abstracts away filesystem details or mutation staging access for the Policy Evaluator.
 */

import { FileSystemAdapter } from '../../services/FileSystemAdapter.js'; // Assumed dependency
import { ProposalChangeResolverTool } from './ProposalChangeResolverTool.js'; // New dependency

interface ProposalFileChange {
    path: string;
    contentAfter: string | null;
}

interface ProposalContext {
    affectedFiles?: ProposalFileChange[];
    [key: string]: any;
}

interface ResolutionContext {
    filePath?: string;
    proposalDetails?: ProposalContext;
    [key: string]: any;
}

export const ProposalArtifactResolver = {

    /**
     * Fetches the current content of a file based on the proposal context.
     * If the file is part of the proposal, returns the modified/new content (if applicable).
     * @param {string} path
     * @param {ProposalContext} proposal The overall proposal context.
     * @returns {string|null}
     */
    getCurrentContent(path: string, proposal: ProposalContext): string | null {
        // 1. Check if the file is part of the active proposal/mutation stage using the dedicated tool.
        const stagedContent = ProposalChangeResolverTool.resolveStagedContent(path, proposal.affectedFiles);

        if (stagedContent !== null) {
            return stagedContent;
        }
        
        // 2. If unaffected by the proposal, fetch from the current stable filesystem/repository view.
        try {
            // @ts-ignore: Assuming FileSystemAdapter returns string or throws
            return FileSystemAdapter.readFile(path);
        } catch (e) {
            console.warn(`[ArtifactResolver] Could not read file content for path: ${path}`);
            return null;
        }
    },

    /**
     * Fetches content required for a policy evaluation against a specific context.
     * @param {ResolutionContext} context The context object provided by CIE (contains proposal details, filePath, scope).
     * @returns {{ content: string | null, exists: boolean }}
     */
    resolveArtifactContext(context: ResolutionContext): { content: string | null, exists: boolean } {
        const path = context.filePath;

        if (!path) {
             return { content: null, exists: false };
        }
        
        // Default proposal details if missing
        const proposalDetails: ProposalContext = context.proposalDetails || {};
        
        const content = ProposalArtifactResolver.getCurrentContent(path, proposalDetails);

        return {
            content: content,
            exists: content !== null
        };
    }
    
    // Future extensions: getContentBeforeMutation(path, proposalId), getRelatedFiles(path)
};