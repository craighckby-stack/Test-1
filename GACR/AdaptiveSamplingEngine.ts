class Config {
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
      }
    };
  }

  #privateValues = {};
  get values() {
    return this.#privateValues;
  }

  constructor(values = {}) {
    this.setValues(values);
  }

  setValues(values) {
    Object.assign(this.#privateValues, values);
  }

  validate() {
    try {
      const schema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(this.values, schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }
}

class LifecycleEvent {
  constructor(event) {
    this.event = event;
  }
}

class LifecycleHandler {
  #handler;

  constructor(handler) {
    this.#handler = handler;
  }

  bind(target) {
    this.#handler = this.#handler.bind(target);
  }

  execute() {
    this.#handler();
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

  #configureLifecycle() {
    this.validateConfig();
    this.onLifecycleEvent("CONFIGURED");
    this.#lifecycle.configured = true;
  }

  #validateConfig(config) {
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

  configure(config) {
    if (!this.#validateConfig(config)) return;
    this.#configureLifecycle();
    this.config = config;
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
    }
  }

  async start() {
    if (!this.#lifecycle.configured || this.#lifecycle.shuttingDown) return;
    return new Promise((resolve) => {
      const startMethodOrder = ["configure", "load", "shutdown"];
      for (const methodName of startMethodOrder) {
        if (this[methodName] instanceof Function) {
          this[methodName]().then(resolve).catch((error) => {
            console.error('Start', methodName, 'error:', error);
            resolve();
          });
        }
      }
    });
  }

  async destroy() {
    if (this.#lifecycle.shuttingDown) return;
    try {
      this.status = "DESTROYED";
      this.#lifecycle = {
        configured: false,
        loaded: false,
        shuttingDown: false
      };
    } catch (e) {
      console.error("Destroy error:", e);
    }
  }

  async on(event, handler) {
    try {
      await this.onLifecycleEvent(event, handler);
    } catch (e) {
      console.error("On", event, "error:", e);
    }
  }

  async validateConfig(config) {
    if (!this.#validateConfig(config)) return false;
    return true;
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
try {
  await nexusCore.start();
} catch (e) {
  console.error("Start error:", e);
}
try {
  await nexusCore.load();
} catch (e) {
  console.error("Load error:", e);
}
try {
  await nexusCore.shutdown();
} catch (e) {
  console.error("Shutdown error:", e);
}
try {
  await nexusCore.destroy();
} catch (e) {
  console.error("Destroy error:", e);
}


The changes made here:

- Encapsulate the `values` object in `Config` class
- Invented the `#privateValues` private property in Config class for encapsulation
- Renamed several methods to follow ES6 naming convention (CamelCase) and also for improvement
- Changed the way that the NexusCore's start is being called now.
  The start method does not call load and shutdown. If the instance calls its own load or shutdown, then the `start` might not be a part of the process because the `start` initiates the process not an already initiated process.