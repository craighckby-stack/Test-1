/**
 * Example usage: Loading and accessing the configuration via the KERNEL tool system,
 * utilizing the ConfigurationAccessPlugin for simplified configuration retrieval.
 */

const { ConfigurationAccessPlugin } = KERNEL_SYNERGY_CAPABILITIES.Plugin.get("ConfigurationAccessPlugin");

// Abstracted configuration loading
const telecommConfig = ConfigurationAccessPlugin.loadConfig("TelecommConfig");

// Destructured access for clarity
const { single: gsmSingleLimit } = telecommConfig.SMS.GSM_7BIT.LIMITS;

console.log(`Current GSM 7-bit single segment limit: ${gsmSingleLimit}`);