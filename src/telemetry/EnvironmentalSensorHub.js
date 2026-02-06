/**
 * EnvironmentalSensorHub v1.0
 * MISSION: Decouples high-frequency synchronous monitoring (CRM) from potentially slow, 
 * asynchronous sensor data collection (OS metrics, network probes, distributed services).
 */
class EnvironmentalSensorHub {
    constructor(collectionInterval_ms = 1000) {
        this.cache = {
            criticalLatency: 0, // Current low-level critical latency (ms)
            normalizedStressIndex: 0 // Current normalized system/external stress (0.0 - 1.0)
        };
        this.collectionInterval_ms = collectionInterval_ms;
        this.isRunning = false;
        this.intervalHandle = null;
        // sensors will contain { run: async () => {}, keys: [] }
        this.sensors = []; 
    }

    /**
     * Adds a data source/sensor implementation.
     * @param {Object} sensor - An object with an async 'run' method.
     */
    addSensor(sensor) {
        // Future implementation: Add validation and integrate sensor data into the cache based on defined keys.
        this.sensors.push(sensor);
    }

    startCollection() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        const runLoop = async () => {
            // Execute all asynchronous collection tasks
            await this.collectAllSensors();
        };

        this.intervalHandle = setInterval(runLoop, this.collectionInterval_ms);
        runLoop(); // Immediate execution upon start
    }

    stopCollection() {
        if (!this.isRunning) return;
        clearInterval(this.intervalHandle);
        this.isRunning = false;
    }

    /**
     * Executes all registered sensors and atomically updates the cache.
     */
    async collectAllSensors() {
        try {
            // --- Placeholder Implementation for testing/initial structure ---
            const latency = Math.floor(Math.random() * 50) + 5;
            const stress = parseFloat(Math.random().toFixed(2));

            this.cache.criticalLatency = latency;
            this.cache.normalizedStressIndex = stress;

            // In future versions, run this.sensors and aggregate results here
        } catch (error) {
            // Handle global collection failure if necessary
        }
    }

    // Synchronous read APIs used by ContextualRuntimeMonitor (CRM)
    getSystemLatency() {
        return this.cache.criticalLatency;
    }

    getNormalizedStressIndex() {
        return this.cache.normalizedStressIndex;
    }
}

module.exports = EnvironmentalSensorHub;