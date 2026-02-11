/**
 * Standardized error messages for common validation rules.
 * Functions are used to allow dynamic insertion of field names and parameters (e.g., min/max values).
 */
const ValidatorMessages = {
  required: (field) => `${field} is required.`,
  email: (field) => `${field} must be a valid email address.`,
  numeric: (field) => `${field} must be a numeric value.`,
  integer: (field) => `${field} must be an integer.`,
  min: (field, value) => `${field} must be at least ${value}.`,
  max: (field, value) => `${field} cannot exceed ${value}.`,
  minLength: (field, length) => `${field} must be at least ${length} characters long.`,
  maxLength: (field, length) => `${field} cannot exceed ${length} characters.`,
  url: (field) => `${field} must be a valid URL.`,
  date: (field) => `${field} must be a valid date.`,
  matches: (field, otherField) => `${field} must match the value in ${otherField}.`,
  
  // Fallback message for undefined rules
  default: (field) => `The value provided for ${field} is invalid.`,
};

export default ValidatorMessages;