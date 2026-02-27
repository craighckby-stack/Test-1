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
    this.#defaultConfig = { ...this.#configSchema.properties };
  }

  get instance() {
    return this.#instance;
  }

  static getDefaultConfig() {
    const instance = Config.getInstance();
    return instance.#defaultConfig;
  }

  createConfig(values) {
    return new Config({ ...this.#defaultConfig, ...values });
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
  #onLifecycleEventCallbacks = {};

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
      this.#onLifecycleEventCallbacks.configured.forEach(callback => callback(this));
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

  on(event, callback) {
    if (!this.#onLifecycleEventCallbacks[event]) {
      this.#onLifecycleEventCallbacks[event] = [];
    }
    this.#onLifecycleEventCallbacks[event].push(callback);
  }

  off(event) {
    if (this.#onLifecycleEventCallbacks[event]) {
      this.#onLifecycleEventCallbacks[event] = [];
      delete this.#onLifecycleEventCallbacks[event];
    }
  }

  runLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }

  get on() {
    return (event, callback) => {
      this.on(event, callback);
    };
  }

  get off() {
    return event => {
      this.off(event);
    };
  }
}

class NexuxCore extends LifecycleManager {
  #initCalled = false;
  #configured = false;

  static getInstance() {
    return new WeakMap().get('instance') || new NexuxCore();
  }

  static setInstance(value) {
    const configMap = new WeakMap();
    configMap.set('instance', value);
  }

  constructor() {
    super();
  }

  get instance() {
    return NexuxCore.getInstance();
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

  async init() {
    if (!this.#initCalled) {
      this.#initCalled = true;
      await super.init();
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
    await super.destroy();
  }

  async init() {
    this.#lifecycle = {};
    try {
      this.on("DESTROYED", () => {
        console.log("NexusCore instance destroyed.");
      });
      await super.init();
    } catch (e) {
      throw e;
    }
  }

  handleLifecycleEvent(event) {
    switch (event) {
      case "CONFIGURED":
        this.#configured = true;
        break;
      case "SHUTTING_DOWN":
        await this.shutdown();
        break;
      default:
        break;
    }
  }

  async destroy() {
    if (this.#initCalled) {
      await super.destroy();
      Object.keys(this.#onLifecycleEventCallbacks).forEach(event => {
        this.#onLifecycleEventCallbacks[event] = [];
        delete this.#onLifecycleEventCallbacks[event];
      });
    }
  }
}