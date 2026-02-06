/**
 * Utility function to calculate the number of SMS segments a message will use.
 * This implementation automatically detects required encoding (GSM 7-bit vs UCS-2 16-bit)
 * and accurately calculates GSM message length, accounting for extended characters.
 *
 * @param {Object} params
 * @param {string} params.content - The raw template content string.
 * @param {Object} params.data - The input data used for substitution (optional).
 * @returns {number} The calculated number of segments.
 */

// --- Constants for SMS segment limits ---
const GSM_LIMITS = { single: 160, multi: 153 };
const UCS2_LIMITS = { single: 70, multi: 67 };

// GSM Extended Characters (count as 2 characters in GSM encoding)
const GSM_EXTENDED_CHARS = ['\f', '^', '{', '}', '\\', '[', '~', ']', '|', '€'];
const GSM_EXTENDED_REGEX = new RegExp(`[${GSM_EXTENDED_CHARS.map(c => `\${c}`).join('')}]`, 'g');

// GSM 7-bit Basic Alphabet Regex (used for UCS-2 detection)
// Note: This covers the common set. If a character is not in this set and not in the extended set, it forces UCS-2.
const GSM_BASIC_ALPHABET_REGEX = /[A-Za-z0-9\s!"#\$%&'\(\)\*\+,\-\.\/:;<=>\?@\[\]\^_\{\}\\|~£¥èéùìòÇØøÅåΔΓΛΩΠΨΣΘΞÆæßÉñÑ¿¡\r\n]/g;

/**
 * Calculates the effective length of the message under GSM 7-bit encoding,
 * accounting for extended characters counting as 2.
 * @param {string} message
 * @returns {number}
 */
function calculateGsmLength(message) {
    let length = message.length;
    
    // Add 1 to the length for every occurrence of an extended character (since they use 2 segments).
    const extendedMatches = message.match(GSM_EXTENDED_REGEX);
    if (extendedMatches) {
        length += extendedMatches.length;
    }
    return length;
}

/**
 * Determines if the message requires UCS-2 encoding by checking for non-GSM characters.
 * @param {string} message
 * @returns {boolean}
 */
function requiresUcs2(message) {
    let remainingMessage = message;
    
    // 1. Remove all characters that belong to the GSM basic alphabet.
    remainingMessage = remainingMessage.replace(GSM_BASIC_ALPHABET_REGEX, '');
    
    // 2. Remove all characters that belong to the GSM extended alphabet.
    remainingMessage = remainingMessage.replace(GSM_EXTENDED_REGEX, '');
    
    // If any characters remain, they are outside the GSM standard, forcing UCS-2.
    return remainingMessage.length > 0;
}

function calculateSmsSegments({ content, data }) {
    // 1. Perform robust variable substitution
    const finalMessage = Object.entries(data || {}).reduce((msg, [key, value]) => {
        // Ensure value is stringified for replacement
        const replacement = String(value ?? ''); 
        // Robustly replaces variables wrapped in handlebars, e.g., {{ key }}
        const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
        return msg.replace(regex, replacement);
    }, content);

    // 2. Determine encoding and length based on content analysis
    const isUcs2 = requiresUcs2(finalMessage);

    let length, limits;
    
    if (isUcs2) {
        // UCS-2: Length is standard character count
        length = finalMessage.length;
        limits = UCS2_LIMITS;
    } else {
        // GSM 7-bit: Length accounts for 2-char extended sequences
        length = calculateGsmLength(finalMessage);
        limits = GSM_LIMITS;
    }

    // 3. Calculate segments
    if (length <= limits.single) {
        return 1;
    }
    
    // Calculate segments for concatenated message
    return Math.ceil(length / limits.multi);
}

module.exports = calculateSmsSegments;