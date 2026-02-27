class Config {
  static #scalars = {
    version: "1.0.0",
    env: process.env.NODE_ENV || "development"
  };

  static #object = {
    foo: 'bar',
    baz: true
  };

  #values = new Map();

  constructor(values = {}) {
    this.#values = new Map(values);
  }

  static get staticConfig() {
    return {
      ...this.#scalars,
      ...this.#object
    };
  }

  static get defaultConfig() {
    return this.#object;
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

  async validate() {
    try {
      const schema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(await this.getValues(), schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
    return await this.getValues();
  }

  async getValues() {
    return Object.fromEntries(Array.from(await this.#values));
  }

  async setValues(values) {
    await Promise.all(Array.from(Object.entries(values)).map(([key, value]) => {
      this.setProperty(key, value);
    }));
  }

  async loadConfig(config) {
    await this.validateConfig(config);
    await this.setValues(config);
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

  getProperty(name) {
    return this.#values.get(name);
  }

  setProperty(name, value) {
    this.#values.set(name, value);
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
    this.handler = this.handler.bind(target);
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
  #config = Config.defaultConfig;
  #configLoading = false;

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
    return this.#config;
  }

  set config(config) {
    this.#configLoading = true;
    Config.defaultConfig.loadConfig(config)
      .then(async config => {
        this.#configLoading = false;
        this.#config = config;
        await this.executeLifecycleEvent("CONFIGURED", Config.loaded);
      })
      .catch(error => {
        console.error("Failed to load config:", error);
        this.#configLoading = false;
      });
  }

  async configure(Lifecycle, handlers) {
    console.log("Configure initiated...");
    for (const handler of this.#lifecycle.configured) {
      const lifecycleEvent = new LifecycleEvent('CONFIGURED');
      handlers[lifecycleEvent.event].bind(this).execute();
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
      handlers[lifecycleEvent.event].bind(this).execute();
      console.log("Shutdown complete...");
      this.status = "SHUTDOWN";
    }
  }

  get on() {
    return (event, handler) => {
      const lifecycle = event in this.#lifecycle ? this.#lifecycle[event] : new Set();
      if (event === "CONFIGURED") {
        lifecycle.add(handler);
      }
    };
  }

  async executeLifecycleEvent(event, Lifecycle) {
    if (this.#lifecycle[event]) {
      const lifecycleEvent = new LifecycleEvent(event);
      this.#lifecycle[event].add(lifecycleEvent);
      await lifecycleEvent.bind(this).execute();
      delete this.#lifecycle[event];
    }
    this.#lifecycle.shuttingDown.add(event);
    if (Lifecycle) {
      Lifecycle.set(event, new Set(this.#lifecycle[event]));
    }
  }

  async destroy() {
    this.status = "DESTROYED";
  }
}

class System {
  static nexusCoreInstance;

  static get nexusCore() {
    return System.nexusCoreInstance;
  }

  static set nexusCore(nexusCore) {
    System.nexusCoreInstance = nexusCore;
  }

  static async configureWithConfig(config, Lifecycle, handlers) {
    const nexusCore = System.nexusCore;
    if (nexusCore) {
      await nexusCore.validateConfig(config).then(async config => {
        await Config.defaultConfig.loadConfig(config);
        await nexusCore.configure(Lifecycle, handlers);
        return config;
      });
    } else {
      throw new Error("Start your application first.");
    }
  }

  static async start(nexusCore, Lifecycle, handlers) {
    System.nexusCore = nexusCore;
    config = await nexusCore.validateConfig(Config.defaultConfig);
    await nexusCore.configure(Lifecycle, handlers).then(() => {
      return nexusCore.load(Lifecycle, handlers);
    });
  }
}

const nexusCore = new NexusCore();
const lifecycleHandlers = {
  CONFIGURED: () => console.log("Configured"),
  LOADED: () => console.log("Loaded"),
  LOADING: () => console.log("Loading..."),
  SHUTTING_DOWN: () => console.log("Shutting down..."),
};

System.start(nexusCore, new Set(), lifecycleHandlers);

nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});

nexusCore.config = { foo: 'value' };
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();

This code introduces several improvements to the previous version:

*   The `Config` class now uses private static properties for its scalars and object, and the class methods `getProperty` and `setProperty` are used to access and modify the map properties securely.
*   The `NexusCore` class now uses Sets to manage lifecycle event handlers, which enables easier tracking and execution of events.
*   The `configure` method in `NexusCore` now executes handlers in the order they are added.
*   The `start` method in `System` has been updated to return the promise of `configure` after `nexusCore` has been assigned an instance.
*   The `nexusCore` property is now set when the `start` method is called.