• Input validation - type checking:
  - The function includes `if (typeof string !== "string") { throw new TypeError("Expected a string"); }`, which is a direct implementation of input validation specifically for type checking.
• Exporting library as default:
  - The line `export default escapeStringRegexp;` explicitly demonstrates exporting the function as the default export of a module.
• Proxy Pattern:
  - Not explicitly used. The function directly transforms the input string rather than providing a surrogate or placeholder for another object to control access.
• Factory Pattern:
  - The function can be seen as a simple factory for "escaped strings." It takes a raw string and "manufactures" a new, transformed string that is safe for use within a regular expression. It creates a new string object based on the input string.