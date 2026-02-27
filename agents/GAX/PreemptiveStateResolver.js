class Config {
  #values;

  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  constructor(values = {}) {
    this.#values = { ...Config.defaultConfig, ...values };
  }

  setValues(values) {
    this.#values = { ...this.#values, ...values };
  }

  get values() {
    return this.#values;
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
      }
    };
  }

  validate() {
    try {
      const schema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(this.#values, schema);
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
  #target;

  constructor(handler, target) {
    this.#handler = handler.bind(this);
    this.#target = target;
  }

  execute() {
    this.#handler();
  }
}

class EventManager {
  #events;

  constructor() {
    this.#events = {};
  }

  on(type, handler) {
    if (!this.#events[type]) {
      this.#events[type] = [];
    }
    this.#events[type].push(handler);
  }

  emit(type, ...args) {
    if (this.#events[type]) {
      this.#events[type].forEach(handler => handler(...args));
    }
  }
}

class Application {
  #config = new Config();
  #lifecycle = new EventManager();

  constructor() {
    this.#status = "INIT";
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    if (value !== 'INIT') {
      console.log(`Application instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        this.#lifecycle.emit("SHUTDOWN", []);
      }
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  configure(config) {
    this.validateConfig(config);
    this.#config.values = config;
    this.#lifecycle.emit("CONFIGURED", config);
    this.#lifecyle.configured = true;
  }

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

  load() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log("Loading complete...");
        this.#lifecycle.emit("LOADED");
        resolve();
      }, 1000);
    });
  }

  async shutdown() {
    if (!this.#lifecycle.configured) {
      throw new Error("Application is not configured");
    }
    console.log("Shutdown initiated...");
    this.#lifecycle.emit("SHUTTING_DOWN");
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Shutdown complete...");
    this.status = "SHUTDOWN";
  }
}

class NexusCore {
  #application;

  constructor() {
    this.#application = new Application();
    this.#lifecycle = new EventManager();
    this.#status = "INIT";
  }

  get application() {
    return this.#application;
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        this.#lifecycle.emit("SHUTDOWN", []);
      }
    }
  }

  start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        this[methodName]();
      }
    }
  }

  async startup() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
  }

  destroy() {
    this.status = "DESTROYED";
    this.#application = null;
  }
}

const nexusCore = new NexusCore();
nexusCore.application.on("DESTROYED", () => {
  console.log("Application instance destroyed.");
});
nexusCore.start();
nexusCore.application.configure(Config.defaultConfig);
nexusCore.startup();
nexusCore.application.load();
nexusCore.application.shutdown();
nexusCore.destroy();