const ALGORITHM = 'sha256';

/**
 * Recursively builds a strictly canonicalized JSON string directly.
 * This implementation optimizes performance by avoiding intermediate deep object copies
 * and performing object key sorting and string construction in a single, recursive pass.
 * It uses an array buffer approach (parts.join('')) for efficient string concatenation.
 *
 * @param {*} data The structure to serialize.
 * @returns {string} A strictly canonicalized JSON string.
 */
function canonicalStringify(data) {
    const parts = [];
    
    function serializeValue(o) {
        // Handle null first
        if (o === null) {
            parts.push('null');
            return;
        }

        const type = typeof o;

        // Handle Primitives (String, Number, Boolean, BigInt, undefined, symbol, function)
        if (type !== 'object') {
            if (type === 'string') {
                // Use built-in JSON.stringify for correct escaping and quotation
                parts.push(JSON.stringify(o));
            } else if (type === 'number' || type === 'boolean') {
                parts.push(String(o));
            } else {
                // If unexpected types (like undefined, symbol, function) are found 
                // as explicit values (not object properties), output 'null' for robustness
                // in array context, adhering to common canonical standards.
                if (type === 'undefined' || type === 'function' || type === 'symbol' || type === 'bigint') {
                    parts.push('null');
                }
            }
            return;
        }

        // Handle Array
        if (Array.isArray(o)) {
            parts.push('[');
            let needsComma = false;
            for (let i = 0; i < o.length; i++) {
                if (needsComma) {
                    parts.push(',');
                }
                serializeValue(o[i]);
                needsComma = true;
            }
            parts.push(']');
            return;
        }

        // Handle Object
        const sortedKeys = Object.keys(o).sort();
        parts.push('{');
        let needsComma = false;
        
        for (const key of sortedKeys) {
            const value = o[key];
            // Standard JSON rule: skip undefined, functions, symbols as property values
            if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
                continue;
            }
            
            if (needsComma) {
                parts.push(',');
            }

            // Key must be JSON serialized string
            parts.push(JSON.stringify(key));
            parts.push(':');
            
            serializeValue(value);
            
            needsComma = true;
        }
        parts.push('}');
    }

    serializeValue(data);
    return parts.join('');
}

module.exports = {
    ALGORITHM,
    canonicalStringify
};