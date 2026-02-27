class Config {
  #defaultConfig;
  #configSchema;
  #instance;

  static getInstance() {
    return new WeakMap().get('instance') || new Config();
  }

  static setInstance(value) {
    const configMap = new WeakMap();
    configMap.set('instance', value);
  }

  constructor(...initialValues) {
    if (this.#instance) {
      return this.#instance;
    }

    Object.assign(this, initialValues);
    this.#instance = this;
    this.#configSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      }
    };
  }

  get instance() {
    return this.#instance;
  }

  static getDefaultConfig() {
    const instance = Config.getInstance();
    return instance.createConfig(instance.#defaultConfig);
  }

  createConfig(values) {
    return new Config(values);
  }

  setValues(values) {
    Object.assign(this.#defaultConfig, values);
  }

  validate() {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.#configSchema);
      validator.validate(this.#defaultConfig, this.#configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get values() {
    return this.#defaultConfig;
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
  #status = "INIT";
  #lifecycle;

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
    const configSchema = Config.getInstance().#configSchema;
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
  #initCalled = false;

  static initialize() {
    if (!NexuxCore.getInstance()) {
      const instance = new NexuxCore();
      NexuxCore.setInstance(instance);
    }
  }

  get instance() {
    return NexuxCore.getInstance();
  }

  static getInstance() {
    return new WeakMap().get('instance');
  }

  static setInstance(value) {
    const configMap = new WeakMap();
    configMap.set('instance', value);
  }

  #init() {
    this.on("DESTROYED", () => {
      console.log("NexusCore instance destroyed.");
    });
    this.#initCalled = true;
  }

  async configure(config) {
    try {
      await super.configure(this.createConfig(config));
    } catch (e) {
      throw e;
    }
  }

  async start() {
    try {
      if (this.#initCalled) {
        await this.#init();

        const startMethodOrder = ["configure", "load", "shutdown"];
        for (const methodName of startMethodOrder) {
          if (this[methodName] instanceof Function) {
            await this[methodName]();
          }
        }
      } else {
        throw new Error("Initialization failed.");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async load() {
    try {
      await super.load();
      // custom load logic
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
    if (!this.#initCalled) {
      return;
    }

    this.status = "DESTROYED";
    super.destroy();
  }
}

// Usage
NexuxCore.initialize();
const nexusCore = NexuxCore.instance;
nexusCore.configure(Config.getDefaultConfig());
nexusCore.start();
// nexusCore.load();
// nexusCore.shutdown();
nexusCore.destroy();