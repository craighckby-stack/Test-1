class Config {
  #values;

  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development",
    };
  }

  private constructor(values = {}) {
    this.#values = { ...Config.defaultConfig, ...values };
  }

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true,
    };
  }

  static get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' },
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
    if (this.#handler instanceof Function) {
      this.#handler.call(this.#target);
    }
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
  #initialized;
  #started;

  private constructor() {
    this.#config = Config.create({});
    this.#lifecycle = new EventManager();
    this.#status = "INIT";
    this.#initialized = false;
    this.#started = false;
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
      this.#lifecycle.emit(value, this);
    }
  }

  get initialized() {
    return this.#initialized;
  }

  get started() {
    return this.#started;
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  configure(config) {
    if (this.initialized) {
      throw new Error("Cannot configure initialized application");
    }
    this.validateConfig(config);
    this.#config.setValues(config);
    this.#lifecycle.emit("CONFIGURED", config);
    this.#initialized = true;
  }

  validateConfig(config) {
    Config.validate(config, Config.configSchema);
  }

  get config() {
    return this.#config;
  }

  load() {
    if (!this.initialized) {
      throw new Error("Cannot load the application first");
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log("Loading complete...");
        this.#lifecycle.emit("LOADED", this);
        this.#started = true;
        resolve();
      }, 1000);
    });
  }

  async shutdown() {
    if (!this.initialized) {
      throw new Error("Application is not initialized");
    }
    if (!this.started) {
      throw new Error("Application has not been started");
    }
    console.log("Shutdown initiated...");
    this.#lifecycle.emit("SHUTTING_DOWN", this);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Shutdown complete...");
    this.status = "SHUTDOWN";
  }
}

class Lifecycle {
  #application;
  #startMethods;

  private constructor(application) {
    this.#application = application;
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
  #status;
  #initialized;
  #initializedResolve;

  get startupPromise() {
    return new Promise(resolve => {
      this.#initializedResolve = resolve;
    });
  }

  private constructor() {
    this.#application = new Application();
    this.#lifecycle = new Lifecycle(this.#application);
    this.#status = "INIT";
    this.#initialized = false;
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
    this.#initialized = true;
    this.#initializedResolve();
  }

  destroy() {
    this.status = "DESTROYED"
    this.#application = null;
    this.#lifecycle = null;
    this.#initializedResolve = null;
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