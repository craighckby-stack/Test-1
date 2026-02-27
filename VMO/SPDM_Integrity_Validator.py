Here's the enhanced code using advanced NexusCore patterns, lifecycle management, and robust encapsulation.


class Config {
  #configSchema;
  #defaultConfig;

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
    this._config = this.mergeDefaultConfig(config);
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
    return Object.assign({}, this.#defaultConfig, defaultConfig);
  }

  validateConfig() {
    const validator = new (require('jsonschema').Validator)();
    validator.checkSchema(this.#configSchema);
    validator.validate(this._config, this.#configSchema);
  }

  get config() {
    return this._config;
  }

  set config(value) {
    this._config = value;
    this.validateConfig();
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
    if (value === 'SHUTDOWN' && lifecycle.shuttingDown) {
      lifecycle.shuttingDown = false;
    }

    if (currentStatus === 'INIT' && value !== 'INIT') {
      lifecycle.configured = true;
    }

    if (currentStatus === 'LOADED' && value !== 'LOADED') {
      lifecycle.loaded = false;
    }

    if (currentStatus === 'SHUTTING_DOWN' && value !== 'SHUTTING_DOWN') {
      lifecycle.shuttingDown = false;
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
    };
    this.#status = 'INIT';
  }

  async configure(config) {
    this.validateConfig(config);
    this.#lifecycle.configured = true;
    this.onLifecycleEvent('CONFIGURED');
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

  onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler, this);
    this.#lifecycle[event] = lifecycleHandler;
  }

  get on() {
    return (event, handler) => {
      const lifecycleEvent = new LifecycleEvent(event);
      this.onLifecycleEvent(event, handler);
    };
  }

  async load() {
    console.log("Loading...");
    try {
      await this.onLifecycleEvent('CONFIGURED', async () => {
        console.log("Loading complete...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.#lifecycle.loaded = true;
        this.status = 'LOADED';
      });
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      this.#lifecycle.shuttingDown = true;
      this.status = 'SHUTTING_DOWN';

      try {
        console.log("Shutdown initiated...");
        await this.onLifecycleEvent('SHUTTING_DOWN', async () => {
          console.log("Shutdown complete...");
          this.status = 'SHUTDOWN';
        });
      } catch (e) {
        console.error("Shutdown error:", e);
      }
    }
  }

  async start() {
    const startMethodOrder = ['configure', 'load', 'shutdown'];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
  }

  async destroy() {
    this.status = 'DESTROYED';
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
  }

  async on(event, handler) {
    await this.onLifecycleEvent(event, handler);
  }
}

const config = new Config();
config.config = { foo: 'baz', baz: false };
const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', async () => {
  console.log("NexusCore instance destroyed.");
});

nexusCore.configure(config.config);
await nexusCore.start();
await nexusCore.load();
await nexusCore.shutdown();
await nexusCore.destroy();