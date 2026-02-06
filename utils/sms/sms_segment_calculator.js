/**
 * Utility function to calculate the number of SMS segments a message will use.
 * This implementation automatically detects required encoding (GSM 7-bit vs UCS-2 16-bit)
 * and accurately calculates GSM message length, accounting for extended characters.
 *
 * @module SmsSegmentCalculator
 */

// --- Standard Constants and Character Sets ---

const GSM_STANDARDS = {
    LIMITS: { single: 160, multi: 153 },
    // Standard basic characters
    BASIC_CHARS_REGEX: /[A-Za-z0-9\s!"#\$%&'\(\)\*\+,\-\.\/:;<=>\?@£¥èéùìòÇØøÅåΔΓΛΩΠΨΣΘΞÆæßÉñÑ¿¡\r\n]/g,
    // Characters that count as two GSM characters
    EXTENDED_CHARS: ['\f', '^', '{', '}', '\\', '[', '~', ']', '|', '€'],
};

const UCS2_STANDARDS = {
    LIMITS: { single: 70, multi: 67 }
};

// Pre-calculate escaped regex for extended characters. Ensure regex control characters are properly escaped.
const ESCAPED_EXTENDED_CHARS_REGEX = new RegExp(`[${GSM_STANDARDS.EXTENDED_CHARS.map(c => {
    // Escapes standard regex control characters, including the backslash itself
    return c.replace(/([.*+?^$(){}|\[\]\\])/g, '\\$1');
}).join('')}]`, 'g');


/**
 * Helper to perform basic handlebars-style variable substitution.
 * Note: In a larger system, this functionality should be delegated to a dedicated Templating Engine.
 * @param {string} templateContent
 * @param {Object} data
 * @returns {string}
 */
function substituteVariables(templateContent, data) {
    if (!data || Object.keys(data).length === 0) {
        return templateContent;
    }
    return Object.entries(data).reduce((msg, [key, value]) => {
        // Coerce value to string, handling null/undefined safely
        const replacement = String(value ?? '');
        // Regex handles {{ key }}, {{key}}, {{ key}} whitespace variation
        const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
        return msg.replace(regex, replacement);
    }, templateContent);
}


/**
 * Calculates the effective length of the message under GSM 7-bit encoding,
 * accounting for extended characters counting as 2 (GSM standards).
 * @param {string} message
 * @returns {number}
 */
function calculateGsmLength(message) {
    let length = message.length;
    
    // Increment length by 1 for every extended character (since it consumes 2 segments)
    const extendedMatches = message.match(ESCAPED_EXTENDED_CHARS_REGEX);
    if (extendedMatches) {
        length += extendedMatches.length;
    }
    return length;
}


/**
 * Determines if the message requires UCS-2 encoding by checking for non-GSM 7-bit characters.
 * This function attempts to strip all known GSM characters (basic and extended).
 * @param {string} message
 * @returns {boolean}
 */
function requiresUcs2Encoding(message) {
    let checkStr = message;
    
    // 1. Remove all characters that are part of the GSM basic alphabet.
    checkStr = checkStr.replace(GSM_STANDARDS.BASIC_CHARS_REGEX, '');
    
    // 2. Remove all characters that are part of the GSM extended alphabet.
    checkStr = checkStr.replace(ESCAPED_EXTENDED_CHARS_REGEX, '');
    
    // If any characters remain, they force UCS-2 (16-bit).
    return checkStr.length > 0;
}


/**
 * Core utility function to calculate the number of SMS segments.
 *
 * @param {Object} params
 * @param {string} params.content - The raw template content string.
 * @param {Object} [params.data={}] - The input data used for substitution.
 * @returns {number} The calculated number of segments.
 */
function calculateSmsSegments({ content, data = {} }) {
    if (!content) {
        return 0;
    }
    
    const finalMessage = substituteVariables(content, data);

    const isUcs2 = requiresUcs2Encoding(finalMessage);

    let length, limits;
    
    if (isUcs2) {
        length = finalMessage.length;
        limits = UCS2_STANDARDS.LIMITS;
    } else {
        length = calculateGsmLength(finalMessage);
        limits = GSM_STANDARDS.LIMITS;
    }

    // Single segment check
    if (length <= limits.single) {
        return 1;
    }
    
    // Multi-segment calculation: Math.ceil(Total_Chars / Concatenation_Limit)
    return Math.ceil(length / limits.multi);
}

module.exports = {
    calculateSmsSegments,
    // Export standards for configuration inspection and testing
    GSM_STANDARDS,
    UCS2_STANDARDS
};
