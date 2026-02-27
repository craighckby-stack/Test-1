Here's the enhanced code:

class Config {
  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  #defaultConfig = {
    foo: 'bar',
    baz: true
  };

  #config = {};

  constructor(values = {}) {
    this.setConfig(values);
  }

  setConfig(values) {
    if (!this.validate(values)) {
      throw new Error('Invalid config values');
    }
    this.#config = { ...this.#defaultConfig, ...values };
  }

  validate(values) {
    try {
      const schema = this.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(values, schema);
      return true;
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get config() {
    return { ...this.#config, ...Config.staticConfig };
  }

  get defaultConfig() {
    return this.#defaultConfig;
  }

  get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' },
        ...Config.staticConfig
      }
    };
  }
}

class LifecycleEvent {
  constructor(event) {
    this.event = event;
  }
}

class LifecycleHandler {
  constructor(handler) {
    this.handler = handler;
  }

  bind(target) {
    return (event) => this.handler(event);
  }

  execute(event) {
    this.handler(event);
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

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    const lifecycle = this.#lifecycle;
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        lifecycle.shuttingDown = false;
      } else if (value === 'DESTROYED') {
        lifecycle.destroyed = true;
        lifecycle.configured = false;
        lifecycle.loaded = false;
        lifecycle.shuttingDown = false;
      }
    }
    if (currentValue !== 'INIT' && value === 'INIT') {
      lifecycle.configured = false;
      lifecycle.loaded = false;
    }
    if (value !== 'INIT' && currentValue !== 'INIT') {
      lifecycle.configured = true;
      lifecycle.loaded = true;
    }
    if (value !== 'INIT' && lifecycle.configured && value === 'LOAD' || value !== 'INIT' && lifecycle.configured === false && currentValue !== 'INIT' && value !== 'LOAD' && value !== 'START' && value !== 'DESTROY' ) {
      lifecycle.shuttingDown = false;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  configure(config, validate = true) {
    if (validate) {
      this.validateConfig(config);
    }
    this.#lifecycle.configured = true;
    this.config = config;
  }

  validateConfig(config) {
    if (!this.validateSchema(config)) {
      throw new Error('Invalid config');
    }
  }

  validateSchema(config) {
    try {
      const schema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(config, schema);
      return true;
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler);
    this.#lifecycle[event] = lifecycleHandler;
  }

  get on() {
    return (event, handler) => {
      const lifecycleEvent = new LifecycleEvent(event);
      this.onLifecycleEvent(event, handler);
    };
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }

  async load() {
    await this.executeLifecycleEvent("CONFIGURED");
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.executeLifecycleEvent("LOADED");
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      try {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        this.executeLifecycleEvent("SHUTTING_DOWN");
        console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      } catch (e) {
        console.error("Shutdown error:", e);
      }
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function && !this.#lifecycle.destroyed) {
        await this[methodName]();
      }
    }
    this.status = "RUNNING";
  }

  async destroy() {
    this.status = "DESTROYED";
    this.#lifecycle.destroyed = true;
    this.#lifecycle.configured = false;
    this.#lifecycle.loaded = false;
    this.#lifecycle.shuttingDown = false;
  }

  async on(event, handler) {
    await this.onLifecycleEvent(event, handler);
  }
}

class NexusCoreDecorator {
  #nexusCore;
  #logLevel = 'INFO';

  constructor(nexusCore) {
    this.#nexusCore = nexusCore;
  }

  get nexusCore() {
    return this.#nexusCore;
  }

  set logLevel(level) {
    this.#logLevel = level;
  }

  get logLevel() {
    return this.#logLevel;
  }

  enableLogging() {
    console.log(`Logging level set to ${this.#logLevel}.`);
  }
}

class NexusConfig {
  #nexusCore;
  #nexusConfig;

  constructor(nexusCore) {
    this.#nexusCore = nexusCore;
  }

  async init() {
    this.#nexusConfig = new Config();
    this.#nexusConfig.setConfig(Config.defaultConfig);
    await this.#nexusCore.configure(this.#nexusConfig.config);
  }
}

const nexusCore = new NexusCore();
const nexusConfig = new NexusConfig(nexusCore);
await nexusConfig.init();

nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});

nexusCore.start();

const nexusCoreDecorator = new NexusCoreDecorator(nexusCore);
nexusCoreDecorator.enableLogging();