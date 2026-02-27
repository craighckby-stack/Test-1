class Config {
  #configSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    }
  };

  #values = {};

  get config() {
    return this.#values;
  }

  constructor() {
    this.#values = this.#configSchema;
  }

  setValues(values) {
    if (this.validate(values)) {
      this.#values = values;
    }
  }

  validate(values) {
    this.#validate(values);
  }

  #validate(values) {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.#configSchema);
      validator.validate(values, this.#configSchema);
      return true;
    } catch (e) {
      console.error('Config validation error:', e);
      return false;
    }
  }

  getVersion() {
    return "1.0.0";
  }

  getEnvironment() {
    return process.env.NODE_ENV || "development";
  }

  get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
  }

  getDefaultConfig() {
    return this.defaultConfig;
  }
}

class LifecycleEvent {
  #handler;

  constructor(event) {
    this.event = event;
    this.#handler = null;
  }

  get handler() {
    return this.#handler;
  }

  setHandler(handler) {
    this.#handler = handler;
  }

  execute() {
    if (this.#handler) {
      this.#handler();
    }
  }
}

class LifecycleHandler extends LifecycleEvent {
  bind(target = this) {
    this.#handler = this.#handler.bind(target);
  }

  execute() {
    if (this.#handler) {
      this.#handler();
    }
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  #status = "INIT";

  get status() {
    return this.#status;
  }

  set status(value) {
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        this.#lifecycle.shuttingDown = false;
      }
    }
    this.#status = value;
    const currentValue = this.#status;
    const lifecycle = this.#lifecycle;
    if (currentValue === 'INIT' && value !== 'INIT') {
      lifecycle.configured = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  async configure(config = Config.getDefaultConfig()) {
    this.status = "CONFIGURING";
    try {
      config.setValues(await Config.validateConfigAsync(config));
      await this.executeLifecycleEvent("CONFIGURED");
      this.#lifecycle.configured = true;
      this.config = config;
      this.status = "CONFIGURED";
      return config;
    } catch (e) {
      console.error(e);
      await this.executeLifecycleEvent("CONFIGURE_ERROR");
      throw e;
    }
  }

  async validateConfig(config = Config.getDefaultConfig()) {
    try {
      await Config.validateConfigAsync(config);
      return config;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async validateConfigAsync(config = Config.getDefaultConfig()) {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(Config.configSchema);
      await validator.validatePromise(config, Config.configSchema);
      return config;
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler();
    lifecycleHandler.event = event;
    lifecycleHandler.handler = handler;
    this.#lifecycle[event] = lifecycleHandler;
  }

  get on() {
    return (event, handler) => {
      const lifecycleEvent = new LifecycleHandler();
      lifecycleEvent.event = event;
      lifecycleEvent.handler = handler;
      this.onLifecycleEvent(event, handler);
    };
  }

  async load() {
    if (await this.executeLifecycleEvent("CONFIGURED")) {
      try {
        console.log("Loading...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Loading complete...");
        this.#lifecycle.loaded = true;
        await this.executeLifecycleEvent("LOADED");
      } catch (e) {
        console.error('Load error:', e);
        await this.executeLifecycleEvent("LOAD_ERROR");
      }
    } else {
      throw new Error("Configuration is not valid.");
    }
  }

  async shutdown() {
    if (await this.executeLifecycleEvent("SHUTTING_DOWN") && !this.#lifecycle.shuttingDown) {
      console.log("Shutdown initiated...");
      this.#lifecycle.shuttingDown = true;
      console.log("Shutdown complete...");
      this.status = "SHUTDOWN";
      await this.executeLifecycleEvent("SHUTDOWN");
    } else {
      throw new Error("Shutdown is already in progress.");
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
  }

  async destroy() {
    console.log('Destroying NexusCore instance...');
    this.status = "DESTROYED";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
  }

  async on(event, handler) {
    await this.onLifecycleEvent(event, handler);
  }

  async executeLifecycleEvent(event) {
    this.#lifecycle[event].bind(this).execute();
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
try {
  await nexusCore.configure();
  await nexusCore.start();
  await nexusCore.load();
  await nexusCore.shutdown();
  await nexusCore.destroy();
} catch (e) {
  console.error(e);
}