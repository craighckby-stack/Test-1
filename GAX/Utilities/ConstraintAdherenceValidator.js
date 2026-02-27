class Config {
  #values = {};

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
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(configSchema);
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
      }
    };
  }

  get values() {
    return { ...this.#values };
  }

  setValues(values) {
    this.#setValues(values);
  }
}

class LifecycleEvent {
  constructor(event) {
    this.event = event;
  }
}

class LifecycleHandler {
  #target = null;

  constructor(handler) {
    this.handler = handler;
  }

  bind(target = this) {
    this.#target = target;
    this.handler = this.handler.bind(target);
  }

  execute() {
    this.handler.call(this.#target);
  }
}

class NexusCore {
  #status = "INIT";
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };
  #config = {};
  #eventHandlers = {};

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    const currentValue = this.#status;
    const config = this.#lifecycle;
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        config.shuttingDown = false;
      }
    }
    if (currentValue === 'INIT' && value !== 'INIT') {
      config.configured = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  get config() {
    return { ...this.#config };
  }

  set config(value) {
    this.#config = value;
    this.#validateConfig();
    this.#lifecycle.configured = true;
  }

  #validateConfig() {
    try {
      const configSchema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(configSchema);
      validator.validate(this.#config, configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  on(event, handler) {
    if (!this.#eventHandlers[event]) {
      this.#eventHandlers[event] = [];
    }
    const eventHandler = new LifecycleHandler(handler);
    eventHandler.bind(this);
    this.#eventHandlers[event].push(eventHandler);
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].handler();
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
    this.#config = {};
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();