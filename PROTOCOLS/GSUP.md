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

  get staticConfig() {
    return this.#staticConfig;
  }

  get defaultConfig() {
    return { ...this.#defaultConfig };
  }

  get configSchema() {
    return this.#configSchema;
  }

  constructor() {
    this.values = { ...this.defaultConfig };
  }

  setValues(values) {
    this.values = { ...this.defaultConfig, ...values };
  }

  async validate() {
    try {
      const schema = this.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(this.values, schema);
      return true;
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
  constructor(handler) {
    this.handler = handler;
  }

  bind(target = this) {
    this.handler = this.handler.bind(target);
  }

  execute(target = this) {
    this.handler.call(target);
  }
}

class NexusCore {
  #status = "INIT";
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };
  #config;
  #eventHandlers = new WeakMap();

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

  async configure(config) {
    await this.validateConfig(config);
    this.onLifecycleEvent("CONFIGURED");
    this.#lifecycle.configured = true;
    this.config = config;
    await this.executeLifecycleEvent("CONFIGURED");
  }

  async validateConfig(config) {
    const configSchema = this.configSchema;
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(configSchema);
      validator.validate(config, configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  on(event, handler) {
    return (async () => {
      return this.onLifecycleEvent(event, handler);
    })();
  }

  get on() {
    return (event, handler) => {
      return this.on(event, handler);
    }
  }

  async onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler);
    if (this.#eventHandlers.has(event)) {
      const existingHandlers = this.#eventHandlers.get(event);
      existingHandlers.push(lifecycleHandler);
      this.#eventHandlers.set(event, existingHandlers);
    } else {
      this.#eventHandlers.set(event, [lifecycleHandler]);
    }
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
    this.executeLifecycleEvent(event);
  }

  async executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
    if (this.#eventHandlers.has(event)) {
      for (const lifecycleHandler of this.#eventHandlers.get(event)) {
        lifecycleHandler.bind(this).execute(this);
      }
    }
  }

  async load() {
    await this.executeLifecycleEvent("CONFIGURED");
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      await this.executeLifecycleEvent("LOADED");
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        await this.executeLifecycleEvent("SHUTTING_DOWN");
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
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
}).on('LOADED', () => {
  console.log("NexusCore instance loaded.");
}).on('SHUTTING_DOWN', () => {
  console.log("NexusCore instance shutting down.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();