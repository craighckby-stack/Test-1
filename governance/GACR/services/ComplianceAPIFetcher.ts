import { IComplianceDataFetcher } from '../resolvers/PolicyAdherenceResolver';

// NOTE: AGI_PLUGINS access is assumed available within the execution context.

/**
 * ComplianceAPIFetcher implements the IComplianceDataFetcher interface.
 * This service is responsible for handling network requests or system queries 
 * needed to retrieve raw compliance data, leveraging kernel tools for simulation or execution.
 */
export class ComplianceAPIFetcher implements IComplianceDataFetcher {
    private apiBaseUrl: string; // Configuration detail

    constructor(baseUrl: string = 'http://localhost:8080/compliance/') {
        this.apiBaseUrl = baseUrl;
    }

    /**
     * Fetches compliance metrics using the SimulatedDataFetcherTool (or a real Fetcher Tool in production).
     * @param endpoint - The specific API path defined in the policy's audit_config.
     * @returns A promise resolving to the raw compliance data value.
     */
    public async fetchComplianceData(endpoint: string): Promise<number> {
        // Delegate URL construction, latency simulation, and mock response generation to the kernel plugin.
        
        // Safety check (assuming AGI_PLUGINS is defined globally or injected)
        if (typeof AGI_PLUGINS === 'undefined' || !AGI_PLUGINS.SimulatedDataFetcherTool) {
            throw new Error("Required kernel plugin 'SimulatedDataFetcherTool' is unavailable.");
        }

        const data: number = await AGI_PLUGINS.SimulatedDataFetcherTool.execute({
            baseUrl: this.apiBaseUrl,
            endpoint: endpoint
        });

        return data;
    }
}