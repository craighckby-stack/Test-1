/**
 * governance/utils/CanonicalSerializationModule.js
 * Optimized Canonical Serialization Module leveraging the DeterministicSerializer plugin.
 */
const DeterministicSerializer = require('./plugins/DeterministicSerializer'); // Assuming plugins are stored here

const serializerInstance = new DeterministicSerializer();

/**
 * Serializes data into a canonical JSON string.
 * Ensures deterministic output crucial for hashing or signing.
 * @param {*} data 
 * @returns {string | undefined} The canonical JSON string, or undefined if the input is undefined.
 */
const canonicalSerialize = (data) => {
    return serializerInstance.serialize(data);
};

module.exports = {
    canonicalSerialize,
};
