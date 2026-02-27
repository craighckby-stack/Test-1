class Config {
  #schema;
  #config;

  constructor(staticConfig = {}, defaultConfig = {}) {
    this.#schema = this.composeSchema();
    this.#config = { ...staticConfig, ...defaultConfig };
  }

  get staticConfig() {
    return this.#config.static || {};
  }

  get defaultConfig() {
    return this.#config.default || {};
  }

  composeSchema() {
    return {
      type: "object",
      additionalProps: false,
      properties: {
        static: this.composeStaticSchema(),
        default: this.composeDefaultSchema(),
      },
    };
  }

  composeStaticSchema() {
    return {
      type: "object",
      additionalProps: false,
      properties: {
        VERSION: { type: "string" },
        env: { type: "string" },
      },
    };
  }

  composeDefaultSchema() {
    return {
      type: "object",
      additionalProps: false,
      properties: {
        foo: { type: "string" },
        baz: { type: "boolean" },
      },
    };
  }

  validate(config) {
    try {
      const { validate } = require("jsonschema");
      validate(config, this.#schema);
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
}

class LifecycleHandler {
  #event;

  constructor(event) {
    this.#event = event;
  }

  async execute() {
    if (this.#event.handler) {
      this.#event.handler();
    }
  }
}

class NexusCore {
  #status = "INIT";
  #configSchema;
  #lifecycleStates;
  #config;

  constructor() {
    this.#configSchema = Config.getSchema();
    this.#lifecycleStates = {
      configured: new LifecycleEvent("CONFIGURED", () => {}),
      loaded: new LifecycleEvent("LOADED", () => {}),
      shuttingDown: new LifecycleEvent("SHUTTING_DOWN", () => {}),
      destroyed: new LifecycleEvent("DESTROYED", () => {}),
    };
    this.#config = {};
  }

  get status() {
    return this.#status;
  }

  get lifecycleEventStates() {
    return this.#lifecycleStates;
  }

  get config() {
    return this.#config;
  }

  set config(newConfig) {
    this.validateConfig(newConfig);
    this.#config = newConfig;
  }

  async configure(config = Config.defaultConfig) {
    this.validateConfig(config);
    this.#config = config;
    this.#lifecycleStates.configured.handler = () => {};
    this.#status = "CONFIGURED";
    await this.#lifecycleStates.configured.execute();
  }

  validateConfig(config) {
    try {
      const { validate } = require("jsonschema");
      validate(config, this.#configSchema);
    } catch (error) {
      console.error("Config validation error:", error);
    }
  }

  async load(duration = 1000) {
    try {
      console.log("Loading for " + duration + "ms...");
      await new Promise(resolve => setTimeout(resolve, duration));
    } catch (error) {
      console.error("Load error:", error);
    }
    this.#lifecycleStates.loaded.handler = () => {};
    await this.#lifecycleStates.loaded.execute();
  }

  async shutdown() {
    this.#lifecycleStates.shuttingDown.handler = () => {};
    await this.#lifecycleStates.shuttingDown.execute();
    console.log("Shutdown complete...");
    this.#status = "SHUTDOWN";
  }

  destroy() {
    this.#status = "DESTROYED";
    this.#lifecycleStates.destroyed.handler = () => {};
    this.#lifecycleStates.destroyed.execute();
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    return Promise.resolve().then(() => {
      for (const methodName of startMethodOrder) {
        if (this[methodName] instanceof Function) {
          try {
            await this[methodName]();
          } catch (error) {
            console.error("Failed to start NexusCore instance:", error);
          }
        }
      }
    });
  }
}

class NexusCoreInstance extends NexusCore {
  #initialized;
  #onDestroyed;

  constructor(initialized = () => {}, onDestroyed = () => {}) {
    super();
    this.#initialized = initialized;
    this.#onDestroyed = onDestroyed;
    this.on("INITIALIZED", initialized);
    this.on("DESTROYED", onDestroyed);
  }

  async start() {
    await super.start();
    await this.#lifecycleEventStates.configured.execute();
    this.#initialized();
  }

  on(event, handler) {
    if (event === "INITIALIZED" || event === "DESTROYED") {
      this.#lifecycleEventStates[event].handler = handler;
    }
  }

  async destroy() {
    await super.destroy();
  }
}

const nexusCoreInstance = new NexusCoreInstance(() => console.log("NexusCore instance initialized"), () => console.log("NexusCore instance destroyed"));
nexusCoreInstance.start().then(() => nexusCoreInstance.configure(Config.defaultConfig).then(() => nexusCoreInstance.load(10000).then(() => nexusCoreInstance.shutdown())));

Please note that the `LifecycleHandler` has been updated to an async class due to the use of `await` in the execution of lifecycle events. This should now be correctly executed with the updated code.