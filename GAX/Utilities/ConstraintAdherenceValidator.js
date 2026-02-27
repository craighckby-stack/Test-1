class Config {
  // Private properties
  #_schema = {
    type: 'object',
    properties: {
      foo: { type: 'string', default: 'bar' },
      baz: { type: 'boolean', default: false }
    },
    required: ['foo', 'baz']
  };

  #_values = {};

  /**
   * Creates an instance of Config.
   * @param {Object} values Optional configuration values.
   */
  constructor(values = {}) {
    this.#parseValues(values);
    this.#validateConfig();
  }

  #parseValues(values) {
    Object.assign(this.#_values, values);
  }

  #validateConfig() {
    try {
      const validator = new JSONSchemaValidator();
      validator.addSchema(this.#_schema);
      validator.validate(this.#_values, this.#_schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  // Configuration schema
  get schema() {
    return this.#_schema;
  }

  // Configuration values
  get values() {
    return { ...this.#_values };
  }

  set values(value) {
    this.#parseValues(value);
    this.#validateConfig();
  }
}

// Define a singleton class for errors
class LifecycleEvent extends Error {
  constructor(event, message = '') {
    super(message);
    this.name = 'LifecycleEvent';
    this.event = event;
  }
}

// Define a class for lifecycle handlers
class LifecycleHandler {
  // Target object to bind the handler
  #_target = null;

  // Lifecycle event
  #_event = null;

  // Handler function
  #_handler = null;

  constructor(handler) {
    this.#_handler = handler;
  }

  // Bind the handler to a target object and event
  bind(target = this, event = this.event, handler = this.handler) {
    this.#_target = target;
    this.#_event = event;
  }

  // Execute the handler function
  async execute(event, params = {}) {
    await this.#_handler.call(this.#_target, this.#_event, params);
  }
}

class NexusCore {
  // Static instance of the NexusCore class
  static #_instance = null;

  // Configuration for the instance
  #_config = {
    foo: 'bar',
    baz: false
  };

  // Initial status of the instance
  #_status = 'INIT';

  // Lifecycle status
  #_lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    destroying: false
  };

  // Event handlers
  #_eventHandlers = {};

  // Get the singleton instance
  static get instance() {
    if (!this.#_instance) {
      this.#_instance = new NexusCore();
    }
    return this.#_instance;
  }

  // Private constructor to prevent direct instantiation
  constructor() {
    if (this.constructor === NexusCore) {
      throw new Error('NexusCore instance is not singleton');
    }
  }

  // Get the current status
  get status() {
    return this.#_status;
  }

  // Get the lifecycle status
  get lifecycle() {
    return this.#_lifecycle;
  }

  // Get the configuration
  get config() {
    return { ...this.#_config };
  }

  // Set the configuration
  set config(value) {
    if (!value || typeof value !== 'object') {
      console.error('Invalid config:', value);
      throw new Error('Invalid config');
    }
    if ('type' in value && value.type !== 'object') {
      console.error('Invalid config type:', value);
      throw new Error('Invalid config type');
    }
    this.#_config = value;
    this.#_validateConfig();
    this.#_lifecycle.configured = true;
  }

  #_validateConfig() {
    try {
      const validator = new JSONSchemaValidator();
      validator.addSchema(Config.schema);
      validator.validate(this.#_config, Config.schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  // On event listener
  on(event, handler, priority) {
    if (event instanceof LifecycleEvent) {
      const lifecycleEvent = event;
      event = lifecycleEvent.event;
    }
    if (!this.#_eventHandlers[event]) {
      this.#_eventHandlers[event] = [];
    }
    const eventHandler = new LifecycleHandler(handler);
    eventHandler.bind(this, event, handler);
    this.#_eventHandlers[event].push(eventHandler);
    if (priority > 0 && this.#_eventHandlers[event].length > 1) {
      const handlerCount = this.#_eventHandlers[event].length;
      const sortedHandlers = this.#_eventHandlers[event].sort((a, b) => b.priority - a.priority);
      while (sortedHandlers.length > handlerCount) {
        sortedHandlers.pop();
      }
      this.#_eventHandlers[event] = sortedHandlers;
    }
  }

  // Execute a lifecycle event
  async executeLifecycleEvent(event, params = {}) {
    if (!this.#_lifecycle[event]) {
      console.error('Lifecycle event not found:', event);
      throw new Error(`Lifecycle event not found: ${event}`);
    }
    const lifecycleEventHandler = this.#_lifecycle[event];
    for (const handler of this.#_eventHandlers[event]) {
      try {
        await handler.execute(event, params);
      } catch (e) {
        console.error('Lifecycle event handler error:', e);
        throw e;
      }
    }
    return lifecycleEventHandler.resolve();
  }

  // Configure the instance
  async configure(config = Config.defaultConfig) {
    await this.executeLifecycleEvent('CONFIGURING');
    this.#_config = { ...config };
    this.#_validateConfig();
    try {
      await this.executeLifecycleEvent('CONFIGURED');
      console.log('Configuration applied');
    } catch (e) {
      console.error('Configuration error:', e);
      throw e;
    }
  }

  // Load the instance
  async load() {
    if (!this.#_lifecycle.loaded) {
      try {
        await this.executeLifecycleEvent('LOADING');
        console.log('Loading...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Loading complete...');
        await this.executeLifecycleEvent('LOADED');
      } catch (e) {
        console.error('Load error:', e);
        throw e;
      }
    }
  }

  // Shutdown the instance
  async shutdown() {
    if (this.#_lifecycle.shuttingDown) return;
    try {
      await this.executeLifecycleEvent('SHUTTING_DOWN');
      console.log('Shutdown initiated...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Shutdown complete...');
      this.#_lifecycle.shuttingDown = true;
      await this.executeLifecycleEvent('SHUTDOWN');
    } catch (e) {
      console.error('Shutdown error:', e);
      throw e;
    }
  }

  // Start the instance
  async start() {
    for (const method of ['configure', 'load']) {
      if (this[method] instanceof Function) {
        await this[method]();
      }
    }
  }

  // Destroy the instance
  async destroy() {
    if (!this.#_lifecycle.destroying) {
      try {
        this.#_lifecycle.destroying = true;
        await this.executeLifecycleEvent('DESTROYING');
        this.#_lifecycle = {
          configured: false,
          loaded: false,
          shuttingDown: false,
          destroying: false
        };
        console.log('NexusCore instance destroyed.');
      } catch (e) {
        console.error('Destroy error:', e);
        throw e;
      }
    }
  }
}

// Define a singleton class for JSON schema validation
JSONSchemaValidator = JSONSchemaValidator || (class {}).extend(new (require('jsonschema').Validator)()) {}
JSONSchemaValidator.addType = JSONSchemaValidator.prototype.addType;
JSONSchemaValidator.checkSchema = JSONSchemaValidator.prototype.checkSchema;
JSONSchemaValidator.addSchema = JSONSchemaValidator.prototype.addSchema;
JSONSchemaValidator.validate = JSONSchemaValidator.prototype.validate;

// Create an instance of NexusCore
const nexusCore = NexusCore.instance;

// Listen for the 'DESTROYED' event
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
}, 0);

// Set the configuration
nexusCore.config = Config.defaultConfig;

// Start the instance
await nexusCore.start();

// Load the instance
await nexusCore.load();

// Shutdown the instance
await nexusCore.shutdown();

// Destroy the instance
await nexusCore.destroy();