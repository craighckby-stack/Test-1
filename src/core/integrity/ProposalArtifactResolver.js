/**
 * @fileoverview ProposalArtifactResolver
 * This utility provides abstraction for fetching and resolving code artifacts
 * (file content, metadata, historical versions) needed during the Conceptual
 * Integrity check process.
 * It abstracts away filesystem details or mutation staging access for the Policy Evaluator.
 */

import { FileSystemAdapter } from '../../services/FileSystemAdapter.js'; // Assumed dependency
import { ProposalChangeResolverTool } from './ProposalChangeResolverTool.js'; // New dependency
import { ProposalContentResolver } from './ProposalContentResolver.js'; // New dependency (the abstracted plugin)

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

// Dependencies required by the core content resolution logic
const RESOLUTION_DEPENDENCIES = {
    FileSystemAdapter,
    ProposalChangeResolverTool
};

export const ProposalArtifactResolver = {

    /**
     * Fetches the current content of a file based on the proposal context.
     * Delegates content resolution to the abstracted plugin.
     * @param {string} path
     * @param {ProposalContext} proposal The overall proposal context.
     * @returns {string|null}
     */
    getCurrentContent(path: string, proposal: ProposalContext): string | null {
        return ProposalContentResolver.resolveContent(path, proposal, RESOLUTION_DEPENDENCIES);
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