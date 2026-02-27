class Config {
  static #configSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    }
  };

  static #defaultConfig = {
    foo: 'bar',
    baz: true
  };

  static get staticConfig() {
    return Config.#configSchema;
  }

  constructor(values = {}) {
    this.#defaults = Config.#defaultConfig;
    this.#initialValues = values;
    this.#_values = { ...this.#defaults, ...values };
  }

  setValues(values) {
    this.#_values = Object.assign({}, this.#defaults, values);
  }

  validate() {
    const validator = new (require('jsonschema').Validator)();
    try {
      validator.checkSchema(Config.#configSchema);
      validator.validate(this.#_values, Config.#configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get values() {
    return this.#_values;
  }

  merge(values) {
    this.#_values = Object.assign({}, this.#_values, values);
  }

  apply(values) {
    this.setValues(values);
    this.validate();
  }
}

class LifecycleEvent {
  constructor(event) {
    this.#event = event;
  }

  get event() {
    return this.#event;
  }
}

class LifecycleHandler {
  constructor(handler) {
    this.#handler = handler;
  }

  bind(target = this) {
    this.#handler = this.#handler.bind(target);
  }

  execute() {
    this.#handler();
  }
}

class NexusCore {
  #lifecycle = {
    CONFIGURED: null,
    LOADED: null,
    SHUTTING_DOWN: null,
    SHUTDOWN: null,
    DESTROYED: null
  };

  #status = "INIT";

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    this.#updateLifecycleStatus(value);
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  configure(config) {
    this.validateConfig(config);
    this.#lifecycle.CONFIGURED = new LifecycleHandler(() => {
      this.#lifecycle.CONFIGURED.bind(this).execute();
    });
    this.#lifecycle.CONFIGURED.execute();
    this.#lifecycle.CONFIGURED = new LifecycleHandler(() => {
      this.#updateLifecycleStatus("CONFIGURED");
    });
    this.#lifecycle.CONFIGURED.execute();
    this.config = config;
  }

  validateConfig(config) {
    const configSchema = Config.#configSchema;
    const validator = new (require('jsonschema').Validator)();
    try {
      validator.checkSchema(configSchema);
      validator.validate(config, configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  onLifecycleEvent(event, handler) {
    this.#lifecycle[event] = new LifecycleHandler(handler);
  }

  on(event, handler) {
    this.onLifecycleEvent(event, handler);
  }

  get on() {
    return (event, handler) => {
      this.onLifecycleEvent(event, handler);
    };
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }

  #updateLifecycleStatus(status) {
    const lifecycle = this.#lifecycle;
    if (lifecycle.CONFIGURED && status === "CONFIGURED") {
      lifecycle.CONFIGURED = null;
    }
    if (lifecycle.LOADED && status === "LOADED") {
      lifecycle.LOADED = null;
    }
    if (lifecycle.SHUTTING_DOWN && status === "SHUTTING_DOWN") {
      lifecycle.SHUTTING_DOWN = null;
    }
    if (lifecycle.SHUTDOWN && status === "SHUTDOWN") {
      lifecycle.SHUTDOWN = null;
    }
    if (lifecycle.DESTROYED && status === "DESTROYED") {
      lifecycle.DESTROYED = null;
    }
  }

  async load() {
    try {
      this.executeLifecycleEvent("CONFIGURED");
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.executeLifecycleEvent("LOADED");
      this.status = "LOADED";
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.SHUTTING_DOWN) {
        console.log("Shutdown initiated...");
        this.#lifecycle.SHUTTING_DOWN = new LifecycleHandler(() => {
          this.#updateLifecycleStatus("SHUTTING_DOWN");
        });
        this.#lifecycle.SHUTTING_DOWN.execute();
        this.status = "SHUTTING_DOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    } finally {
      this.#lifecycle.SHUTTING_DOWN = null;
      this.status = "SHUTDOWN";
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
      CONFIGURED: null,
      LOADED: null,
      SHUTTING_DOWN: null,
      SHUTDOWN: null,
      DESTROYED: new LifecycleHandler(() => {
        this.#updateLifecycleStatus("DESTROYED");
      })
    };
    this.#lifecycle.DESTROYED.execute();
    this.config = null;
  }

  async applyConfig(config) {
    try {
      this.config = Config.#defaultConfig;
      this.applyConfigHelper(config);
      this.validateConfig(this.config);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  applyConfigHelper(values) {
    this.config = {
      ...Config.#defaultConfig,
      ...this.config,
      ...values
    };
    this.config = Config.#defaultConfig;
    Config.#merge(this.config, values);
    this.config = {
      ...this.config,
      ...values
    };
  }

  #merge = (target, source) => {
    Object.assign(target, source);
  };

  toString() {
    return `NexusCore { id: ${this.constructor.name}, status: ${this.status} }`;
  }

  toJSON() {
    return {
      status: this.status,
      lifecycle: this.#lifecycle,
      config: this.config
    };
  }
}



const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.#defaultConfig);
nexusCore.applyConfig({ foo: "bar" });
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();
console.log(nexusCore.toString());
console.log(nexusCore.toJSON());

Note that the `Config` class has been updated to use static properties and methods, and the `NexusCore` class has been updated to use private properties and methods using the `#` symbol. The `applyConfig` method in `NexusCore` has also been updated to use a helper method for merging the default config with the provided config. Additionally, the `start` method in `NexusCore` has been updated to use an array to iterate over the methods to be called in order.