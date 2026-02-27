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

  constructor() {
    this.#config = { ...this.#defaultConfig, ...this.#staticConfig };
  }

  get staticConfig() {
    return this.#staticConfig;
  }

  get defaultConfig() {
    return { ...this.#defaultConfig, ...this.#staticConfig };
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

  setConfig(values) {
    const prev = this.#config;
    this.#config = { ...this.#config, ...values };
    this.#eventHandlers.run('CONFIG_UPDATED', prev, this.#config);
  }

  setConfigValue(configString) {
    this.setConfig(JSON.parse(configString));
  }

  get config() {
    return { ...this.#config };
  }

  get configValidator() {
    return this.defaultConfigValidator;
  }
}

Object.assign(Config.prototype, {
  on: async function(event, handler) {
    return await this.#eventHandlers.on(event, handler);
  },

  addEventHandler: function(event, callback) {
    this.#eventHandlers.push(event, callback);
  },

  run: async function(event, ...args) {
    const eventHandler = this.#eventHandlers.get(event);
    if (eventHandler instanceof Array) {
      for (const handler of eventHandler) {
        handler(this, ...args);
      }
    } else {
      this.#eventHandlers.run(event, ...args);
    }
  },

  validate: this.validate,
});

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

  bind(target = this) {
    this.#handler = this.#handler.bind(target);
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

class ConfigFactory {
  #configClass;

  constructor(configClass) {
    this.#configClass = configClass;
  }

  createDefaultConfig() {
    return { ...this.#configClass.prototype.defaultConfig, ...this.#configClass.prototype.staticConfig };
  }

  createConfig(configString) {
    const config = this.createDefaultConfig();
    Object.assign(config, JSON.parse(configString));
    return config;
  }
}

class NexusCore {
  #configClass;
  #configFactory;
  #status = "INIT";
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    destroying: false
  };
  #eventHandlers = new Map();
  #config;

  constructor(configClass) {
    this.#configClass = configClass;
    this.#configFactory = new ConfigFactory(configClass);
    this.#config = { ...this.#configFactory.createDefaultConfig() };
    this.#eventHandlers.push('CONFIG',
      {
        configure: async () => {
          const defaultConfig = this.#configFactory.createDefaultConfig();
          await this.#configClass.prototype.validate(defaultConfig);
          await this.#configClass.prototype.validate(this.#config);
        }
      },
    ).push('LOAD',
      {
        loaded: async () => {
          this.#lifecycle.loaded = true;
          this.#eventHandlers.run('LOADED', this.#config);
        }
      },
    ).push('SHUTTING_DOWN',
      {
        shuttingDown: async () => {
          this.#lifecycle.shuttingDown = true;
          this.#eventHandlers.run('SHUTTING_DOWN', this.#config);
        }
      },
    ).push('DESTROY',
      {
        destroying: async () => {
          this.#lifecycle.destroying = true;
          this.#eventHandlers.run('DESTROY', this.#config);
        }
      },
    );
  }

  get config() {
    return this.#config;
  }

  async configure(configString) {
    if (!this.#lifecycle.configured) {
      try {
        await this.#configClass.prototype.setDefaultConfig(configString);
        this.#config = { ...this.#config, ...await this.#configClass.newConfigFrom(configString) };
        await this.#config.validate();
        await this.onLifecycleEvent("CONFIGURED", new LifecycleEvent("CONFIGURED", async () => {
          this.#lifecycle.configured = true;
          this.#eventHandlers.run('CONFIGURED');
          this.status = "CONFIGURED";
        }));
      } catch (e) {
        console.error('Config error:', e);
      }
    }
  }

  get configure() {
    return async (configString) => {
      await this.configure(configString);
    };
  }

  async onLifecycleEvent(event, handler) {
    const existingHandlers = this.#eventHandlers.get(event);
    if (existingHandlers instanceof Array) {
      existingHandlers.push(handler);
      this.#eventHandlers.set(event, existingHandlers);
    } else {
      this.#eventHandlers.set(event, [handler]);
    }
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }

  async load() {
    try {
      await this.onLifecycleEvent("LOADED", new LifecycleEvent("LOADED", async () => {
        console.log("Loading...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Loading complete...");
        this.#lifecycle.loaded = true;
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
    };
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
    };
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



class Config {
  #staticConfig = {
    VERSION: "1.0.0",
    env: process.env.NODE_ENV || "development"
  };

  get staticConfig() {
    return this.#staticConfig;
  }

  constructor() {
    this.#config = { ...this.#staticConfig };
  }

  get config() {
    return JSON.parse(JSON.stringify(this.#config));
  }

  setDefaultConfig(configString) {
    const config = JSON.parse(configString);
    for (const [key, value] of Object.entries(config)) {
      this.#config[key] = value;
    };
  }

  newConfigFrom(configString) {
    const config = JSON.parse(configString);
    return Object.fromEntries(Object.entries(this.#config).map(([key, value]) => [key, this.#defaults[key]]));
  }

  // Add methods as needed
}

Object.assign(Config.prototype, {
  // Add methods as needed
});



const Config = {
  new: function() {
    return new Config();
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