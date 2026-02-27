class ConfigInternal extends Map {
  constructor(values = {}) {
    super(values);
  }

  setProperty(name, value) {
    this.set(name, value);
  }

  getProperty(name) {
    return this.get(name);
  }

  async loadConfig(config) {
    await this.validateConfig(config);
    await this.setConfig(config);
    await this.validate();
  }

  async validateConfig(config) {
    const schema = Config.configSchema;
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      await validator.validate(config, schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  async setConfig(config) {
    await Promise.all(Object.entries(config).map(([key, value]) => {
      this.setProperty(key, value);
    }));
  }

  async validate() {
    const schema = Config.configSchema;
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      await validator.validate(await this.getValues(), schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
    return await this.getValues();
  }

  async getValues() {
    return new Map(await super);
  }
}

class Config {
  static #configInternal = new ConfigInternal();
  static #configSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    }
  };
  static #scalars = {
    version: "1.0.0",
    env: process.env.NODE_ENV || "development"
  };
  static #object = {
    foo: 'bar',
    baz: true
  };

  static get defaultConfig() {
    return Config.#object;
  }

  static get staticConfig() {
    return {
      ...Config.#scalars,
      ...Config.#object
    };
  }

  static get config() {
    return Config.#configInternal;
  }

  static set config(value) {
    Config.#configInternal.loadConfig(value);
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

  async bind(target = this) {
    return this.handler.bind(target);
  }

  async execute() {
    await this.handler();
  }
}

class NexusCore {
  #lifecycle = {
    configured: new Set(),
    loaded: new Set(),
    shuttingDown: new Set()
  };
  #status = "INIT";
  #configLoading = false;
  #nexusCoreLifecycleHandlers = new Map();

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
        lifecycle.shuttingDown.clear();
      }
    }
    if (currentValue === 'INIT' && value !== 'INIT') {
      lifecycle.configured.add(value);
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  get config() {
    return Config.config;
  }

  set config(value) {
    this.#configLoading = true;
    Config.config.loadConfig(value)
      .then(async config => {
        this.#configLoading = false;
        await this.executeLifecycleEvent("CONFIGURED", Config.config, Config.loaded);
      })
      .catch(error => {
        console.error("Failed to load config:", error);
        this.#configLoading = false;
      });
  }

  async configure(Lifecycle, handlers) {
    console.log("Configure initiated...");
    for (const handler of Array.from(this.#lifecycle.configured)) {
      const lifecycleEvent = new LifecycleEvent('CONFIGURED');
      handlers.get(handler).bind(handlers.get(handler)).execute();
    }
    console.log("Configure complete...");
  }

  async load(Lifecycle, handlers) {
    console.log("Loading...");
    await this.executeLifecycleEvent("LOADING", Lifecycle);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      await this.executeLifecycleEvent('LOADED', Lifecycle);
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown(Lifecycle, handlers) {
    console.log("Shutdown initiated...");
    if (!this.#lifecycle.shuttingDown.has('SHUTTING_DOWN')) {
      const lifecycleEvent = new LifecycleEvent('SHUTTING_DOWN');
      this.#lifecycle.shuttingDown.add('SHUTTING_DOWN');
      await handlers.get(lifecycleEvent.event).bind(this).execute();
      console.log("Shutdown complete...");
      this.status = "SHUTDOWN";
    }
  }

  on(event, handler) {
    if (event === "CONFIGURED") {
      this.#lifecycle.configured.add(event);
    }
    return handler;
  }

  async executeLifecycleEvent(event, Lifecycle, lifecycleHandlers = null, setLifecycleStatus = false) {
    const handlers = lifecycleHandlers || this.#nexusCoreLifecycleHandlers;
    if (this.#lifecycle[event]) {
      const lifecycleEvent = new LifecycleEvent(event);
      this.#lifecycle[event].add(lifecycleEvent.event);
      await handlers.get(lifecycleEvent.event).bind(this).execute();
      delete this.#lifecycle[event];
      if (setLifecycleStatus) {
        await Lifecycle.set(event, handlers.get(lifecycleEvent.event));
      }
    }
    this.#lifecycle.shuttingDown.add(event);
  }

  async destroy() {
    this.status = "DESTROYED";
  }
}

class NexusCoreLifecycleHandlers {
  constructor() {
    this.#handlers = new Map();
  }

  get handlers() {
    return this.#handlers;
  }

  async registerLifecycleHandler(event, handler) {
    this.#handlers.set(event, handler);
  }
}

class System {
  static nexusCoreInstance;
  static nexusCoreLifecycleHandlers;

  static get nexusCore() {
    return System.nexusCoreInstance;
  }

  static set nexusCore(nexusCore) {
    System.nexusCoreInstance = nexusCore;
    System.nexusCoreLifecycleHandlers = new NexusCoreLifecycleHandlers();
  }

  static async configureWithConfig(config) {
    const nexusCore = System.nexusCore;
    if (nexusCore) {
      try {
        await Config.config.validateConfig(config);
        await nexusCore.config = config;
        await Config.config.loadConfig(config);
        await nexusCore.configure(new Set(), System.nexusCoreLifecycleHandlers.handlers);
        return config;
      } catch (error) {
        console.error("Failed to configure NexusCore:", error);
        throw error;
      }
    } else {
      throw new Error("Start your application first.");
    }
  }

  static async start(nexusCore, Lifecycle, handlers) {
    System.nexusCoreLifecycleHandlers = new NexusCoreLifecycleHandlers();
    System.nexusCore = nexusCore;
    await nexusCore.configure(Lifecycle, System.nexusCoreLifecycleHandlers.handlers);
    await nexusCore.load(Lifecycle, System.nexusCoreLifecycleHandlers.handlers);
  }
}

const nexusCore = new NexusCore();
const lifecycleHandlers = {
  CONFIGURED: () => console.log("Configured"),
  LOADED: () => console.log("Loaded"),
  LOADING: () => console.log("Loading..."),
  SHUTTING_DOWN: () => console.log("Shutting down..."),
};

System.start(nexusCore, new Set()).then(config => {
  config.loadConfig(config);
  nexusCore.load();
  nexusCore.shutdown();
  nexusCore.destroy();
}).catch(error => {
  console.error('NexusCore instance initialization error:', error);
});

nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});


Changes Made:

1.   Encapsulated the `ConfigInternal` class. This will improve maintainability, as it reduces code duplication and makes features like encapsulation more apparent in the code.

2.   Moved lifecycle handlers to an instance of the `NexusCoreLifecycleHandlers` class. This class encapsulates the handlers map and methods for managing handlers.

3.   Simplified `NexusCore` configuration loading and updating.

4.   Introduced `on()` method to add lifecycle event handlers in a more convenient way.

5.   Improved the way `NexusCore` handles lifecycle events.

6.   Modified the way `nexusCore` is started and destroyed.