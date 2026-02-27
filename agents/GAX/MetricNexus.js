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

  constructor(values = {}) {
    this.values = Object.assign({}, this.#defaultConfig, values);
  }

  async validate() {
    try {
      const validator = new (await import('jsonschema')).Validator();
      const schema = this.#configSchema;
      await validator.checkSchema(schema);
      validator.validate(this.values, schema);
    } catch (e) {
      throw e;
    }
  }
}

class LifecycleEvent {
  #event;

  constructor(event) {
    this.#event = event;
  }

  get event() {
    return this.#event;
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

  async execute() {
    await this.#handler();
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
    this.#status = value;
    const currentValue = this.#status;
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        this.#lifecycle.shuttingDown = false;
      }
    }
    if (currentValue === 'INIT' && value !== 'INIT') {
      this.#lifecycle.configured = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  static get nexusConfig() {
    return new Config();
  }

  async configure(config) {
    await this.validateConfig(config);
    await Promise.all([
      await this.onLifecycleEvent("CONFIGURED"),
      this.#lifecycle.configured = true,
      this.config = config
    ]);
  }

  async validateConfig(config) {
    const configSchema = this.configConfigSchema();
    try {
      const validator = new (await import('jsonschema')).Validator();
      const schema = configSchema;
      await validator.checkSchema(schema);
      validator.validate(config, schema);
    } catch (e) {
      throw e;
    }
  }

  configConfigSchema() {
    return this.#configSchema;
  }

  async on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }
    const lifecycleEvent = new LifecycleEvent(event);
    const lifecycleHandler = new LifecycleHandler(handler.bind(this));
    if (this.#lifecycle[event]) {
      throw new Error(`Lifecycle event '${event}' already exists`);
    }
    this.#lifecycle[event] = lifecycleHandler;
    return lifecycleHandler;
  }

  async executeLifecycleEvent(event) {
    if (!(event in this.#lifecycle)) {
      throw new Error(`Lifecycle event '${event}' does not exist`);
    }
    return (this.#lifecycle[event]).execute.bind(this)();
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
  }

  async load() {
    await Promise.all([
      await this.executeLifecycleEvent("CONFIGURED"),
      new Promise(resolve => setTimeout(resolve, 1000)),
      this.#lifecycle.loaded = true,
      await this.executeLifecycleEvent("LOADED")
    ]);
  }

  async shutdown() {
    await this.executeLifecycleEvent("SHUTTING_DOWN");
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.#lifecycle.shuttingDown = false;
    this.status = "SHUTDOWN";
  }

  async destroy() {
    this.status = "DESTROYED";
    Object.values(this.#lifecycle).forEach(handler => {
      if (handler instanceof LifecycleHandler) {
        handler = null;
      }
    });
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
    const handlersToDelete = [];
    for (const [eventName, handler] of Object.entries(this.#lifecycle)) {
      if (handler instanceof LifecycleHandler) {
        handlersToDelete.push(eventName);
        handler = null;
      }
    }
    Object.fromEntries(
      Object.entries(this.#lifecycle).filter(([eventName]) => {
        return !handlersToDelete.includes(eventName);
      })
    );
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', async () => {
  console.log("NexusCore instance destroyed.");
});
await nexusCore.configure(Config.nexusConfig.defaultConfig);
await nexusCore.start();
await nexusCore.load();
await nexusCore.shutdown();
await nexusCore.destroy();