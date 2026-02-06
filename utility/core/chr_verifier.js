/*
 * FILE: utility/core/chr_verifier.js
 * SOVEREIGN AGI V94.1 CHR Verification Utility
 * 
 * Description: 
 * Enforces Configuration Integrity Check Requirement (C-ICR) by validating the hash registry 
 * against the live configuration files and verifying the CHR's self-integrity signature.
 */

const fs = require('fs/promises');
const crypto = require('crypto');
const path = require('path');

const CHR_PATH = path.join(__dirname, '../../protocol/chr_schema.json');
const CONFIG_ROOT = path.join(__dirname, '../../');

/**
 * Calculates the hash of a file using the specified algorithm.
 * @param {string} filePath - Absolute path to the file.
 * @param {string} algorithm - Hashing algorithm (e.g., SHA3-512).
 * @returns {Promise<string>} The calculated hash in hex format.
 */
async function calculateFileHash(filePath, algorithm) {
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash(algorithm.replace('-', '')); // Normalize algorithm name
    hash.update(fileBuffer);
    return hash.digest('hex');
}

/**
 * Verifies the integrity of the CHR against monitored configuration files.
 */
async function verifyConfigurationHashes() {
    console.log(`[CHR] Commencing C-ICR enforcement using protocol ${global.protocolVersion}...`);

    let chrContent;
    try {
        const rawChr = await fs.readFile(CHR_PATH, 'utf8');
        chrContent = JSON.parse(rawChr);
    } catch (e) {
        console.error(`[CHR ERROR] Failed to load CHR file at ${CHR_PATH}:`, e.message);
        return false;
    }
    
    const results = [];
    let integrityFailed = false;

    // 1. Verify CHR Self-Integrity (Ensures the registry itself hasn't been tampered with)
    const { integrity_signature, registry, ...chrVerificationPayload } = chrContent;
    const selfHashAlgorithm = integrity_signature.algorithm.replace('-', '');
    const expectedSelfSignature = integrity_signature.signature;
    
    // Recalculate hash based on verified subset (Excluding integrity_signature)
    const calculatedSelfSignature = crypto.createHash(selfHashAlgorithm)
        .update(JSON.stringify({ ...chrVerificationPayload, registry }))
        .digest('hex');
        
    if (calculatedSelfSignature !== expectedSelfSignature) {
        console.error(`[CHR L5 CORE_CRITICAL] CHR File Integrity Failed: Expected ${expectedSelfSignature}, Got ${calculatedSelfSignature}`);
        integrityFailed = true; // High alert, potentially trigger lockdown
    } else {
        console.log('[CHR Success] CHR File Integrity Verified.');
    }

    // 2. Verify all configuration entries
    for (const item of registry) {
        const absolutePath = path.join(CONFIG_ROOT, item.file_path);
        const { hash_value, algorithm } = item.integrity_metric;
        
        try {
            const calculatedHash = await calculateFileHash(absolutePath, algorithm);
            
            if (calculatedHash !== hash_value) {
                console.error(`[CHR MISMATCH | ${item.criticality_level}] File: ${item.file_path} (Tag: ${item.module_tag})`);
                console.error(`    Expected ${algorithm}: ${hash_value}`);
                console.error(`    Runtime ${algorithm}: ${calculatedHash}`);
                results.push({ path: item.file_path, status: 'FAILED', level: item.criticality_level });
                if (item.criticality_level === 'L5_CORE_CRITICAL' || item.criticality_level === 'L4_SYSTEM_HIGH') {
                    integrityFailed = true; // Mark system failure
                }
            } else {
                results.push({ path: item.file_path, status: 'OK' });
            }
        } catch (e) {
            console.error(`[CHR FILE ERROR] Could not read configuration file: ${item.file_path}. Error: ${e.code}`);
            results.push({ path: item.file_path, status: 'MISSING', level: item.criticality_level });
            integrityFailed = true;
        }
    }

    if (integrityFailed) {
        console.error('\n--- [SYSTEM BREACH ALERT] Configuration Integrity Failure Detected. Initiate L-9 Enforcement Procedures. ---');
    } else {
        console.log('\n[C-ICR Verified] All monitored configurations match registry baseline.');
    }
    
    return !integrityFailed;
}

module.exports = { verifyConfigurationHashes };
