/**
 * Component ID: TSC (Telemetry Stream Connector)
 * Functional Focus: Provides high-throughput, fault-tolerant persistence queue for TelemetryLogger records.
 * Implements the required writeLog(record) interface used by TLY, ensuring logging is non-blocking.
 */
class TelemetryStreamConnector {
    constructor(storageClient, batchSize = 100, flushInterval = 5000) {
        this.queue = [];
        this.storageClient = storageClient; // Actual persistence layer connection (DB, Kafka Producer, etc.)
        this.batchSize = batchSize;
        this.flushInterval = flushInterval;
        this.isFlushing = false;

        this._startFlushTimer();
    }

    /**
     * Interface method required by TelemetryLogger. Adds the record to the in-memory queue.
     * @param {object} record - Structured log data.
     */
    async writeLog(record) {
        // Logging operation is now a high-speed synchronous push to an internal queue.
        this.queue.push(record);

        if (this.queue.length >= this.batchSize) {
            // Trigger immediate flush if batch size limit is met
            await this._flushQueue();
        }
    }

    _startFlushTimer() {
        this.timer = setInterval(() => {
            if (this.queue.length > 0) {
                // Use catch to ensure the timer doesn't break on promise rejection
                this._flushQueue().catch(e => console.error('TSC Flush Interval Error:', e));
            }
        }, this.flushInterval);
        this.timer.unref(); // Allows node process to exit gracefully if only this timer is running
    }

    /**
     * Executes batch write to the underlying storage client.
     */
    async _flushQueue() {
        if (this.isFlushing || this.queue.length === 0) {
            return;
        }

        this.isFlushing = true;
        // Safely extract logs to be flushed, allowing new logs to accumulate concurrently
        const recordsToFlush = this.queue.splice(0, this.queue.length);
        
        try {
            // ASSUMPTION: storageClient exposes an efficient bulk persistence method.
            await this.storageClient.batchWrite(recordsToFlush);
            console.debug(`[TSC] Flushed ${recordsToFlush.length} records successfully.`);
        } catch (error) {
            // CRITICAL Audit Trail failure: Re-queue failed logs for the next interval attempt.
            console.error('TSC Storage Write Failed. Re-queuing logs:', recordsToFlush.length, error);
            this.queue.unshift(...recordsToFlush); 
            // TODO: Implement exponential backoff, circuit breaker, or failover logic here.
        } finally {
            this.isFlushing = false;
        }
    }

    /**
     * Attempts to clear the remaining queue synchronously during shutdown.
     */
    close() {
        clearInterval(this.timer);
        if (this.queue.length > 0) {
            return this._flushQueue();
        }
        return Promise.resolve();
    }
}

module.exports = TelemetryStreamConnector;
