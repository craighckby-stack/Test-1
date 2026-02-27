class Config {
  #staticConfig;
  #defaultConfig;
  #configSchema;

  constructor() {
    this.#configSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      }
    };
  }

  static get instance() {
    return new Config();
  }

  static getDefaultConfig() {
    return Config.instance.createConfig(Config.instance.#defaultConfig);
  }

  createConfig(values) {
    return new Config(values);
  }

  setValues(values) {
    Object.assign(this, values);
  }

  validate() {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.#configSchema);
      validator.validate(this, this.#configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
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

class LifecycleHandler extends LifecycleEvent {
  #handler;

  constructor(event, handler) {
    super(event);
    this.#handler = handler;
  }

  bind(target = this) {
    this.#handler = this.#handler.bind(target);
  }

  execute() {
    this.#handler();
  }

  destroy() {
    this.#handler = null;
  }
}

class LifecycleManager {
  #lifecycle;
  #status = "INIT";

  get status() {
    return this.#status;
  }

  set status(value) {
    if (value !== this.#status) {
      this.#status = value;
      if (value === 'SHUTDOWN') {
        this.#lifecycle.shuttingDown = false;
      } else if (value === 'DESTROYED') {
        Object.values(this.#lifecycle).forEach(handler => handler.destroy());
      }
    }
    if (value === 'CONFIGURED') {
      this.#lifecycle.configured = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  configure(config) {
    this.validateConfig(config);
    this.runLifecycleEvent("CONFIGURED");
    this.#lifecycle.configured = true;
    this.config = config;
  }

  validateConfig(config) {
    const configSchema = Config.instance.#configSchema;
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(configSchema);
      validator.validate(config, configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(event, handler);
    this.#lifecycle[event] = lifecycleHandler;
  }

  get on() {
    return (event, handler) => {
      this.onLifecycleEvent(event, handler);
    };
  }

  runLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }
}

class NexuxCore extends LifecycleManager {
  #lifecycle;

  constructor() {
    super();
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
  }

  #init() {
    this.on("DESTROYED", () => {
      console.log("NexusCore instance destroyed.");
    });
  }

  createConfig(values) {
    return Config.instance.createConfig(values);
  }

  async configure(config) {
    super.configure(this.createConfig(config));
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
    try {
      await super.load();
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        await super.runLifecycleEvent("SHUTTING_DOWN");
        console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  async destroy() {
    this.status = "DESTROYED";
    super.destroy();
  }
}

const nexusCore = new NexuxCore();
nexusCore.configure(Config.getDefaultConfig());
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();