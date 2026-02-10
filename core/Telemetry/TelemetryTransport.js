/**
 * TelemetryTransport
 * Handles asynchronous delivery using the HttpBatchTransport plugin
 * for queue management and network delivery.
 */

declare const _TP: {
    TimedBatchProcessorUtility: {
        create: (config: any) => {
            queueItem: (item: any) => void;
            stop: () => Promise<void>;
        }
    }
};

/**
 * Using composition with HttpBatchTransport plugin to manage core logic.
 */
class TelemetryTransport {
    private httpTransport: ReturnType<typeof require('./HttpBatchTransport')>;

    constructor(config: { endpoint: string, batchSize?: number, flushInterval?: number }) {
        // Initialize the abstracted transport layer
        const HttpBatchTransport = require('./HttpBatchTransport');
        this.httpTransport = new HttpBatchTransport(config);
    }

    queueEvent(packet: any): void {
        // Delegate queuing to the transport layer
        this.httpTransport.queueItem(packet);
    }

    /**
     * Shuts down the transport and attempts a final flush.
     */
    async shutdown(): Promise<void> {
        await this.httpTransport.shutdown();
    }
}

module.exports = TelemetryTransport;