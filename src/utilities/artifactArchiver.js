const fs = require('fs').promises;
const path = require('path');

/**
 * Utility module for handling robust archiving and isolation of governance artifacts (A-01 payloads).
 * Ensures critical payloads are moved reliably from staging to long-term storage/quarantine.
 */
class ArtifactArchiver {
    /**
     * Moves an artifact from its execution path (assumed) to the designated quarantine path.
     * NOTE: Requires knowledge of where active payloads (e.g., A-01 staging) are stored.
     * @param {string} proposalId The unique identifier of the artifact/proposal.
     * @param {string} quarantinePath The target directory for failed payloads.
     * @param {string} [stagingPath='./artifacts/staging'] - Optional base path for active artifacts.
     */
    static async archiveArtifact(proposalId, quarantinePath, stagingPath = './artifacts/staging') {
        const sourceFileName = `${proposalId}.json`; // Assuming a standard artifact naming convention
        const sourcePath = path.resolve(stagingPath, sourceFileName);
        const destinationPath = path.resolve(quarantinePath, sourceFileName);

        // 1. Ensure quarantine directory exists
        await fs.mkdir(quarantinePath, { recursive: true });

        // 2. Perform the atomic move (rename/link) operation. fs.rename is generally atomic on POSIX systems.
        try {
            await fs.rename(sourcePath, destinationPath);
            // Logging should happen in the caller (IntegrityQuarantine), but we confirm move success here.
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Artifact might have already been moved or never existed.
                console.warn(`Archiver Warning: Artifact ${sourceFileName} not found at staging path.`);
                return;
            }
            throw new Error(`Failed to move artifact ${proposalId}: ${error.message}`);
        }
    }
}

module.exports = ArtifactArchiver;