class Config {
  #_staticConfig;
  #_defaultConfig;
  #_configSchema;

  #_privateConfig;

  get staticConfig() {
    return this.#_staticConfig;
  }

  get defaultConfig() {
    return this.#_defaultConfig;
  }

  get configSchema() {
    return this.#_configSchema;
  }

  setConfig(config) {
    Object.assign(this.#_privateConfig, config);
  }

  getData() {
    return this.#_privateConfig;
  }

  isValid() {
    try {
      const validator = new (require("jsonschema").Validator)();
      validator.checkSchema(this.configSchema);
      validator.validate(this.#_privateConfig, this.configSchema);
    } catch (error) {
      console.error("Config validation error:", error);
      return false;
    }
    return true;
  }

  constructor() {
    this.#_staticConfig = {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development",
    };

    this.#_defaultConfig = {
      foo: "bar",
      baz: true,
    };

    this.#_configSchema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        baz: { type: "boolean" },
      },
    };

    this.#_privateConfig = {};
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

class NexusCore {
  #_lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    destroyed: false,
  };

  #_status = "INIT";

  get status() {
    return this.#_status;
  }

  set status(value) {
    this.#_status = value;
    const currentValue = this.#_status;
    const lifecycle = this.#_lifecycle;
    if (value !== "INIT") {
      console.log(`NexusCore instance is ${value}.`);
      if (value === "SHUTDOWN") {
        lifecycle.shuttingDown = false;
      }
      if (value === "DESTROYED") {
        lifecycle.destroyed = false;
        lifecycle.LOADED = null;
        lifecycle.SHUTTING_DOWN = null;
        lifecycle.shuttingDown = false;
      }
    }
    if (currentValue === "INIT" && value !== "INIT") {
      lifecycle.configured = true;
    }
  }

  get lifecycle() {
    return this.#_lifecycle;
  }

  #configureLifecycle() {
    this.validateConfig();
    this.#_lifecycle.configured = true;
    this.triggerEvent("CONFIGURED");
  }

  #validateConfig(config) {
    const schema = Config.configSchema;
    try {
      const validator = new (require("jsonschema").Validator)();
      validator.checkSchema(schema);
      validator.validate(config, schema);
    } catch (error) {
      console.error("Config validation error:", error);
      throw error;
    }
  }

  configure(config) {
    try {
      this.#validateConfig(config);
      this.#configureLifecycle();
      this/config = config;
    } catch (error) {
      console.error("Config error:", error);
    }
  }

  triggerEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler, event);
    this.#_lifecycle[event] = lifecycleHandler;
  }

  on(event, handler) {
    try {
      this.triggerEvent(event, handler);
    } catch (error) {
      console.error("On event error:", error);
    }
  }

  executeLifecycleEvent(event) {
    if (this.#_lifecycle[event]) {
      this.#_lifecycle[event].bind(this).execute();
    }
  }

  async init() {
    const lifecycleStart = async () => {
      try {
        if (!this.#_lifecycle.configured) {
          await this.configure(Config.defaultConfig);
          await this.start();
        }
        await this.load();
      } catch (error) {
        console.error("Init error:", error);
      }
    };
    return lifecycleStart();
  }

  async start() {
    if (!this.#_lifecycle.configured || this.#_lifecycle.shuttingDown) return;
    const lifecycleActions = ["CONFIGURED", "LOADED"];
    for (const action of lifecycleActions) {
      if (this.#_lifecycle[action]) {
        await this.#_lifecycle[action].handler();
      }
    }
  }

  async load() {
    try {
      console.log("Loading...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#_lifecycle.loaded = true;
      this.#_lifecycle.LOADED = new LifecycleHandler(() => {
        this.#_lifecycle.LOADED = null;
      });
    } catch (error) {
      console.error("Load error:", error);
    }
  }

  async shutdown() {
    try {
      if (!this.#_lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#_lifecycle.shuttingDown = true;
        this.#_lifecycle.SHUTTING_DOWN = new LifecycleHandler(() => {
          this.#_lifecycle.SHUTTING_DOWN = null;
        });
        this.status = "SHUTDOWN";
      }
    } catch (error) {
      console.error("Shutdown error:", error);
    }
  }

  async destroy() {
    try {
      console.log("Destroy initiated...");
      this.status = "DESTROYED";
      this.#_lifecycle.destroyed = true;
    } catch (error) {
      console.error("Destory error:", error);
    }
  }
}

const nexusCore = new NexusCore();
nexusCore.on("DESTROYED", () => {
  console.log("NexusCore instance destroyed.");
});

try {
  await nexusCore.init();
} catch (error) {
  console.error("Init error:", error);
}