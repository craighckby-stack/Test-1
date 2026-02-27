class Config {
  #values = {};

  /**
   * Creates an instance of Config.
   * @param {Object} values Optional configuration values.
   */
  constructor(values = {}) {
    this.#setValues(values);
    this.#validateConfig();
  }

  #setValues(values) {
    Object.assign(this.#values, values);
  }

  #validateConfig() {
    try {
      const configSchema = Config.configSchema;
      const validator = new JSONSchemaValidator();
      validator.addSchema(configSchema);
      validator.validate(this.#values, configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
  }

  static get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      },
      required: ['foo', 'baz']
    };
  }

  get values() {
    return { ...this.#values };
  }

  set values(value) {
    this.#setValues(value);
  }
}

class LifecycleEvent extends Error {
  constructor(event, message = '') {
    super(message);
    this.name = 'LifecycleEvent';
    this.event = event;
  }
}

class LifecycleHandler {
  #target = null;
  #event = null;
  #handler = null;

  constructor(handler) {
    this.handler = handler;
  }

  bind(target = this, event = this.event, handler = this.handler) {
    this.#target = target;
    this.#handler = handler;
    this.event = event;
    this.handler = handler.bind(target);
  }

  execute() {
    this.handler.call(this.#target, this.event);
  }
}

class NexusCore {
  #staticInstance = null;
  #status = 'INIT';
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    destroying: false
  };
  #config = {};
  #eventHandlers = {};

  static get instance() {
    if (!this.#staticInstance) {
      this.#staticInstance = new NexusCore();
    }
    return this.#staticInstance;
  }

  constructor() {
    if (this.constructor === NexusCore) {
      throw new Error('NexusCore instance is not singleton');
    }
  }

  get status() {
    return this.#status;
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  get config() {
    return { ...this.#config };
  }

  set config(value) {
    if (!Object.prototype.hasOwnProperty.call(value, 'type')) {
      console.error('Invalid config type:', value);
      throw new Error(`Invalid config type: ${value}`);
    }
    this.#config = value;
    this.#validateConfig();
    this.#lifecycle.configured = true;
  }

  #validateConfig() {
    try {
      const configSchema = Config.configSchema;
      const validator = new JSONSchemaValidator();
      validator.addSchema(configSchema);
      validator.validate(this.#config, configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  on(event, handler, priority) {
    if (event instanceof LifecycleEvent) {
      const lifecycleEvent = event;
      event = lifecycleEvent.event;
    }
    if (!this.#eventHandlers[event]) {
      this.#eventHandlers[event] = [];
    }
    const eventHandler = new LifecycleHandler(handler);
    eventHandler.bind(this, event, handler);
    this.#eventHandlers[event].push(eventHandler);
    if (priority > 0 && this.#eventHandlers[event].length > 1) {
      const handlerCount = this.#eventHandlers[event].length;
      const sortedHandlers = this.#eventHandlers[event].sort((a, b) => b.priority - a.priority);
      while (sortedHandlers.length > handlerCount) {
        sortedHandlers.pop();
      }
      this.#eventHandlers[event] = sortedHandlers;
    }
  }

  executeLifecycleEvent(event, params = {}) {
    if (!this.#lifecycle[event]) {
      console.error('Lifecycle event not found:', event);
      throw new Error(`Lifecycle event not found: ${event}`);
    }
    const lifecycleEventHandler = this.#lifecycle[event];
    for (const handler of this.#eventHandlers[event]) {
      try {
        handler.execute(event, params);
      } catch (e) {
        console.error('Lifecycle event handler error:', e);
        throw e;
      }
    }
    return lifecycleEventHandler.resolve();
  }

  async configure(config = Config.defaultConfig) {
    await this.executeLifecycleEvent('CONFIGURING');
    this.#config = { ...config };
    this.#validateConfig();
    try {
      await this.executeLifecycleEvent('CONFIGURED');
      console.log('Configuration applied');
    } catch (e) {
      console.error('Configuration error:', e);
      throw e;
    }
  }

  async load() {
    if (!this.#lifecycle.loaded) {
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

  async shutdown() {
    if (this.#lifecycle.shuttingDown) return;
    try {
      await this.executeLifecycleEvent('SHUTTING_DOWN');
      console.log('Shutdown initiated...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Shutdown complete...');
      this.#lifecycle.shuttingDown = true;
      await this.executeLifecycleEvent('SHUTDOWN');
    } catch (e) {
      console.error('Shutdown error:', e);
      throw e;
    }
  }

  async start() {
    for (const method of ['configure', 'load']) {
      if (this[method] instanceof Function) {
        await this[method]();
      }
    }
  }

  async destroy() {
    if (!this.#lifecycle.destroying) {
      try {
        this.#lifecycle.destroying = true;
        await this.executeLifecycleEvent('DESTROYING');
        this.#lifecycle = {
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

JSONSchemaValidator = JSONSchemaValidator || (class {}).extend(new (require('jsonschema').Validator)()) {}
JSONSchemaValidator.addType = JSONSchemaValidator.prototype.addType;
JSONSchemaValidator.checkSchema = JSONSchemaValidator.prototype.checkSchema;
JSONSchemaValidator.addSchema = JSONSchemaValidator.prototype.addSchema;
JSONSchemaValidator.validate = JSONSchemaValidator.prototype.validate;

const nexusCore = NexusCore.instance;
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
}, 0);
nexusCore.config = Config.defaultConfig;
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();