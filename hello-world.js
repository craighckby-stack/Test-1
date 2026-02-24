• Input validation - type checking:
  - The function includes multiple `if (typeof string !== "string") { throw new TypeError(...) }`, `if (typeof count !== "number") { throw new TypeError(...) }`, and `if (typeof indent !== "string") { throw new TypeError(...) }` statements, which are direct implementations of input validation specifically for type checking.
• Exporting library as default:
  - The line `export default indentString;` explicitly demonstrates exporting the function as the default export of a module.
• Proxy Pattern:
  - Not explicitly used. The function directly transforms the input string rather than providing a surrogate or placeholder for another object to control access.
• Factory Pattern:
  - The function acts as a simple factory for "indented strings." It takes a raw string and "manufactures" a new, transformed string that is indented according to the specified count and options. It creates a new string object based on the input string.
• Factory Method Pattern (exemplified by the destructuring of the options object):
  - The function creates a new string object (Factory Pattern). The destructuring of the `options` object with default values (`indent = " "`, `includeEmptyLines = false`) provides a flexible and configurable way to "manufacture" the indented string, allowing for variations in its creation based on input parameters.
• Null Object Pattern (or Optional Chaining Pattern):
  - Not explicitly used. The function uses default parameters for `count` and `options`, and destructuring with default values for `indent` and `includeEmptyLines` within the `options` object, effectively handling missing values without needing a dedicated Null Object or optional chaining.
• Input validation using Guard Clauses:
  - The function extensively uses guard clauses such as `if (typeof string !== "string") { throw new TypeError(...) }`, `if (count < 0) { throw new RangeError(...) }`, and `if (count === 0) { return string; }` to validate inputs and handle edge cases early, ensuring robust behavior.
• Decorator Pattern (regex decorator in replace()):
  - The function uses `string.replace(regex, indent.repeat(count))` where the `regex` (`/^/gm` or `/^(?!\s*$)/gm`) acts as a "decorator" for the `replace` operation. It defines the specific logic and conditions under which the string's content should be modified, effectively adding transformation behavior to the string.