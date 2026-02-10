/**
 * TelemetryTransport
 * Handles asynchronous delivery using the TimedBatchProcessorUtility for queue management.
 */

declare const _TP: {
    TimedBatchProcessorUtility: {
        create: (config: any) => {
            queueItem: (item: any) => void;
            stop: () => Promise<void>;
        }
    }
};

class TelemetryTransport {
    private endpoint: string;
    private batchProcessor: ReturnType<typeof _TP.TimedBatchProcessorUtility.create>;

    constructor(config: { endpoint: string, batchSize?: number, flushInterval?: number }) {
        this.endpoint = config.endpoint;

        // 1. Define the transport handler (the logic previously in flush())
        const transportFlushHandler = async (batchToSend: any[]) => {
            if (batchToSend.length === 0) return;

            try {
                // Perform HTTP POST request
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(batchToSend)
                });

                if (!response.ok) {
                    console.error(`Telemetry Transport: Failed to send batch (${response.status})`, response.statusText);
                }

            } catch (error) {
                if (error instanceof Error) {
                    console.error('Telemetry Transport Network Error:', error.message);
                } else {
                    console.error('Telemetry Transport Unknown Network Error:', error);
                }
            }
        };

        // 2. Initialize the batch processor tool, delegating scheduling and queue management
        // The processor starts itself upon creation and processes batches using the handler.
        this.batchProcessor = _TP.TimedBatchProcessorUtility.create({
            batchSize: config.batchSize,
            flushInterval: config.flushInterval,
            flushHandler: transportFlushHandler
        });
    }

    queueEvent(packet: any): void {
        this.batchProcessor.queueItem(packet);
        // The processor automatically triggers flush based on size or time.
    }

    /**
     * Shuts down the transport, clears the interval, and attempts a final flush
     * of any remaining queued items.
     */
    async shutdown(): Promise<void> {
        // Delegate shutdown logic to the processor utility
        await this.batchProcessor.stop();
    }
}

module.exports = TelemetryTransport;
