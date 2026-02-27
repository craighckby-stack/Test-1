class Config {
  static get staticConfig() {
    return new Proxy({
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development",
      defaultConfig: new Proxy({
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
      })
    }, {
      get(target, property) {
        return target[property];
      }
    });
  }

  #defaultConfig = Config.staticConfig.defaultConfig;

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
      const schema = Config.staticConfig.defaultConfig;
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
        ...Config.staticConfig.defaultConfig
      }
    }, {
      get(target, property) {
        if (Object.hasOwn(target, property)) return target[property];
        else return Config.staticConfig.defaultConfig[property];
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
      console.log(`NexusCore instance is ${value}.`);
      if (value === "SHUTDOWN") {
        lifecycle.shuttingDown = false;
      } else if (value === "DESTROYED") {
        lifecycle.destroyed = true;
        lifecycle.configured = false;
        lifecycle.loaded = false;
        lifecycle.shuttingDown = false;
      }
    }
    if (console.currentValue !== 'INIT' && value === 'INIT') {
      lifecycle.configured = false;
      lifecycle.loaded = false;
    }
    if (value !== 'INIT' && lifecycle.configured && value === "LOAD" || value !== 'INIT' && lifecycle.configured === false && console.currentValue !== 'INIT' && value !== "LOAD" && value !== "START" && value !== "DESTROY") {
      lifecycle.shuttingDown = false;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  async configure(config, validate = true) {
    if (validate) {
      try {
        await this.validateSchema(config);
        this._config = config;
      } catch (e) {
        throw e;
      }
    }
    this.#lifecycle.configured = true;
  }

  async validateSchema(config) {
    try {
      const schema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(config, schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  load() {
    if (!this.#lifecycle.loadInitiated) {
      this.#lifecycle.loadInitiated = true;
      this.executeLifecycleEvent("CONFIGURED");
      try {
        console.log("Loading...");
        return new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.error('Load error:', e);
      }
    }
  }

  async shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      try {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        this.executeLifecycleEvent("SHUTTING_DOWN");
        console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      } catch (e) {
        console.error("Shutdown error:", e);
      }
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (console.hasOwnProperty(methodName) && console[methodName] instanceof Function && !this.#lifecycle.destroyed) {
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

  on(event, handler) {
    return this.#lifecycle[event] = new LifecycleHandler(handler);
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }
}

class NexusCoreDecorator {
  static wrap(nexusCore) {
    const decorator = new NexusCoreDecorator(nexusCore);
    globalThis.console.log(`Logging level set to INFO.`);
    return decorator;
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
   await this.#nexusCore.configure(this.#nexusConfig.config, false);
  }

  get nexusCore() {
    return this.#nexusCore;
  }

  get nexusConfig() {
    return this.#nexusConfig;
  }
}

const globalNexusCore = new NexusCore();
const nexusConfig = new NexusConfig(globalNexusCore);
const nexusCoreDecorator = NexusCoreDecorator.wrap(globalNexusCore);
await nexusConfig.init();

globalNexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});

globalNexusCore.start();