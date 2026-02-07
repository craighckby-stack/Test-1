const TEE_Interface = require('../TEE_Interface');
const CryptoService = require('../../utility/CryptoService');

/**
 * @file SRAA_AttestationAgent.js
 * Secure Remote Attestation Agent (SRAA) Logic.
 * Runs upon SIVM failure signals to collect and transmit forensic evidence securely.
 * @exports {function} runAttestation
 */

/**
 * Collects minimal forensic snapshot and securely transmits it out-of-band.
 * @param {object} failureStateData - Data describing the system failure state.
 * @returns {Promise<boolean>} True if transmission was successful.
 */
async function runAttestation(failureStateData) {
    // ATTESTATION_ENDPOINT is retrieved dynamically, matching Python behavior.
    const ATTESTATION_ENDPOINT = TEE_Interface.getEndpoint("SIVM_EKEY_1");

    if (!TEE_Interface.isSecureState()) {
        return false;
    }

    // 1. Collect immutable evidence
    const evidence = await TEE_Interface.collectSealedEvidence();

    // 2. Package failure context
    const packageData = {
        timestamp: TEE_Interface.getSecureTime(),
        module_id: "SIVM_V2",
        failure_data: failureStateData,
        immutable_evidence: evidence
    };

    // 3. Encrypt package (AES-256-GCM)
    const packageString = JSON.stringify(packageData);
    const encryptedPackage = await CryptoService.encryptData(packageString, ATTESTATION_ENDPOINT.key);

    // 4. Transmit securely
    const success = await TEE_Interface.transmitSecurely(ATTESTATION_ENDPOINT.url, encryptedPackage);

    return success;
}

module.exports = {
    runAttestation
};