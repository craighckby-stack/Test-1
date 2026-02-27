class LifecycleEvent {
  #event;

  constructor(event) {
    this.#event = event;
  }

  get event() {
    return this.#event;
  }

  set event(value) {
    this.#event = value;
  }
}

class LifecycleHandler {
  #handler;

  constructor(handler) {
    this.#handler = handler;
  }

  bind(target = this) {
    this.#handler = this.#handler.bind(target);
  }

  get event() {
    return this.#handler.event;
  }

  set event(value) {
    this.#handler.event = value;
  }

  async execute() {
    if (this.#handler.handler) {
      await this.#handler.handler();
    }
  }

  async on(config = this) {
    if (this.#handler.handler) {
      return this.execute();
    }
  }
}

class ConfigHandler {
  #handler;

  constructor(handler) {
    this.#handler = handler;
  }

  bind(target = this) {
    this.#handler = this.#handler.bind(target);
  }

  get event() {
    return this.#handler.event;
  }

  set event(value) {
    this.#handler.event = value;
  }

  async configure() {
    if (this.#handler.handler) {
      const config = await this.#handler.handler(this.config);
      this.#handler.event = "CONFIGURED";
      this.#handler.handler = undefined;
      return config;
    }
  }

  async load() {
    if (this.#handler.handler) {
      return new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async shutdown() {
    if (this.#handler.handler) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.#handler.handler = undefined;
    }
  }
}

class ConfigState {
  #config;

  constructor(config) {
    this.#config = config;
  }

  get config() {
    return this.#config;
  }

  set config(value) {
    this.#validateConfig(value);
    Object.assign(this.#config, value);
  }

  #validateConfig(value) {
    const validator = new (require('jsonschema').Validator)();
    validator.checkSchema(value.configSchema);
    try {
      validator.validate(value, value.configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }
}

class Config extends ConfigState {
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
    },
    required: ['foo', 'baz']
  };

  constructor(values = {}) {
    super({ configSchema: this.#configSchema, ...values });
    this.#setInstance(values);
  }

  #setInstance(values) {
    this.#validateConfig(values);
    Object.assign(this, values);
  }

  get staticConfig() {
    return this.#staticConfig;
  }

  get defaultConfig() {
    return this.#defaultConfig;
  }

  get configSchema() {
    return this.#configSchema;
  }
}

class NexusCore {
  #stage = "INIT";

  #state = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  #stageChangeHandlers = {};

  #initializing;
  #configChangeHandlers;

  get stage() {
    return this.#stage;
  }

  get stageChangeHandlers() {
    return this.#stageChangeHandlers;
  }

  set stage(value) {
    if (value !== "INIT" && !["CONFIGURED", "SHUTTING_DOWN"].includes(this.#stage)) {
      console.log(`NexusCore instance is ${value}.`);
      if (value === "SHUTDOWN") {
        this.#state.shuttingDown = false;
      }
    }
    if (value === "CONFIGURED" && this.#stage !== "CONFIGURED" && !this.#initializing) {
      this.#state.configured = true;
    }
  }

  get config() {
    return this.#config;
  }

  set config(value) {
    this.#configChangeHandlers.forEach((handler) => handler.configure(value));
  }

  get on() {
    return (value) => {
      if (this.#stageChangeHandlers[value]) {
        this.stageChangeHandlers[value].forEach((handler) => handler(this));
      }
    };
  }

  get configChange() {
    return (value) => {
      if (this.#configChangeHandlers) {
        this.#configChangeHandlers.forEach((handler) => {
          if (handler.configure) {
            handler.configure(value);
          }
        });
      }
    };
  }

  addStageChangeHandler(event, handler) {
    if (!this.#stageChangeHandlers[event]) {
      this.#stageChangeHandlers[event] = [];
    }
    this.#stageChangeHandlers[event].push(handler);
  }

  async configure(config) {
    try {
      this.#initializing = true;
      this.stage = "CONFIGURED";
      this.#state.configured = true;
      this.config = config;
      this.#initializing = false;
      await Promise.all(Object.values(this.#stageChangeHandlers).flat().map(async (handler) => {
        await handler(this);
      }));
    } catch (e) {
      console.error('Config error:', e);
      throw e;
    }
  }

  async load() {
    try {
      if (this.#state.configured) {
        this.stage = "LOADING";
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.stage = "LOADED";
        this.#state.loaded = true;
        await Promise.all(Object.values(this.#stageChangeHandlers).flat().map(async (handler) => {
          await handler(this);
        }));
      }
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#state.shuttingDown) {
        this.stage = "SHUTTING_DOWN";
        this.#state.shuttingDown = true;
        await Promise.all(Object.values(this.#stageChangeHandlers).flat().map(async (handler) => {
          await handler(this);
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.stage = "SHUTDOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  async destroy() {
    this.stage = "DESTROYED";
    this.#state = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
    this.config = {};
    this.#initializing = false;
    this.#stageChangeHandlers = {};
  }

  async start() {
    try {
      if (!this.#state.configured || this.#state.loaded || this.#state.shuttingDown) {
        return;
      }
      const startMethodOrder = ["configure", "load"];
      for (const methodName of startMethodOrder) {
        if (this[methodName] instanceof Function) {
          await this[methodName]();
        }
      }
      await this.shutdown();
    } catch (e) {
      console.error('Start error:', e);
    }
  }

  async on(event, handler) {
    this.addStageChangeHandler(event, handler);
    this.addStageChangeHandler(event, new ConfigHandler(handler));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async configure() {
    const config = await new ConfigChangeHandler().configure(this.config);
    this.config = config;
  }
}

class ConfigChangeHandler {
  async configure(config) {
    const configState = new ConfigState(config);
    this.event = "CONFIGURED";
    this.handler = async () => {
      const newConfig = await super.configure(configState);
      this.event = "CONFIGURED";
      this.handler = undefined;
      return newConfig;
    };
    return configState;
  }
}

class StageChangeHandler {
  async stageChange(event, nexusCore) {
    this.event = event;
    this.handler = async () => {
      await nexusCore.executeLifecycleEvent(event);
    };
  }
}

const nexusCore = new NexusCore();

nexusCore.on("DESTROYED", async (nexusCore) => {
  console.log("NexusCore instance destroyed.");
});

const configState = new ConfigState({
  configSchema: Config.defaultConfig.configSchema,
  foo: 'bar',
  baz: true
});

nexusCore.on('CONFIGURED', new StageChangeHandler());
nexusCore.on('CONFIGURED', new ConfigChangeHandler());
nexusCore.configure(configState);
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();