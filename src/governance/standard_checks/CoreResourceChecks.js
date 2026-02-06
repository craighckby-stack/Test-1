/**
 * CORE RESOURCE CHECKS
 * ID: RCR-C01
 * GSEP Role: Provides standardized, basic, pre-defined resource checks to be registered
 * with the ResourceCheckRegistry upon system boot.
 */

// Placeholder constant, assumed governanceConfig will define this.
const ONE_SECOND_MS = 1000;

/**
 * @typedef {import('../ResourceCheckRegistry').ResourceCheckFunction} ResourceCheckFunction
 */

/**
 * Standard CPU Utilization Check.
 * Ensures average CPU usage is below a specified threshold.
 * @type {ResourceCheckFunction}
 */
const cpuUtilizationCheck = async (monitor, governanceConfig, metadata) => {
    // Priority: Specific payload requirements > Global governance defaults
    const required = metadata.requiredResources?.cpuThreshold || governanceConfig.defaultCpuThreshold || 75; 
    
    // NOTE: Implementation assumes 'monitor' is an object exposing system metric fetching methods.
    // A real implementation would involve fetching from the OS monitor or telemetry service.
    const metrics = await monitor.getSystemMetrics(); 
    const currentUsage = metrics.cpu.usagePercentage; // Assumed structure

    const success = currentUsage <= required;
    
    return {
        success,
        details: {
            current: currentUsage,
            required: required,
            unit: '%',
            measurementId: 'SYS_CPU_U'
        }
    };
};

/**
 * Standard Memory Free Check.
 * Ensures a minimum percentage of free memory is available.
 * @type {ResourceCheckFunction}
 */
const memoryAvailableCheck = async (monitor, governanceConfig, metadata) => {
    const requiredPercentage = metadata.requiredResources?.memoryPercentageMin || governanceConfig.defaultMemoryMinPercentage || 20;

    const metrics = await monitor.getSystemMetrics();
    const currentAvailablePercentage = metrics.memory.availablePercentage; // Assumed structure

    const success = currentAvailablePercentage >= requiredPercentage;

    return {
        success,
        details: {
            current: currentAvailablePercentage,
            required: requiredPercentage,
            unit: '% available',
            measurementId: 'SYS_MEM_A'
        }
    };
};

/**
 * Standard NTP/Clock Synchronization Check.
 * Ensures system clock skew relative to trusted sources is within limits.
 * @type {ResourceCheckFunction}
 */
const clockSkewCheck = async (monitor, governanceConfig, metadata) => {
    const maxSkewMs = metadata.requiredResources?.maxClockSkewMs || governanceConfig.defaultMaxClockSkewMs || ONE_SECOND_MS; 

    const metrics = await monitor.getTimeSyncMetrics(); // Assumed method
    const currentSkewMs = metrics.clockSkewMs; 

    // Check if absolute value of skew is within tolerance
    const success = Math.abs(currentSkewMs) <= maxSkewMs; 

    return {
        success,
        details: {
            current: currentSkewMs,
            required: maxSkewMs,
            unit: 'ms',
            measurementId: 'SYS_CLOCK_S'
        }
    };
};


module.exports = {
    cpuUtilizationCheck,
    memoryAvailableCheck,
    clockSkewCheck
};