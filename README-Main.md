class Config {
  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  #defaultConfig = new Proxy({
    foo: 'bar',
    baz: true
  }, {
    get(target, property) {
      return target.hasOwnProperty(property) ? target[property] : Config.staticConfig[property];
    },
    set(target, property, value) {
      if (Object.hasOwn(target, property)) {
        target[property] = value;
      } else {
        target[property] = Config.staticConfig[property];
      }
      return true;
    }
  });

  constructor(initialValues = {}) {
    this._config = new Proxy({...this.#defaultConfig}, {
      set(target, property, value) {
        Config.#validate(target, value);
        target[property] = value;
        return true;
      }
    });
    Object.assign(this._config, initialValues);
  }

  static #validate(obj, value) {
    try {
      const schema = Config.#defaultConfig;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(value, schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get config() {
    return new Proxy({ ...this._config }, {
      set(target, property, value) {
        Config.#validate(target, value);
        target[property] = value;
        return true;
      }
    });
  }

  get configSchema() {
    return new Proxy({
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' },
        ...Config.staticConfig
      }
    }, {
      get(target, property) {
        if (Object.hasOwn(target, property)) return target[property];
        else return Config.staticConfig[property];
      }
    });
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

  bind(target) {
    return (event) => this.handler(event);
  }

  execute(event) {
    this.handler(event);
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    destroyed: false
  };

  #status = "INIT";

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    const lifecycle = this.#lifecycle;
    if (value !== 'INIT') {
      globalThis.console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        lifecycle.shuttingDown = false;
      } else if (value === 'DESTROYED') {
        lifecycle.destroyed = true;
        lifecycle.configured = false;
        lifecycle.loaded = false;
        lifecycle.shuttingDown = false;
      }
    }
    if (globalThis.console.currentValue !== 'INIT' && value === 'INIT') {
      lifecycle.configured = false;
      lifecycle.loaded = false;
    }
    if (value !== 'INIT' && lifecycle.configured && value === 'LOAD' || value !== 'INIT' && lifecycle.configured === false && globalThis.console.currentValue !== 'INIT' && value !== 'LOAD' && value !== 'START' && value !== 'DESTROY') {
      lifecycle.shuttingDown = false;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  async configure(config, validate = true) {
    if (validate) {
      this.validateConfig(config);
    }
    this.#lifecycle.configured = true;
    this._config = config;
  }

  async validateConfig(config) {
    if (!this.validateSchema(config)) {
      throw new Error('Invalid config');
    }
  }

  async validateSchema(config) {
    try {
      const schema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(config, schema);
      return true;
    } catch (e) {
      globalThis.console.error('Config validation error:', e);
      throw e;
    }
  }

  async load() {
    await this.executeLifecycleEvent("CONFIGURED");
    try {
      globalThis.console.log("Loading...");
      await new Promise(resolve => globalThis.setTimeout(resolve, 1000));
      globalThis.console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.executeLifecycleEvent("LOADED");
    } catch (e) {
      globalThis.console.error('Load error:', e);
    }
  }

  async shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      try {
        globalThis.console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        this.executeLifecycleEvent("SHUTTING_DOWN");
        globalThis.console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      } catch (e) {
        globalThis.console.error("Shutdown error:", e);
      }
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (globalThis.console.hasOwnProperty(methodName) && globalThis.console[methodName] instanceof globalThis.Function && !this.#lifecycle.destroyed) {
        await this[methodName]();
      }
    }
    this.status = "RUNNING";
  }

  async destroy() {
    this.status = "DESTROYED";
    this.#lifecycle.destroyed = true;
    this.#lifecycle.configured = false;
    this.#lifecycle.loaded = false;
    this.#lifecycle.shuttingDown = false;
  }

  async on(event, handler) {
    return this.#lifecycle[event] = new LifecycleHandler(handler);
  }

  async executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }
}

class NexusCoreDecorator {
  #nexusCore;
  #logLevel = 'INFO';

  constructor(nexusCore) {
    this.#nexusCore = nexusCore;
  }

  get nexusCore() {
    return this.#nexusCore;
  }

  set logLevel(level) {
    this.#logLevel = level;
  }

  get logLevel() {
    return this.#logLevel;
  }

  enableLogging() {
    globalThis.console.log(`Logging level set to ${this.#logLevel}.`);
  }
}

class NexusConfig {
  #nexusCore;
  #nexusConfig;

  constructor(nexusCore) {
    this.#nexusCore = nexusCore;
  }

  async init() {
    this.#nexusConfig = new Config();
    this.#nexusConfig.setConfig(Config.defaultConfig);
    await this.#nexusCore.configure(this.#nexusConfig.config);
  }
}

const nexusCore = new NexusCore();
const nexusConfig = new NexusConfig(nexusCore);
await nexusConfig.init();

nexusCore.on('DESTROYED', () => {
  globalThis.console.log("NexusCore instance destroyed.");
});

nexusCore.start();

const nexusCoreDecorator = new NexusCoreDecorator(nexusCore);
nexusCoreDecorator.enableLogging();

globalThis.console.currentValue = 'INIT';