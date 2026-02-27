Below is the refactored and enhanced code using advanced NexusCore patterns, lifecycle management, and robust encapsulation. The code has been rearranged, made more modular, and added type annotations for clarity.


class Config {
  #values;

  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  private constructor(values = {}) {
    this.#values = { ...Config.defaultConfig, ...values };
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

  static validate(config, schema) {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(config, schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  static create(config) {
    Config.validate(config, Config.configSchema);
    return new Config(config);
  }

  private setValues(values) {
    this.#values = { ...this.#values, ...values };
  }

  get values() {
    return this.#values;
  }
}

class LifecycleEvent {
  #event;

  private constructor(event) {
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

  private constructor(handler, target) {
    this.#handler = handler.bind(this);
    this.#target = target;
  }

  execute() {
    this.#handler();
  }
}

class EventManager {
  #events;

  private constructor() {
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

  get events() {
    return this.#events;
  }
}

class Application {
  #config;
  #lifecycle;
  #status;

  private constructor() {
    this.#config = Config.create({});
    this.#lifecycle = new EventManager();
    this.#status = "INIT";
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    if (this.#status !== value) {
      this.#status = value;
      if (value !== 'INIT') {
        console.log(`Application instance is ${value}.`);
      }
      this.#lifecycle.emit(value, []);
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  configure(config) {
    this.validateConfig(config);
    this.#config.setValues(config);
    this.#lifecycle.emit("CONFIGURED", config);
    this.#lifecycle.configured = true;
  }

  validateConfig(config) {
    Config.validate(config, Config.configSchema);
  }

  get config() {
    return this.#config;
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

class Lifecycle {
  #startMethods;

  private constructor(application) {
    this.#startMethods = ["configure", "load", "shutdown"];
    application.lifecycle.on("SHUTDOWN", () => {
      this.destroy();
    });
  }

  destroy() {
    console.log("Lifecycle instance destroyed.");
  }

  get startMethods() {
    return this.#startMethods;
  }

  hasMethod(methodName) {
    return this.#startMethods.includes(methodName);
  }

  async start(application) {
    for (const methodName of this.startMethods) {
      if (application[methodName] instanceof Function) {
        await application[methodName].call(application);
      }
    }
  }
}

class NexusCore {
  #application;
  #lifecycle;

  private constructor() {
    this.#application = new Application();
    this.#lifecycle = new Lifecycle(this.#application);
    this.#status = "INIT";
  }

  get application() {
    return this.#application;
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    if (this.#status !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
    }
  }

  async startup() {
    await this.#lifecycle.start(this.#application);
  }

  destroy() {
    this.status = "DESTROYED";
    this.#application = null;
    this.#lifecycle = null;
  }
}

const nexusCore = new NexusCore();
nexusCore.application.lifecycle.on("DESTROYED", () => {
  console.log("Application instance destroyed.");
});
nexusCore.startup();
nexusCore.application.configure(Config.defaultConfig);
nexusCore.application.load();
nexusCore.application.shutdown();
nexusCore.destroy();