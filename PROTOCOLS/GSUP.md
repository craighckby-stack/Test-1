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

  get defaultConfigValue() {
    return JSON.stringify(this.defaultConfig);
  }

  get defaultConfigValidator() {
    return async (configString) => {
      const configValue = JSON.parse(configString);
      await this.validate(configValue);
    };
  }

  constructor() {
    this.#config = { ...this.defaultConfig };
  }

  setConfig(values) {
    this.#config = { ...this.#config, ...values };
  }

  setConfigValue(configString) {
    this.setConfig(JSON.parse(configString));
  }

  async validate(config) {
    try {
      const schema = this.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(config, schema);
      return true;
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get config() {
    return { ...this.#config };
  }
}

class LifecycleHandler {
  #event;
  #handler;

  constructor(event, handler) {
    this.#event = event;
    this.#handler = handler;
  }

  execute(target = this) {
    this.#handler.call(target);
  }

  bind(target = this) {
    this.#handler = this.#handler.bind(target);
  }
}

class LifecycleEvent {
  constructor(event, handler) {
    this.#event = event;
    this.#handler = handler;
  }

  get event() {
    return this.#event;
  }

  get handler() {
    return this.#handler;
  }

  execute(target = this) {
    this.#handler.call(target);
  }
}

class ConfigFactory {
  #configClass;

  constructor(configClass) {
    this.#configClass = configClass;
  }

  createDefaultConfig() {
    return this.#configClass.defaultConfig;
  }

  createConfig(configString) {
    const config = this.createDefaultConfig();
    JSON.parse(configString, (key, value) => {
      config[key] = value;
      return value;
    });
    return config;
  }
}

class NexusCore {
  #configClass;
  #status = "INIT";
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    destroying: false
  };
  #eventHandlers = new Map();
  #configFactory;

  constructor(configClass) {
    this.#configClass = configClass;
    this.#configFactory = new ConfigFactory(configClass);
  }

  get configClass() {
    return this.#configClass;
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
    if (value === 'DESTROY') {
      lifecycle.destroying = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  #validateConfig(config) {
    return new Promise((resolve, reject) => {
      const configSchema = this.configClass.configSchema;
      try {
        const validator = new (require('jsonschema').Validator)();
        validator.checkSchema(configSchema);
        validator.validate(config, configSchema);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  async configure(configString) {
    if (!this.#lifecycle.configured) {
      const defaultConfig = this.#configFactory.createDefaultConfig();
      await this.#validateConfig(defaultConfig);

      const configValue = this.#configFactory.createConfig(configString);
      await this.#validateConfig(configValue);

      await this.onLifecycleEvent("CONFIGURED", new LifecycleEvent("CONFIGURED", async () => {
        this.#lifecycle.configured = true;
        this.#configFactory.setConfigValue(configString);
        await this.executeLifecycleEvent("CONFIGURED");
        console.log("NexusCore instance configured.");
      }));
    }
  }

  get configure() {
    return async (configString) => {
      await this.configure(configString);
    }
  }

  async on(event, handler) {
    const eventHandler = new LifecycleHandler(event, handler);
    return await this.onLifecycleEvent(event, eventHandler);
  }

  get on() {
    return async (event, handler) => {
      await this.on(event, handler);
    }
  }

  async onLifecycleEvent(event, handler) {
    if (this.#eventHandlers.has(event)) {
      const existingHandlers = this.#eventHandlers.get(event);
      existingHandlers.push(handler);
      this.#eventHandlers.set(event, existingHandlers);
    } else {
      this.#eventHandlers.set(event, [handler]);
    }
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
    if (this.#lifecycle.destroying) {
      await this.destroy();
    }
  }

  async executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
    if (this.#eventHandlers.has(event)) {
      for (const lifecycleHandler of this.#eventHandlers.get(event)) {
        lifecycleHandler.bind(this).execute();
      }
    }
    if (this.#lifecycle[`${event}_DING`]) {
      await this.destroy();
    }
  }

  async load() {
    try {
      await this.onLifecycleEvent("LOADED", new LifecycleEvent("LOADED", async () => {
        console.log("Loading...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Loading complete...");
        this.#lifecycle.loaded = true;
        await this.executeLifecycleEvent("LOADED");
      }));
    } catch (e) {
      console.error('Load error:', e);
      await this.onLifecycleEvent("LOAD_FAILED", new LifecycleEvent("LOAD_FAILED", async () => {
        console.error('Load failed.');
        await this.destroy();
      }));
    }
  }

  get load() {
    return async () => {
      await this.load();
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        await this.onLifecycleEvent("SHUTTING_DOWN", new LifecycleEvent("SHUTTING_DOWN", async () => {
          console.log("Shutdown complete...");
          this.status = "SHUTDOWN";
        }));
      } else {
        console.log("Shutdown already initiated.");
      }
    } catch (e) {
      console.error("Shutdown error:", e);
      await this.destroy();
    }
  }

  get shutdown() {
    return async () => {
      await this.shutdown();
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
    this.status = "RUNNING";
  }

  async destroy() {
    this.status = "DESTROY";
    this.#lifecycle.destroying = true;
    this.#eventHandlers.clear();
  }
}

const Config = {
  defaultConfig: {
    foo: 'bar',
    baz: true
  },
  configSchema: {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    }
  }
};

const nexusCore = new NexusCore(Config);
nexusCore.on('DESTROYED', async () => {
  console.log("NexusCore instance destroyed.");
}).on('LOADED', async () => {
  console.log("NexusCore instance loaded.");
}).on('SHUTTING_DOWN', async () => {
  console.log("NexusCore instance shutting down.");
});
await nexusCore.configure(`{"foo": "new_value", "baz": false}`);
await nexusCore.start();
await nexusCore.load();
await nexusCore.shutdown();
await nexusCore.destroy();