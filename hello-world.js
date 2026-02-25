(function(global, factory) {
    "use strict";

    // Mimic jQuery's UMD-like wrapper for Node/CommonJS and browser environments
    if (typeof module === "object" && typeof module.exports === "object") {
        // Just return the factory with global, as NexusCore is not inherently DOM-dependent.
        module.exports = factory(global);
    } else {
        // Browser global
        factory(global);
    }

})("undefined" != typeof window ? window : this, function(global, noGlobal) {
    "use strict";

    // Store a reference to the old global NexusCore variable, if one exists
    var _oldNexusCore = global.NexusCore;

    // Define the main NexusCore function, acting as a constructor/factory
    // Similar to jQuery, when called without 'new', it should return a new instance.
    var NexusCore = function(options) {
        if (!(this instanceof NexusCore)) {
            return new NexusCore(options);
        }

        // Initialize a NexusCore instance with properties,
        // potentially merging with global defaults.
        // The original BASE properties become default configuration.
        this.config = NexusCore.extend({}, NexusCore.defaults, options);

        // Copy key properties directly for easier access on instances
        this.version = NexusCore.version;
        this.status = this.config.status;
        this.target = this.config.target;
        this.memory = this.config.memory;

        return this;
    };

    // Static properties for NexusCore, similar to jQuery's metadata
    NexusCore.version = "2.0.3"; // From BASE

    // Default configuration derived from BASE, accessible statically
    NexusCore.defaults = {
        status: "STABLE", // From BASE
        target: "hello-world.js", // From BASE
        memory: "Firestore Path Fixed" // From BASE
    };

    // Alias NexusCore.prototype to NexusCore.fn for instance methods, similar to jQuery
    NexusCore.fn = NexusCore.prototype = {
        constructor: NexusCore,
        // Example instance method
        getInfo: function() {
            return {
                version: this.version,
                status: this.status,
                target: this.target,
                memory: this.memory
            };
        },
        // Example instance method to update a config property
        updateTarget: function(newTarget) {
            this.config.target = newTarget;
            this.target = newTarget; // Also update direct instance property
            return this;
        }
    };

    // Implement a simplified jQuery.extend for merging objects.
    // This allows extending NexusCore itself (static methods) or its prototype (instance methods).
    NexusCore.extend = NexusCore.fn.extend = function() {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[i] || {};
            i++;
        }

        // Handle case when target is not an object or function
        if (typeof target !== "object" && typeof target !== "function") {
            target = {};
        }

        // Extend NexusCore itself if only one argument is passed
        if (i === length) {
            target = this;
            i--;
        }

        for (; i < length; i++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) != null) {
                // Extend the base object
                for (name in options) {
                    copy = options[name];

                    // Prevent Object.prototype pollution (jQuery's __proto__ check)
                    if (name === "__proto__" || target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (NexusCore.isPlainObject(copy) ||
                            (copyIsArray = Array.isArray(copy)))) {
                        src = target[name];

                        // Ensure proper type for the clone
                        if (copyIsArray && !Array.isArray(src)) {
                            clone = [];
                        } else if (!copyIsArray && !NexusCore.isPlainObject(src)) {
                            clone = {};
                        } else {
                            clone = src;
                        }
                        copyIsArray = false;

                        // Never move original objects, clone them
                        target[name] = NexusCore.extend(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    };

    // Add static utility methods to NexusCore, similar to jQuery's utilities
    NexusCore.extend({
        // Basic utility to check for plain objects, used in extend
        isPlainObject: function(obj) {
            var proto, Ctor;
            // Detect obvious negatives
            if (!obj || Object.prototype.toString.call(obj) !== "[object Object]") {
                return false;
            }
            proto = Object.getPrototypeOf(obj);
            // Objects with no prototype (e.g., `Object.create(null)`) are plain
            if (!proto) {
                return true;
            }
            // Objects with a prototype must have a constructor that is `Object`
            Ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
            return typeof Ctor === "function" && Ctor === Object && Object.prototype.toString.call(Ctor) === Object.prototype.toString.call(Object);
        },
        error: function(msg) {
            throw new Error(msg);
        }
    });

    // Implement a noConflict mechanism, allowing NexusCore to relinquish global control
    NexusCore.noConflict = function() {
        if (global.NexusCore === NexusCore) {
            global.NexusCore = _oldNexusCore;
        }
        return NexusCore;
    };

    // Expose NexusCore to the global object.
    // If 'noGlobal' is true (for CommonJS environments, indicated by `module.exports`),
    // the global assignment is skipped, and NexusCore is returned directly from the factory.
    if (!noGlobal) {
        global.NexusCore = NexusCore;
    }

    // Return NexusCore itself for module loaders or if noGlobal is true
    return NexusCore;
});