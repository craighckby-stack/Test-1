/**
 * Integrity Verification Agent (IVA) V1.0
 * MISSION: Periodically verify all deployed components against the active WCIM.
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

class IntegrityVerificationAgent {
    constructor(manifestPath) {
        this.manifest = this.loadManifest(manifestPath);
        this.verificationLog = [];
    }

    loadManifest(manifestPath) {
        try {
            const data = fs.readFileSync(manifestPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`IVA Error: Failed to load manifest from ${manifestPath}`, error.message);
            process.exit(1);
        }
    }

    async computeFileHash(filePath, algorithm) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash(algorithm);
            const stream = fs.createReadStream(filePath);
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', err => reject(err));
        });
    }

    async verifyComponent(component, deployPath) {
        const modulePath = path.join(deployPath, component.module + '.js'); // Assumes standard component file naming
        const expectedHash = component.canonical_hash.value;
        const algorithm = component.canonical_hash.algorithm.replace('-', '').toLowerCase(); // e.g., SHA3-512 -> sha3512

        try {
            const actualHash = await this.computeFileHash(modulePath, algorithm);
            const status = actualHash === expectedHash ? 'PASS' : 'FAIL';
            
            this.verificationLog.push({
                module: component.module,
                expected: expectedHash,
                actual: actualHash,
                status: status,
                timestamp: new Date().toISOString()
            });
            return status === 'PASS';
        } catch (e) {
            this.verificationLog.push({
                module: component.module,
                status: 'ERROR',
                reason: e.message,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    async runVerification(baseDeployPath = './executables') {
        console.log(`Starting IVA sweep for environment: ${this.manifest.target_environment}...`);
        let overallSuccess = true;

        for (const exec of this.manifest.certified_executables) {
            const success = await this.verifyComponent(exec, baseDeployPath);
            if (!success) overallSuccess = false;
        }

        // In a real system, configurations would be verified against configuration service APIs
        // For simplicity, we only log verification results here.
        console.log('--- Verification Summary ---');
        this.verificationLog.forEach(log => console.log(`[${log.status}] ${log.module}`));

        if (!overallSuccess) {
            console.error('\nFATAL: Integrity mismatch detected. Aborting workflow initialization.');
        }
        
        return overallSuccess;
    }
}

// Example Usage (for local testing):
// const iva = new IntegrityVerificationAgent('./config/WCIM_V1.1_20240723.json');
// iva.runVerification();
module.exports = IntegrityVerificationAgent;
