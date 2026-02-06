const EventEmitter = require('events');

/**
 * Metrics Audit Logger (MAL) v1.0
 * Provides a standardized interface for logging critical decision metrics and calibration
 * parameters into a streamable, persistent audit trail. Essential for post-hoc analysis
 * of trust score evolution and failure mode tracing, ensuring transparency in ARCH-ATM.
 */
class MetricsAuditLogger extends EventEmitter {
    constructor(streamAdapter) {
        super();
        // streamAdapter might be a Kafka producer, database logger, or simple file stream
        this.adapter = streamAdapter; 
        this.logQueue = [];
        this.isFlushing = false;
        this.flushInterval = 5000; // Flush every 5 seconds
        
        this.startFlushing();
    }

    startFlushing() {
        this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    }

    stopFlushing() {
        clearInterval(this.flushTimer);
    }

    /**
     * Logs a specific metric event for auditing.
     * @param {string} metricType - e.g., 'TRUST_SCORE_CALIBRATION', 'CIW_ADJUSTMENT', 'PSHI_UPDATE'.
     * @param {object} data - The payload containing context, inputs, and outputs.
     */
    log(metricType, data) {
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            metricType,
            data
        };
        this.logQueue.push(entry);
        this.emit('metricLogged', entry);
    }

    async flush() {
        if (this.logQueue.length === 0 || this.isFlushing) {
            return;
        }

        this.isFlushing = true;
        const entriesToFlush = [...this.logQueue];
        this.logQueue = [];

        try {
            // Implementation dependent: Use the provided stream adapter to persist data
            if (this.adapter && typeof this.adapter.write === 'function') {
                await this.adapter.write(entriesToFlush);
            } else {
                // Fallback or No-op if adapter is not configured
            }
        } catch (error) {
            console.error("Error flushing audit metrics:", error.message);
            // Re-queue failed entries for safety
            this.logQueue.unshift(...entriesToFlush);
        } finally {
            this.isFlushing = false;
        }
    }
}

module.exports = MetricsAuditLogger;