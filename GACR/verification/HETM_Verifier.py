class Config {
  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  constructor(values = {}) {
    this.schema = Config.configSchema;
    this.defaults = Config.defaultConfig;
    this.initialValues = values;
    this._values = Object.assign({}, this.defaults, values);
  }

  setValues(values) {
    Object.assign(this._values, values);
  }

  validate() {
    const validator = new (require('jsonschema').Validator)();
    try {
      validator.checkSchema(this.schema);
      validator.validate(this._values, this.schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get values() {
    return this._values;
  }

  static get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      }
    };
  }

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
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

  bind(target = this) {
    this.handler = this.handler.bind(target);
  }

  execute() {
    this.handler();
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  #status = "INIT";

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

  configure(config) {
    this.validateConfig(config);
    this.onLifecycleEvent("CONFIGURED");
    this.#lifecycle.configured = true;
    this.config = config;
  }

  validateConfig(config) {
    const configSchema = Config.configSchema;
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
    try {
      await this.executeLifecycleEvent("CONFIGURED");
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
    } finally {
      this.#lifecycle.shuttingDown = false;
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

  set(config) {
    this.config = config;
    return this;
  }

  get config() {
    return this.config;
  }

  applyConfig(config) {
    Object.assign(this.config, config);
  }

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
nexusCore.configure(Config.defaultConfig);
nexusCore.set(Config.defaultConfig);
nexusCore.setValues({ foo: "baz", baz: false });
nexusCore.validate().then(() => console.log(nexusCore.config));
nexusCore.applyConfig({ foo: "bar" });
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();
console.log(nexusCore.toString());
console.log(nexusCore.toJSON());