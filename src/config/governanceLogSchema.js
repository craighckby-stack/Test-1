/**
 * Global Log Governance Schema Definition (GSEP Standard v2.1)
 * Component: LogNormalizationModule (LNM)
 * 
 * Defines required structure, type coercion, and validation rules for all 
 * Sovereign AGI operational log streams before ingestion. Decoupled from LNM core logic.
 * 
 * Note: Coercers and Validators requiring complex logic are sourced from the SchemaFieldValidatorUtility (SDFU).
 */

// Placeholder requirement for the utility interface, assumed to be loaded by the kernel environment.
// In a full implementation, SDFU would be registered with the SchemaValidationEngine.
const SDFU = {
    utils: {
        coerceToISOString: (val) => { 
            const date = new Date(val); 
            if (isNaN(date.getTime())) { 
                throw new Error("Invalid date input.");
            }
            return date.toISOString(); 
        },
        validateISOString: (val) => typeof val === 'string' && val.includes('T') && !isNaN(Date.parse(val)),
        coerceToFlooredInteger: (val) => {
            const num = Number(val);
            if (isNaN(num)) throw new Error("Value must be numeric.");
            return Math.floor(num);
        },
        validateHexadecimal: (val, minLength) => typeof String(val) === 'string' && String(val).length >= minLength && /^[0-9a-fA-F]+$/.test(String(val)),
        safeJSONCoercer: (val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch (e) {
                    return val; 
                }
            }
            return val;
        }
    }
};

module.exports = {
    timestamp: { 
        required: true, 
        // Using plugin utility for robust date coercion
        coercer: (val) => SDFU.utils.coerceToISOString(val), 
        // Using plugin utility for ISO format validation
        validator: (val) => SDFU.utils.validateISOString(val),
        error_code: 'LNM_401' 
    },
    component_id: { 
        required: true, 
        coercer: (val) => String(val).toUpperCase(),
        validator: (val) => typeof val === 'string' && val.length > 0,
        error_code: 'LNM_402'
    },
    status_code: { 
        required: true, 
        coercer: Number, 
        validator: Number.isInteger, 
        error_code: 'LNM_403' 
    }, 
    gsep_stage: { 
        required: true, 
        // Using plugin utility for robust numeric coercion and flooring
        coercer: (val) => SDFU.utils.coerceToFlooredInteger(val), 
        validator: (val) => typeof val === 'number' && val >= 1 && val <= 5, 
        error_code: 'LNM_404', 
        error: 'GSEP stage index out of bounds (1-5)'
    },
    input_hash: { 
        required: true, 
        coercer: String, 
        // Using plugin utility for combined hex format and length validation
        validator: (val) => SDFU.utils.validateHexadecimal(val, 10),
        error_code: 'LNM_405',
        error: 'Input hash must be a minimum 10-character hexadecimal string.'
    },
    // Optional fields maintain strict type checks if present
    metadata: {
        required: false,
        // Using plugin utility for safe JSON coercion
        coercer: (val) => SDFU.utils.safeJSONCoercer(val),
        validator: (val) => typeof val === 'object' && val !== null,
        error_code: 'LNM_406'
    }
};
