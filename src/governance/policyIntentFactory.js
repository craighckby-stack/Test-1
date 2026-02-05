/**
 * Utility: Policy Intent Factory (PIF)
 * ID: PIF-v94
 * Mandate: Centralize the creation of standardized, high-security mutation intent packages (M-XX series),
 *          ensuring strict metadata compliance required for RSAM attestation.
 */
class PolicyIntentFactory {
    constructor(uuidGenerator) {
        this.uuidGenerator = uuidGenerator;
    }

    /**
     * Creates the mandatory M-01 intent package for core policy modification.
     * M-01 is defined by GSEP as the highest priority payload.
     * 
     * @param {MutationIntentPayload} rawRequest 
     * @returns {M01IntentPackage} Structured intent object for RSAM registration.
     */
    createM01Intent(rawRequest) {
        const intentId = `M01-${this.uuidGenerator.v4()}`;
        
        // NOTE: P-01 (Policy Risk Calculation) relies on these fields being strictly typed.
        return {
            id: intentId,
            type: 'POLICY_MODIFICATION_M01',
            priority: 99, // Highest priority
            timestamp: new Date().toISOString(),
            targetPayload: rawRequest,
            securityMetadata: {
                attestationRequired: true,
                p01CalculationRequired: true
            }
        };
    }

    // ... other intent creation methods (e.g., M-02 for resource allocation changes) ...
}

module.exports = PolicyIntentFactory;