class Config {
  #schema;
  #config;

  constructor({ staticConfig = {}, defaultConfig = {} } = {}) {
    this.#schema = this.getSchema();
    this.#config = { ...staticConfig, ...defaultConfig };
  }

  get staticConfig() {
    return this.#config?.static || {};
  }

  get defaultConfig() {
    return this.#config?.default || {};
  }

  getSchema() {
    return {
      type: "object",
      additionalProps: false,
      properties: {
        static: {
          type: "object",
          additionalProps: false,
          properties: {
            VERSION: { type: "string" },
            env: { type: "string" },
          },
        },
        default: {
          type: "object",
          additionalProps: false,
          properties: {
            foo: { type: "string" },
            baz: { type: "boolean" },
          },
        },
      },
    };
  }

  validate(config) {
    try {
      const configSchema = this.getSchema();
      const validator = new (require("jsonschema").Validator)();
      const validationResult = validator.validateConfig(config, configSchema);
      if (!validationResult.valid) {
        throw new Error("Config validation error");
      }
    } catch (error) {
      console.error("Config validation error:", error);
      throw error;
    }
  }

  get() {
    return this.#config;
  }

  set(staticConfig, defaultConfig) {
    this.#config = { ...staticConfig, ...defaultConfig };
  }
}

class LifecycleEvent {
  #event;
  #handler;

  constructor(event, handler = () => {}) {
    this.#event = event;
    this.#handler = handler;
  }

  get event() {
    return this.#event;
  }

  get handler() {
    return this.#handler;
  }

  bind(context = this) {
    this.#handler = this.#handler.bind(context);
  }

  execute() {
    this.#handler();
  }
}

class LifecycleHandler {
  #handler;

  constructor(handler) {
    this.#handler = handler;
  }

  bind(context = this) {
    this.#handler = this.#handler.bind(context);
  }

  execute() {
    this.#handler();
  }
}

class NexusCore {
  #status = "INIT";
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    destroyed: false,
  };

  #config;
  #configSchema;

  constructor() {
    this.#config = Object.assign({}, Config.defaultConfig);
    this.#configSchema = Config.getSchema();
  }

  get status() {
    return this.#status;
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  get config() {
    return this.#config;
  }

  set config(config) {
    this.validateConfig(config);
    this.#config = config;
  }

  configure() {
    this.onLifecycleEvent("CONFIGURED");
    this.#lifecycle.configured = true;
    this.status = "CONFIGURED";
  }

  validateConfig(config) {
    try {
      const configValidator = new (require("jsonschema").Validator)();
      configValidator.checkConfigSchema(this.#configSchema);
      configValidator.validateConfig(config, this.#configSchema);
    } catch (error) {
      console.error("Config validation error:", error);
    }
  }

  onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler);
    if (!this.#lifecycle[event]) {
      this.#lifecycle[event] = lifecycleHandler;
    }
  }

  async executeLifecycleEvent(event, context = this) {
    if (this.#lifecycle[event]) {
      await this.#lifecycle[event].bind(context).execute();
    }
  }

  load(duration = 1000) {
    return this.executeLifecycleEvent("CONFIGURED").then(() => {
      try {
        console.log("Loading for " + duration + "ms...");
        return new Promise(resolve => setTimeout(resolve, duration));
      } catch (error) {
        console.error("Load error:", error);
      }
    }).then(() => {
      this.#lifecycle.loaded = true;
      return this.executeLifecycleEvent("LOADED");
    });
  }

  shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      console.log("Shutdown initiated...");
      this.#lifecycle.shuttingDown = true;
      this.executeLifecycleEvent("SHUTTING_DOWN").then(() => {
        console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      });
    }
  }

  start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    return Promise.resolve().then(() => {
      for (const methodName of startMethodOrder) {
        if (this[methodName] instanceof Function) {
          try {
            this[methodName]();
          } catch (error) {
            console.error("Failed to start NexusCore instance:", error);
          }
        }
      }
    });
  }

  destroy() {
    this.status = "DESTROYED";
    this.#lifecycle.destroyed = true;
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      destroyed: true,
    };
  }
}

class NexusCoreInstance extends NexusCore {
  #onDestroyed;

  constructor(onDestroyed = () => {}) {
    super();
    this.#onDestroyed = onDestroyed;
    this.on("DESTROYED", onDestroyed);
  }

  destroy() {
    super.destroy();
    this.#onDestroyed();
  }
}

const nexusCore = new NexusCoreInstance(() => console.log("NexusCore instance destroyed"));
nexusCore.configure(Config.defaultConfig);
nexusCore.start().then(() => { })
  .then(() => nexusCore.load(10000))
  .then(() => nexusCore.shutdown())
  .then(() => nexusCore.destroy());