/**
 * SCR_IntegrityValidator v94.1 (Refactored)
 * Autonomous system component for enforcing structural integrity policies.
 *
 * Reads SCR_IntegrityManifest.json, computes real-time file hashes
 * concurrently, and delegates enforcement to the Failure Mode Executor.
 */

import { promises as fs } from 'fs'; 
import path from 'path';

// Assume AGI_PLUGINS access for integration
declare const AGI_PLUGINS: {
    FileIntegrityHasher: {
        calculateHash: (args: { filePath: string, algorithm: string }) => Promise<string>;
    }
};

// Integration point for handling breach policy execution
const FailureModeExecutor = require('./SCR_FailureModeExecutor'); 

const MANIFEST_PATH = path.join(__dirname, 'SCR_IntegrityManifest.json');
const HASH_ALGORITHM = 'sha512';

// --- Manifest Data Structures ---

interface ManifestFileEntry {
    path: string;
    hash_sha512: string; // The expected hash
    failure_mode: string; // Policy identifier for the executor
}

interface IntegrityGroup {
    priority: number;
    files: ManifestFileEntry[];
}

interface IntegrityManifest {
    manifest_id: string;
    integrity_groups: {
        [groupName: string]: IntegrityGroup;
    };
}

// --- Core Functions ---

/**
 * Loads and parses the Integrity Manifest.
 * @returns {Promise<IntegrityManifest>} The manifest data.
 */
async function loadManifest(): Promise<IntegrityManifest> {
    try {
        const data = await fs.readFile(MANIFEST_PATH, 'utf8');
        return JSON.parse(data) as IntegrityManifest;
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new Error('CRITICAL: Integrity Manifest not found.');
        }
        // Handle parsing errors or read errors gracefully
        throw new Error(`CRITICAL: Failed to load or parse manifest: ${(e as Error).message}`);
    }
}

interface Breach {
    path: string;
    failure_mode: string;
    expectedHash: string;
    actualHash: string;
    details: any;
}

/**
 * Processes integrity breaches identified during validation and executes policies.
 * @param {Breach[]} breaches - List of detected integrity compromises.
 */
async function handleBreaches(breaches: Breach[]): Promise<boolean> {
    if (breaches.length === 0) {
        console.log('VALIDATION SUCCESS: System integrity confirmed.');
        return true;
    }

    console.error(`VALIDATION FAILED: ${breaches.length} critical files compromised.`);

    for (const breach of breaches) {
        console.warn(`[BREACH] File: ${breach.path}. Mode: ${breach.failure_mode}`);
        console.warn(` -> Expected: ${breach.expectedHash.substring(0, 16)}...`);
        console.warn(` -> Actual:   ${breach.actualHash.substring(0, 16)}...`);
        
        // Delegate enforcement logic to the Executor
        await FailureModeExecutor.execute(breach.failure_mode, breach.path, breach.details);
    }
    
    // Validation status is false if any breaches occurred.
    return false;
}

/**
 * Executes concurrent integrity validation against the manifest.
 * @returns {Promise<boolean>} True if validation succeeded, false otherwise.
 */
async function validateIntegrity(): Promise<boolean> {
    let manifest: IntegrityManifest;
    try {
        manifest = await loadManifest();
    } catch (e) {
        console.error((e as Error).message);
        return false;
    }

    console.log(`[Integrity Check] Starting validation using Manifest ID: ${manifest.manifest_id}`);

    type HashResult = { fileKey: string; status: 'success' | 'error'; hash?: string; message?: string; };
    
    // Combines manifest entry with dynamic run data
    type FileMetadata = ManifestFileEntry & { groupName: string, priority: number };

    const hashPromises: Promise<HashResult>[] = [];
    const filesMap = new Map<string, FileMetadata>(); 

    // 1. Queue all file hash calculations concurrently
    Object.entries(manifest.integrity_groups).forEach(([groupName, group]) => {
        group.files.forEach((fileEntry, index) => {
            const fileKey = `${groupName}:${index}`;
            
            filesMap.set(fileKey, { 
                ...fileEntry, 
                groupName,
                priority: group.priority 
            });
            
            // Use FileIntegrityHasher plugin
            hashPromises.push(
                AGI_PLUGINS.FileIntegrityHasher.calculateHash({
                    filePath: fileEntry.path, 
                    algorithm: HASH_ALGORITHM 
                })
                .then(currentHash => ({
                    fileKey, 
                    status: 'success',
                    hash: currentHash 
                }))
                .catch(error => ({
                    fileKey, 
                    status: 'error', 
                    message: (error as Error).message 
                }))
            );
        });
    });

    // 2. Wait for all hash calculations to complete in parallel
    const results = await Promise.all(hashPromises);

    // 3. Analyze results and identify breaches
    const breaches: Breach[] = [];

    results.forEach(result => {
        const fileMetadata = filesMap.get(result.fileKey);

        if (!fileMetadata) return; // Should not happen

        if (result.status === 'error') {
            // File inaccessible or hashing failed
            breaches.push({
                path: fileMetadata.path,
                failure_mode: fileMetadata.failure_mode,
                expectedHash: fileMetadata.hash_sha512,
                actualHash: 'N/A (Read Error)',
                details: { error: result.message, type: 'FILE_ACCESS' }
            });
            return;
        }

        // Type cast assertion needed here since `result.hash` exists only if status is 'success'
        const actualHash = result.hash!;
        
        if (actualHash !== fileMetadata.hash_sha512) {
            // Hash Mismatch detected
            breaches.push({
                path: fileMetadata.path,
                failure_mode: fileMetadata.failure_mode,
                expectedHash: fileMetadata.hash_sha512,
                actualHash: actualHash,
                details: { 
                    priority: fileMetadata.priority, 
                    type: 'HASH_MISMATCH' 
                }
            });
        }
    });

    // 4. Handle all collected breaches
    return await handleBreaches(breaches);
}

module.exports = { validateIntegrity };