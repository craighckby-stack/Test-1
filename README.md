class Config {
  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  constructor(values = {}) {
    this.#values = new Map(values);
  }

  setProperty(name, value) {
    this.#values.set(name, value);
  }

  getProperty(name) {
    return this.#values.get(name);
  }

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
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
    configured: false,
    loaded: false,
    shuttingDown: false
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

  get config() {
    return this.#config;
  }

  set config(config) {
    this.#configLoading = true;
    Config.defaultConfig.loadConfig(config)
      .then(config => {
        this.#configLoading = false;
        this.#config = config;
      })
      .catch(error => {
        console.error("Failed to load config:", error);
        this.#configLoading = false;
      });
  }

  configure() {
    throw new Error("Configure is not a valid method for NexusCore. Use 'on' to add a lifecycle event handler or 'load' to load your application.");
  }

  async load() {
    await this.executeLifecycleEvent("CONFIGURED");
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      await this.executeLifecycleEvent('LOADED');
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

  get on() {
    return (event, handler) => {
      const lifecycleEvent = new LifecycleEvent(event);
      this.#lifecycle[event] = lifecycleEvent;
    };
  }

  async executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
      delete this.#lifecycle[event];
    }
  }

  async destroy() {
    throw new Error("Use shutdown method to end the app lifecycle.");
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

  static async configureWithConfig(config) {
    const nexusCore = System.nexusCore;
    if (nexusCore) {
      return await nexusCore.validateConfig(config).then(config => {
        return config;
      });
    } else {
      throw new Error("Start your application first.");
    }
  }

  static async start(nexusCore) {
    System.nexusCore = nexusCore;
    await nexusCore.start();
  }
}

const nexusCore = new NexusCore();
System.start(nexusCore);

nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();