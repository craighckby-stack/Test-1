class Config {
  static {
    this.#configSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      }
    };

    this.#defaultConfig = new Proxy({
      foo: 'bar',
      baz: true
    }, {
      set: (target, property, value) => {
        if ('foo' === property && typeof value !== 'string') {
          throw new Error('foo property must be a string');
        }
        if ('baz' === property && typeof value !== 'boolean') {
          throw new Error('baz property must be a boolean');
        }
        target[property] = value;
        return true;
      },
      has: () => true
    });
  }

  static get staticConfig() {
    return Config.#configSchema;
  }

  static validate(values) {
    const validator = new (require('jsonschema').Validator)();
    try {
      validator.checkSchema(Config.#configSchema);
      validator.validate(values, Config.#configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  static merge(defaultConfig, values) {
    return { ...defaultConfig, ...values };
  }
}

class LifecycleEvent {
  constructor(event) {
    this.#event = event;
  }

  get event() {
    return this.#event;
  }
}

class LifecycleHandler {
  constructor(handler) {
    this.#handler = handler;
  }

  bind(target = this) {
    this.#handler = this.#handler.bind(target);
  }

  execute() {
    this.#handler();
  }
}

class NexusCore {
  #config = new Proxy({}, {
    set: (target, property, value) => property in target ? target[property] = value : void 0
  });

  #lifecycle = {
    CONFIGURED: null,
    LOADED: null,
    SHUTTING_DOWN: null,
    SHUTDOWN: null,
    DESTROYED: null
  };

  #status = "INIT";

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    this.#updateLifecycleStatus(value);
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  async configure(config) {
    try {
      this.config = { ...Config.#defaultConfig, ...config };
      Config.validate(this.config);
      this.#lifecycle.CONFIGURED = new LifecycleHandler(() => {
        this.#lifecycle.CONFIGURED.bind(this).execute();
      });
      this.#lifecycle.CONFIGURED.execute();
      this.#updateLifecycleStatus("CONFIGURED");
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  async load() {
    try {
      this.#lifecycle.LOADED = new LifecycleHandler(() => {
        this.#updateLifecycleStatus("LOADED");
      });
      this.#lifecycle.LOADED.execute();
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.SHUTTING_DOWN) {
        this.#lifecycle.SHUTTING_DOWN = new LifecycleHandler(() => {
          this.#updateLifecycleStatus("SHUTTING_DOWN");
        });
        this.#lifecycle.SHUTTING_DOWN.execute();
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    } finally {
      this.#lifecycle.SHUTTING_DOWN = null;
      this.#updateLifecycleStatus("SHUTDOWN");
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (methodName in this) {
        await this[methodName].call(this);
      }
    }
  }

  async destroy() {
    this.status = "DESTROYED";
    this.#lifecycle = {
      CONFIGURED: null,
      LOADED: null,
      SHUTTING_DOWN: null,
      SHUTDOWN: null,
      DESTROYED: new LifecycleHandler(() => {
        this.#updateLifecycleStatus("DESTROYED");
      })
    };
    this.#lifecycle.DESTROYED.execute();
  }

  get config() {
    return this.#config;
  }

  set config(value) {
    this.#config = Config.merge(value);
  }

  #updateLifecycleStatus(status) {
    const lifecycle = this.#lifecycle;
    if (lifecycle.CONFIGURED && status === "CONFIGURED") {
      lifecycle.CONFIGURED = null;
    }
    if (lifecycle.LOADED && status === "LOADED") {
      lifecycle.LOADED = null;
    }
    if (lifecycle.SHUTTING_DOWN && status === "SHUTTING_DOWN") {
      lifecycle.SHUTTING_DOWN = null;
    }
    if (lifecycle.SHUTDOWN && status === "SHUTDOWN") {
      lifecycle.SHUTDOWN = null;
    }
    if (lifecycle.DESTROYED && status === "DESTROYED") {
      lifecycle.DESTROYED = null;
    }
  }

  onLifecycleEvent(event, handler) {
    this.#lifecycle[event] = new LifecycleHandler(handler);
  }

  on(event, handler) {
    this.onLifecycleEvent(event, handler);
  }

  get on() {
    return (event, handler) => {
      this.onLifecycleEvent(event, handler);
    };
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }

  async applyConfig(config) {
    try {
      this.config = Config.merge(Config.#defaultConfig, config);
      Config.validate(this.config);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  toString() {
    return `NexusCore { id: ${this.constructor.name}, status: ${this.status} }`;
  }

  toJSON() {
    return {
      status: this.status,
      lifecycle: this.#lifecycle,
      config: this.config
    };
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.#defaultConfig);
nexusCore.applyConfig({ foo: "bar" });
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();
console.log(nexusCore.toString());
console.log(nexusCore.toJSON());