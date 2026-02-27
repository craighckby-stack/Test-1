class ConfigSchema {
  static get schema() {
    return {
      type: 'object',
      properties: {
        VERSION: { type: 'string' },
        env: { type: 'string' },
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      },
      required: ['VERSION', 'env', 'foo', 'baz']
    };
  }
}

class ConfigManager {
  #schema = ConfigSchema.schema;

  async validate(config) {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.#schema);
      validator.validate(config, this.#schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get defaultConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development",
      foo: 'bar',
      baz: true
    };
  }
}

class Config extends ConfigManager {
  constructor(values = {}) {
    super();
    this.setValues(values);
  }

  setValues(values) {
    Object.assign(this, values);
    super.validate(values);
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
  #configManager = new Config();
  #LifecycleEventHandlers = new Map();

  #status = "INIT";
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  constructLifecycleEventHandlers() {
    this.#LifecycleEventHandlers.set("CONFIGURED", new LifecyleEvent("CONFIGURED"));
    this.#LifecycleEventHandlers.set("LOADED", new LifecycleEvent("LOADED"));
    this.#LifecycleEventHandlers.set("SHUTTING_DOWN", new LifecycleEvent("SHUTTING_DOWN"));
    this.#LifecycleEventHandlers.set("SHUTDOWN", new LifecycleEvent("SHUTDOWN"));
    this.#LifecycleEventHandlers.set("DESTROYED", new LifecycleEvent("DESTROYED"));
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    if (value !== 'INIT' && value !== 'DESTROYED' && value !== 'SHUTDOWN') {
      throw new Error(`${value} is not a valid status`);
    }
    this.#status = value;
    const currentValue = this.#status;
    const lifecycle = this.#lifecycle;
    if (value !== "INIT") {
      console.log(`NexusCore instance is ${value}.`);
      if (value === "SHUTDOWN") {
        this.#lifecycle.shuttingDown = false;
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
    this.#lifecycle.configured = true;
    this.#configManager.setValues(config);
  }

  validateConfig(config) {
    this.#configManager.validate(config);
  }

  onLifecycleEvent(event, handler) {
    if (this.#LifecycleEventHandlers.has(event)) {
      const lifeCycleEventHandler = new LifecycleHandler(handler);
      this.#LifecycleEventHandlers.get(event).handler = handler;
        lifeCycleEventHandler.bind(this);
      this.#LifecycleEventHandlers.set(event, lifeCycleEventHandler);
    }
  }

  get on() {
    return (event, handler) => {
      this.onLifecycleEvent(event, handler);
    };
  }

  executeLifecycleEvent(event) {
    if (this.#LifecycleEventHandlers.has(event)) {
      this.#LifecycleEventHandlers.get(event).execute();
    }
  }

  async load() {
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.executeLifecycleEvent("LOADED");
      this.status = "INIT";
    } catch (e) {
      console.error('Load error:', e);
      this.status = "DESTROYED";
    }
  }

  async shutdown() {
    try {
      await this.executeLifecycleEvent("SHUTTING_DOWN");
      this.status = "SHUTDOWN";
    } catch (e) {
      console.error("Shutdown error:", e);
      this.status = "DESTROYED";
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
    this.status = "INIT";
  }

  async destroy() {
    this.status = "DESTROYED";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
    this.#LifecycleEventHandlers.clear();
  }
}

const nexusCore = new NexusCore();
nexusCore.constructLifecycleEventHandlers();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();


This code:

- Creates advanced lifecycle management patterns using `LifecycleEvent` and `LifecycleHandler` classes to bind event handlers and execute them when lifecycle events occur.
- Enhances encapsulation using private fields and methods, as well as getters and setters to control access to these fields.
- Includes a `ConfigManager` class to manage and validate configuration data, and a `Config` class that extends `ConfigManager` to provide a simple configuration implementation.
- Creates a `NexusCore` class with advanced lifecycle management and validation, including `configure`, `load`, `shutdown`, `start`, and `destroy` methods.