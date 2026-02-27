class Config {
  #staticConfig = {
    VERSION: "1.0.0",
    env: process.env.NODE_ENV || "development"
  };

  #defaultConfig = {
    foo: 'bar',
    baz: true
  };

  #configSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    }
  };

  constructor(values = {}) {
    this.setValues(values);
  }

  setValues(values) {
    Object.assign(this, values);
  }

  get staticConfig() {
    return this.#staticConfig;
  }

  get defaultConfig() {
    return this.#defaultConfig;
  }

  get configSchema() {
    return this.#configSchema;
  }

  validate() {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.#configSchema);
      validator.validate(this, this.#configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }
}

class LifecycleEvent {
  #event;

  constructor(event) {
    this.#event = event;
  }

  get event() {
    return this.#event;
  }

  set event(value) {
    this.#event = value;
  }
}

class LifecycleHandler {
  #handler;

  constructor(handler) {
    this.#handler = handler;
  }

  bind(target = this) {
    this.#handler = this.#handler.bind(target);
  }

  execute() {
    this.#handler();
  }

  async on(config = this) {
    await config.onLifecycleEvent(this.#event, this.#handler);
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  #status = "INIT";

  #config = {};

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    const currentValue = this.#status;
    const lifecycle = this.#lifecycle;
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        lifecycle.shuttingDown = false;
      }
    }
    if (currentValue === 'INIT' && value !== 'INIT') {
      lifecycle.configured = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  get config() {
    return this.#config;
  }

  set config(value) {
    this.#config = value;
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
      this.#lifecycle[event].bind(this).on(this).execute();
    }
  }

  async configure(config = Config.defaultConfig) {
    try {
      this.validateConfig(config);
      this.onLifecycleEvent("CONFIGURED");
      this.#lifecycle.configured = true;
      this.config = config;
      this.executeLifecycleEvent("CONFIGURED");
    } catch (e) {
      console.error('Config error:', e);
      throw e;
    }
  }

  validateConfig(config) {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(config.configSchema);
      validator.validate(config, config.configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  async load() {
    try {
      if (this.#lifecycle.configured) {
        await this.executeLifecycleEvent("CONFIGURED");
        console.log("Loading...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Loading complete...");
        this.#lifecycle.loaded = true;
        this.executeLifecycleEvent("LOADED");
      }
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        this.executeLifecycleEvent("SHUTTING_DOWN");
        console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
  }

  async destroy() {
    this.status = "DESTROYED";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
    this.config = {};
  }

  async on(event, handler) {
    await this.onLifecycleEvent(event, handler);
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();