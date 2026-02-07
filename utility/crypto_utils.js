/**
 * Defines the standard cryptographic algorithm used for integrity checks.
 * ALGORITHM: 'sha256'
 */
const ALGORITHM = 'sha256';

/**
 * Recursively sorts keys of an object to ensure deterministic output for hashing.
 * This guarantees cryptographic integrity across different execution environments.
 * @param {object} obj The object to canonicalize.
 * @returns {string} A strictly canonicalized JSON string.
 */
function canonicalStringify(obj) {
    function sortObjectKeys(o) {
        if (typeof o !== 'object' || o === null) {
            return o;
        }
        if (Array.isArray(o)) {
            // Recursive canonicalization for array items
            return o.map(sortObjectKeys);
        }
        
        const sortedKeys = Object.keys(o).sort();
        const sortedObject = {};
        
        for (const key of sortedKeys) {
            sortedObject[key] = sortObjectKeys(o[key]);
        }
        return sortedObject;
    }

    const canonicalObj = sortObjectKeys(obj);
    return JSON.stringify(canonicalObj);
}

module.exports = {
    ALGORITHM,
    canonicalStringify
};