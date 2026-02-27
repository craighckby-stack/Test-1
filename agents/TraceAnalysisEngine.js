class Config {
  #values;

  get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: typeof process !== 'undefined' ? process.env.NODE_ENV || "development" : globalThis.navigator.platform,
    };
  }

  get defaultConfig() {
    return Object.freeze({
      foo: 'bar',
      baz: true,
    });
  }

  get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      },
      required: ['foo', 'baz']
    };
  }

  constructor(values = {}) {
    if (globalThis.Object === null || globalThis.Object !== globalThis.Object && !globalThis.Object.isFrozen(globalThis.Object)) {
      Object.freeze(values);
    }
    if (globalThis.Object === null || globalThis.Object !== globalThis.Object && globalThis.Object.isFrozen(values)) {
      globalThis.console.warn('Config is frozen. Cannot mutate config.');
    }
    this.#values = values;
  }

  get values() {
    return this.#values;
  }

  set values(values) {
    if (globalThis.Object === null || globalThis.Object !== globalThis.Object && globalThis.Object.isFrozen(this.#values)) {
      globalThis.console.warn('Config is frozen. Cannot mutate config.');
    }
    Object.assign(this.#values, values);
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

  set event(event) {
    this.#event = event;
  }
}

class LifecycleHandler {
  #handler;
  #target;

  constructor(handler) {
    this.#handler = handler;
    this.#target = null;
    this.bind();
  }

  bind() {
    this.#handler = this.#handler.bind(this);
    this.#target = this;
  }

  execute() {
    try {
      this.#handler();
    } catch (e) {
      globalThis.console.error(e);
    }
  }

  get target() {
    return this.#target;
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
  };

  #configurable = true;
  #configurablePromise;
  #status = "INIT";
  #destroyed = false;

  get status() {
    return this.#status;
  }

  set status(value) {
    if (!['INIT', 'SHUTDOWN', 'DESTROYED'].includes(value)) {
      globalThis.console.warn(`NexusCore instance is ${value}.`);
    } else {
      this.#status = value;
    }
    const currentValue = this.#status;
    const lifecycle = this.#lifecycle;
    if (currentValue === 'INIT' && value !== 'INIT') {
      lifecycle.configured = true;
    }
    if (currentValue === 'INIT' && value === 'SHUTDOWN') {
      lifecycle.shuttingDown = false;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  get configurable() {
    return this.#configurable;
  }

  set configurable(bool) {
    this.#configurable = bool;
    if (!bool) {
      this.config = null;
      this.#lifecycle.configured = false;
    }
  }

  get config() {
    return this.#config;
  }

  configure(config, callback) {
    if (!this.#configurable) {
      throw new Error("Config is not configurable");
    }
    const currentConfig = this.config;
    const configSchema = Config.configSchema;
    const newKeys = Object.keys(config);
    const oldKeys = Object.keys(currentConfig);
    const removedKeys = oldKeys.filter(key => !newKeys.includes(key));
    if (removedKeys.length || Object.keys(configSchema.properties).some(key => !Object.hasOwn(configSchema.properties, key) && newKeys.includes(key))) {
      throw new Error('Config schema has changed');
    }
    return new Promise((resolve, reject) => {
      const validator = new (globalThis.require('jsonschema').Validator)({});
      validator.checkSchema(configSchema, () => {
        validator.validate(config, configSchema, (err, result) => {
          if (err) {
            reject(new Error('Config validation error: ' + err));
          } else {
            this._validateConfig(config).then(() => {
              resolve();
            });
          }
        });
      });
    });
  }

  _validateConfig(config) {
    return new Promise((resolve) => {
      try {
        this.config = config;
        this.#lifecycle.configured = true;
        this.configurable = false;
        resolve();
      } catch (e) {
        globalThis.console.error(e);
        throw e;
      }
    });
  }

  onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(() => {
      globalThis.console.log(`Executing lifecycle event: ${event}`);
      handler();
    });
    this.#lifecycle[event] = lifecycleHandler;
  }

  get on() {
    return (event, handler) => {
      const lifecycleEvent = new LifecycleEvent(event);
      this.onLifecycleEvent(event, handler);
    };
  }

  async destroy() {
    this.#destroyed = true;
    try {
      await globalThis.globalThis.console.log("Destroy initiated...");
      globalThis.globalThis.console.log("Destroy complete...");
      this.status = "DESTROYED";
      delete this.config;
      this.#lifecycle.configured = false;
      this.#lifecycle.loaded = false;
      this.#lifecycle.shuttingDown = false;
      this.configurable = false;
      Object.freeze(this);
    } catch (e) {
      globalThis.console.error(e);
    }
  }

  async shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      globalThis.console.log("Shutdown initiated...");
      try {
        await new Promise(resolve => globalThis.setTimeout(resolve, 1000));
        globalThis.console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      } catch (e) {
        globalThis.console.error(e);
        this.#lifecycle.shuttingDown = false;
      }
    }
  }

  async load() {
    try {
      globalThis.console.log("Loading...");
      await new Promise(resolve => globalThis.setTimeout(resolve, 1000));
      globalThis.console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.onLifecycleEvent('LOADED');
    } catch (e) {
      globalThis.console.error('Load error:', e);
    }
  }

  async execute(event, handler) {
    globalThis.console.log(`Executing event: ${event}`);
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind().execute();
    }
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  globalThis.console.log("NexusCore instance destroyed.");
});
try {
  await nexusCore.configure(Config.defaultConfig);
  nexusCore.execute('CONFIGURED');
  nexusCore.load();
  await nexusCore.shutdown();
  nexusCore.execute('SHUTDOWN');
  await nexusCore.destroy();
} catch (e) {
  globalThis.console.error(e);
}