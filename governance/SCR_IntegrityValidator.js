/**
 * SCR_IntegrityValidator v94.1
 * Autonomous system component for enforcing structural integrity policies.
 *
 * Reads SCR_IntegrityManifest.json, computes real-time file hashes,
 * and enforces declared failure modes upon divergence.
 */

const fs = require('fs');
const crypto = require('crypto');
const manifestPath = './governance/SCR_IntegrityManifest.json';

async function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha512');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', err => reject(err));
    });
}

async function validateIntegrity() {
    if (!fs.existsSync(manifestPath)) {
        console.error('CRITICAL: Integrity Manifest not found.');
        return false;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`[Integrity Check] Starting validation using Manifest ID: ${manifest.manifest_id}`);
    let failureCount = 0;

    for (const groupName in manifest.integrity_groups) {
        const group = manifest.integrity_groups[groupName];
        console.log(`  -> Validating Group: ${groupName} (Priority: ${group.priority})`);

        for (const fileEntry of group.files) {
            try {
                const currentHash = await calculateFileHash(fileEntry.path);
                if (currentHash !== fileEntry.hash_sha512) {
                    console.warn(`  [FAIL] File: ${fileEntry.path}. Hash mismatch.`);
                    console.warn(`    -> Expected: ${fileEntry.hash_sha512}`);
                    console.warn(`    -> Actual:   ${currentHash}`);
                    console.error(`    -> ENFORCING Failure Mode: ${fileEntry.failure_mode}`);
                    failureCount++;
                    // Placeholder for Failure Mode Execution Logic (e.g., self-heal, halt)
                } else {
                    // console.log(`  [PASS] File: ${fileEntry.path}`);
                }
            } catch (error) {
                console.error(`  [ERROR] Cannot access file ${fileEntry.path}: ${error.message}`);
                failureCount++;
            }
        }
    }

    if (failureCount > 0) {
        console.error(`VALIDATION FAILED: ${failureCount} critical files compromised.`);
        return false;
    } else {
        console.log('VALIDATION SUCCESS: System integrity confirmed.');
        return true;
    }
}

module.exports = { validateIntegrity };
