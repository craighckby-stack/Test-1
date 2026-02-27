class Config {
  #_configSchema;

  #_privateConfig;

  get configSchema() {
    return this.#_configSchema;
  }

  get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development",
    };
  }

  get defaultConfig() {
    return {
      foo: "bar",
      baz: true,
    };
  }

  /**
   * Applies the given configuration.
   * @param {Object} config The configuration to apply.
   */
  setConfig(config) {
    const validator = new (require("jsonschema").Validator)();
    try {
      validator.checkSchema(this.configSchema);
      validator.validate(config, this.configSchema);
      this.#_privateConfig = config;
    } catch (error) {
      console.error("Config validation error:", error);
      throw error;
    }
  }

  /**
   * Gets the current configuration.
   */
  getData() {
    return this.#_privateConfig;
  }

  /**
   * Checks whether the configuration is valid.
   * @throws {Error} If the configuration is invalid.
   */
  isValid() {
    const validator = new (require("jsonschema").Validator)();
    try {
      validator.checkSchema(this.configSchema);
      validator.validate(this.#_privateConfig, this.configSchema);
    } catch (error) {
      console.error("Config validation error:", error);
      return false;
    }
    return true;
  }

  constructor() {
    this.#_configSchema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        baz: { type: "boolean" },
      },
    };
    this.#_privateConfig = this.defaultConfig;
  }
}

class LifecycleEvent {
  constructor(event) {
    this.event = event;
  }
}

class LifecycleHandler {
  #handler;
  #event;

  constructor(handler, event) {
    this.#handler = handler;
    this.#event = event;
  }

  bind(target) {
    this.#handler = this.#handler.bind(target);
  }

  execute() {
    this.#handler();
    this.#event = null;
  }

  get event() {
    return this.#event;
  }
}

class NexusLifecycle {
  #_status = "INIT";
  #_lifecycleHandlers = {};

  constructor() {
    this.status = this.#_status;
  }

  get status() {
    return this.#_status;
  }

  set status(value) {
    this.#_status = value;
    if (this.#_status !== "INIT") {
      console.log(`NexusCore instance is ${value}.`);
      if (value === "SHUTDOWN") {
        this.destroyed = true;
      } else if (value === "DESTROYED") {
        this.destroyed = true;
        this.configured = false;
        this.loaded = false;
        this.shuttingDown = false;
      }
    }
    if (this.configured) {
      this.configured = true;
    }
  }

  get status() {
    return this.#_status;
  }

  get lifecycle() {
    const lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      destroyed: false,
    };
    for (const event in this.#_lifecycleHandlers) {
      lifecycle[event] = this.#_lifecycleHandlers[event];
    }
    return lifecycle;
  }

  async #validateConfig(config) {
    const schema = Config.configSchema;
    try {
      const validator = new (require("jsonschema").Validator)();
      validator.checkSchema(schema);
      validator.validate(config, schema);
      return config;
    } catch (error) {
      console.error("Config validation error:", error);
      throw error;
    }
  }

  configure(config) {
    try {
      this.#validateConfig(config);
      const lifecycle = this.lifecycle;
      lifecycle.configured = true;
      return config;
    } catch (error) {
      console.error("Config error:", error);
    }
  }

  triggerEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler, event);
    this.#_lifecycleHandlers[event] = lifecycleHandler;
  }

  on(event, handler) {
    try {
      this.triggerEvent(event, handler);
    } catch (error) {
      console.error("On event error:", error);
    }
  }

  executeLifecycleEvent(event) {
    if (this.#_lifecycleHandlers[event]) {
      this.#_lifecycleHandlers[event].bind(this).execute();
    }
  }

  destroy() {
    this.status = "DESTROYED";
  }

  async start() {}
  async load() {}
  async shutdown() {}
  async destroy() {}
}

class NexusCore {
  #_nexusLifecycle;

  constructor() {
    this.#_nexusLifecycle = new NexusLifecycle();
  }

  get nexusLifecycle() {
    return this.#_nexusLifecycle;
  }

  async init() {
    try {
      this.nexusLifecycle.status = "INIT";
      this.nexusLifecycle.configured = await this.nexusLifecycle.configure(
        this.nexusLifecycle.nexusLifecycle.config
      );
      await this.nexusLifecycle.start();
      await this.nexusLifecycle.load();
      this.nexusLifecycle.status = "LOADED";
    } catch (error) {
      console.error("Init error:", error);
    }
  }

  async shutdown() {
    if (!this.nexusLifecycle.lifecycle.shuttingDown) {
      try {
        this.nexusLifecycle.status = "SHUTDOWN";
        this.nexusLifecycle.lifecycle.shuttingDown = true;
        await this.nexusLifecycle.shutdown();
      } catch (error) {
        console.error("Shutdown error:", error);
      }
    }
  }

  destroy() {
    this.nexusLifecycle.destroy();
    this.nexusLifecycle.status = "DESTROYED";
  }
}

const nexusCore = new NexusCore();
nexusCore.nexusLifecycle.on("DESTROYED", () => {
  console.log("NexusCore instance destroyed.");
});

try {
  await nexusCore.init();
} catch (error) {
  console.error("Init error:", error);
}

const configSchema = new Config();
let config = configSchema.defaultConfig;

nexusCore.nexusLifecycle.on("LOADED", () => {
  console.log("NexusCore instance loaded.");
});

nexusCore.nexusLifecycle.on("CONFIGURED", () => {
  config = nexusCore.nexusLifecycle.configure(config);
});

nexusCore.nexusLifecycle.on("SHUTDOWN", () => {
  console.log("NexusCore instance shutdown.");
  config = configSchema.defaultConfig;
});

nexusCore.nexusLifecycle.on("DESTROYED", () => {
  console.log("NexusCore instance destroyed.");
});