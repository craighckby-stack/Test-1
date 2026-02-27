// @ts-check

class Config {
  /**
   * Get the static configuration
   */
  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  /**
   * Get the default configuration
   */
  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
  }

  /**
   * Get the configuration validation schema
   */
  static get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      }
    };
  }

  /**
   * Validate the configuration against the schema
   */
  validate() {
    try {
      const schema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(this, schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }
}

class LifecycleEvent {
  /**
   * @param {string} event 
   */
  constructor(event) {
    this.event = event;
  }
}

class LifecycleHandler {
  /**
   * @param {function} handler 
   */
  constructor(handler) {
    this.handler = handler;
  }

  /**
   * Bind the handler to the specified context
   * @param {object} context 
   */
  bind(context = this) {
    this.handler = this.handler.bind(context);
  }

  /**
   * Execute the handler
   */
  execute() {
    this.handler();
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    destroyed: false
  };

  #status = "INIT";

  /**
   * Get the lifecycle status
   *
   * @returns {string} The status of the nexuscore lifecycle
   */
  get status() {
    return this.#status;
  }

  /**
   * Set the lifecycle status
   *
   * @param {string} value The new status value
   */
  set status(value) {
    this.#status = value;
    const currentValue = this.#status;
    const lifecycle = this.#lifecycle;
    console.log(`NexusCore instance is ${value} and lifecycle is ${JSON.stringify(this.#lifecycle)}`);
    if (value !== 'INIT' && value !== 'DESTROYED') {
      if (value === 'SHUTDOWN') {
        lifecycle.shuttingDown = false;
      }
      lifecycle[value] = true;
      this.#lifecycle = { ...lifecycle };
    }
    if (currentValue === 'INIT' && value !== 'INIT' && value !== 'DESTROYED') {
      lifecycle.configured = true;
      this.#lifecycle = { ...lifecycle };
    }
    if (currentValue === 'SHUTDOWN' && value === 'DESTROYED') {
      lifecycle.destroyed = true;
    }
  }

  /**
   * Get the lifecycle object
   *
   * @returns {object} The lifecycle object
   */
  get lifecycle() {
    return this.#lifecycle;
  }

  /**
   * Configure the NexusCore instance with a specific configuration
   *
   * @param {object} config The configuration
   */
  configure(config) {
    this.validateConfig(config);
    this.onLifecycleEvent("CONFIGURED");
    this.#lifecycle.configured = true;
    this.config = config;
  }

  /**
   * Validate a provided configuration against the schema
   *
   * @param {object} config The configuration
   */
  validateConfig(config) {
    const configSchema = Config.configSchema;
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(configSchema);
      validator.validate(config, configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  /**
   * Register a lifecycle event handler
   *
   * @param {string} event The event
   * @param {function} [handler] The handler
   */
  onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler);
    if (!this.#lifecycle[event]) {
      this.#lifecycle[event] = lifecycleHandler;
    }
  }

  /**
   * Execute a lifecycle event handler
   *
   * @param {string} event The event
   * @param {object} [context] The context
   */
  async executeLifecycleEvent(event, context = this) {
    if (this.#lifecycle[event]) {
      await this.#lifecycle[event].bind(context).execute();
    }
  }

  /**
   * Load the NexusCore instance, wait for a specified duration and then transition to the 'Loaded' state
   *
   * @param {number} duration The duration
   */
  async load(duration = 1000) {
    await this.executeLifecycleEvent("CONFIGURED");
    try {
      console.log("Loading for " + duration + "ms...");
      await new Promise(resolve => setTimeout(resolve, duration));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      await this.executeLifecycleEvent("LOADED");
    } catch (e) {
      console.error("Load error:", e);
    }
  }

  /**
   * Shut down the NexusCore instance, triggering the 'Shutting Down' and then 'Shutdown' lifecycle events
   */
  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        await this.executeLifecycleEvent("SHUTTING_DOWN");
        console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  /**
   * Start the NexusCore instance by initializing the lifecycle sequence
   */
  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    this.config = Object.assign({}, Config.defaultConfig);
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        try {
          await this[methodName]();
        } catch (e) {
          console.error("Failed to start NexusCore instance:", e);
        }
      }
    }
  }

  /**
   * Destroy the NexusCore instance, transitioning to the 'Destroyed' state
   */
  async destroy() {
    this.status = "DESTROYED";
    this.#lifecycle.destroyed = true;
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      destroyed: true
    };
  }
}

// Example usage:
const nexusCore = new NexusCore();
/**
 * Lifecycle event handler for the 'DESTROYED' event
 */
nexusCore.on('DESTROYED', () => console.log("NexusCore instance destroyed."));
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load(10000);
nexusCore.shutdown();
nexusCore.destroy();