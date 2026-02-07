/**
 * TelemetryAggregationStrategy
 * Defines the standard strategies for handling Operational Telemetry metrics
 * before submission, ensuring consistency across configuration (schema) and implementation.
 */
export enum TelemetryAggregationStrategy {
    /** Metrics are summed up over a flush interval (e.g., event counts, error rates). */
    COUNTER = 'COUNTER',

    /** Metrics represent a value captured at the moment of flush (e.g., current memory usage). */
    GAUGE = 'GAUGE',

    /** Metrics capture a distribution of values (e.g., latency, processing time), typically yielding histograms. */
    DISTRIBUTION = 'DISTRIBUTION',

    /** Metrics capture unique items encountered within a period (e.g., distinct error codes). */
    SET = 'SET',
}