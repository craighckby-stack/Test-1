/**
 * Example usage: Loading and accessing the configuration via the KERNEL tool system.
 */

const telecommConfig = KERNEL_SYNERGY_CAPABILITIES.Tool.execute("TelecommConfig", "getConfiguration", { path: "" });

// Accessing a specific limit
const gsmSingleLimit = telecommConfig.SMS.GSM_7BIT.LIMITS.single;

console.log(`Current GSM 7-bit single segment limit: ${gsmSingleLimit}`);