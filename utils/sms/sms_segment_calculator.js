/**
 * Utility function to calculate the number of SMS segments a message will use.
 * This implementation uses standard limits (GSM 7-bit vs UCS-2 16-bit).
 * 
 * @param {Object} params
 * @param {string} params.content - The raw template content string.
 * @param {Object} params.data - The input data used for substitution.
 * @param {string} params.encoding - The required encoding ('GSM_7BIT' or 'UCS_2').
 * @returns {number} The calculated number of segments.
 */
function calculateSmsSegments({ content, data, encoding }) {
    // 1. Perform basic variable substitution
    let finalMessage = content; 
    if (data) {
        Object.keys(data).forEach(key => {
            // Robustly replaces variables wrapped in handlebars, e.g., {{ key }}
            const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
            finalMessage = finalMessage.replace(regex, data[key]);
        });
    }

    const length = finalMessage.length;

    // 2. Determine limits based on encoding
    // Standard limits: (Single/Multi Segment)
    const limits = encoding === 'UCS_2' 
        ? { single: 70, multi: 67 } 
        : { single: 160, multi: 153 }; 
    

    if (length <= limits.single) {
        return 1;
    }
    
    // Calculate segments for concatenated message
    return Math.ceil(length / limits.multi);
}

module.exports = calculateSmsSegments;