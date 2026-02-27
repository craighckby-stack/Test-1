class Config {
  #configSchema;
  #defaultConfig;
  #cache;

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true,
      version: "1.0.0",
    };
  }

  constructor(config = {}) {
    this.#defaultConfig = Config.defaultConfig;
    this.#configSchema = this.createConfigSchema();
    this.#cache = this.mergeDefaultConfig(config);
    this.validateConfig();
  }

  createConfigSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' },
        version: { type: 'string' },
      },
      required: ['foo', 'baz', 'version']
    };
  }

  mergeDefaultConfig(defaultConfig) {
    const mergedConfig = Object.assign({}, this.#defaultConfig, defaultConfig);
    const configTimestamp = new Date().getTime();
    this.#cache = {...mergedConfig, configTimestamp};
    return mergedConfig;
  }

  validateConfig() {
    const validator = new (require('jsonschema').Validator)();
    validator.checkSchema(this.#configSchema);
    validator.validate(this.#cache, this.#configSchema);
  }

  get config() {
    return this.#cache;
  }

  set config(value) {
    this.#cache = this.mergeDefaultConfig(value);
    this.validateConfig();
  }
}

class LifecycleEvent {
  #event;
  #handler;

  constructor(event, handler) {
    this.#event = event;
    this.#handler = handler;
  }

  get event() {
    return this.#event;
  }

  set event(event) {
    this.#event = event;
  }

  get handler() {
    return this.#handler;
  }

  set handler(handler) {
    this.#handler = handler;
  }
}

class LifecycleHandler {
  #target;
  #handler;

  constructor(handler, target = this) {
    this.#target = target;
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
  #status;
  #lifecycle;

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    const currentStatus = this.#status;
    const lifecycle = this.#lifecycle;
    console.log(`NexusCore instance is ${value}.`);
    this.#updateLifecycle(currentStatus, value);
  }

  #updateLifecycle(currentStatus, value) {
    if (value === 'SHUTDOWN' && this.#lifecycle.shuttingDown) {
      this.#lifecycle.shuttingDown = false;
    }
    if (currentStatus === 'INIT' && value !== 'INIT') {
      this.#lifecycle.configured = true;
    }
    if (currentStatus === 'LOADED' && value !== 'LOADED') {
      this.#lifecycle.loaded = false;
    }
    if (currentStatus === 'SHUTTING_DOWN' && value !== 'SHUTTING_DOWN') {
      this.#lifecycle.shuttingDown = false;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  constructor() {
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      handlers: [],
      lastLifecycleUpdate: Date.now(),
    };
    this.#status = 'INIT';
  }

  configure(config) {
    return this.#configure(config);
  }

  async #configure(config) {
    await this.validateConfig(config);
    this.#lifecycle.configured = true;
    this.#performLifecycleUpdate('CONFIGURED');
    this.status = 'CONFIGURED';
  }

  async validateConfig(config) {
    const configSchema = Config.configSchema();
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(configSchema);
      validator.validate(config, configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  onLifecycleUpdate(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler, this);
    this.#lifecycle.handlers.push({event, handler: lifecycleHandler.handler});
  }

  get onLifecycleEvent() {
    return (event, handler) => {
      this.onLifecycleUpdate(event, handler);
    };
  }

  async load() {
    console.log("Loading...");
    try {
      await Promise.all(this.#lifecycle.handlers.map(({event, handler}) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Handler for ${event} did not complete within the expected timeframe.`));
          }, 10000);
          handler().finally(() => {
            clearTimeout(timeoutId);
            resolve();
          });
        });
      }));
      this.#lifecycle.loaded = true;
      this.#performLifecycleUpdate('LOADED');
      this.status = 'LOADED';
      return true;
    } catch (e) {
      console.error('Load error:', e);
      return false;
    }
  }

  async shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      this.#lifecycle.shuttingDown = true;
      this.#performLifecycleUpdate('SHUTTING_DOWN');

      try {
        console.log("Shutdown initiated...");
        await Promise.all(this.#lifecycle.handlers.map(({event, handler}) => {
          return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error(`Handler for ${event} did not complete within the expected timeframe.`));
            }, 10000);
            handler().finally(() => {
              clearTimeout(timeoutId);
              resolve();
            });
          });
        }));
        this.status = 'SHUTDOWN';
      } catch (e) {
        console.error("Shutdown error:", e);
      }
    }
  }

  async destroy() {
    this.status = 'DESTROYED';
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      handlers: [],
      lastLifecycleUpdate: Date.now(),
    };
  }

  #performLifecycleUpdate(event) {
    const lifecycle = this.#lifecycle;
    const handler = this.#lifecycle.handlers.find(({event: e}) => e === event);
    this.#updateLifecycle(lifecycle.lastLifecycleUpdate, event);
    if (handler) {
      handler.handler();
    } else {
      console.log(`No handler found for event ${event}.`);
    }
  }
}

const config = new Config();
config.config = { foo: 'baz', baz: false };
const nexusCore = new NexusCore();
nexusCore.status = 'DESTROYED';
nexusCore.onLifecycleEvent('DESTROYED', async () => {
  console.log("NexusCore instance destroyed.");
});

nexusCore.configure(config.config);
await nexusCore.start();
await nexusCore.load();
await nexusCore.shutdown();
await nexusCore.destroy();