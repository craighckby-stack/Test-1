class ConfigSchema {
  get schema() {
    throw new Error('ConfigSchema must be subclassed.');
  }
}

class ConfigManager {
  #schema;
  #config;
  #schemaCache = new WeakMap();

  constructor(schema, defaultConfig = {}) {
    this.#schema = schema;
    this.#config = defaultConfig;
  }

  async loadSchema() {
    if (!this.constructor.schemaCache.has(this.constructor.name)) {
      this.constructor.registerSchema();
    }
    return this.constructor.schemaCache.get(this.constructor.name);
  }

  async validate(config) {
    try {
      const schema = await this.loadSchema();
      const validator = new (await import('jsonschema')).Validator();
      validator.checkSchema(schema);
      validator.validate(config, schema);
      return true;
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get defaultConfig() {
    return this.#config;
  }

  setValues(values) {
    this.#config = { ...this.#config, ...values };
    this.validate(values);
  }

  getConfig() {
    return this.#config;
  }
}

class Lifecycles {
  #lifecycleEventHandlers = new Map();

  on(event, handler) {
    return (async () => {
      if (this.#lifecycleEventHandlers.has(event)) {
        try {
          const lifecycleEventHandler = new LifecycleHandler(handler);
          const executeLifecycleEvent = lifecycleEventHandler.execute(event);
          this.#lifecycleEventHandlers.set(event, await executeLifecycleEvent());
        } catch (e) {
          console.error('Lifecycles error:', e);
          throw e;
        }
      }
    })();
  }

  get handlers() {
    return this.#lifecycleEventHandlers;
  }

  clear() {
    return (this.#lifecycleEventHandlers.clear());
  }
}

class LifecycleHandler {
  constructor(handler) {
    this.handler = handler;
  }

  async execute(event) {
    try {
      const result = await this.handler(event);
      return result;
    } catch (e) {
      console.error('Lifecycle event handler error:', e);
      throw e;
    }
  }
}

class Configurable {
  #configManager = new ConfigManager(this.constructor.ConfigSchema);

  get configManager() {
    return this.#configManager;
  }

  async configure() {
    const config = this.configManager.getConfig();
    console.log('Configuration validated:', await this.configManager.validate(config));
    return config;
  }
}

class Loadable {
  #lifecycles = new Lifecycles();

  get lifecycles() {
    return this.#lifecycles;
  }

  async on(event, handler) {
    await this.lifecycles.on(event, handler);
  }

  async load() {
    try {
      console.log('Loading...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Loading complete...');
      return true;
    } catch (e) {
      console.error('Load error:', e);
      throw e;
    }
  }

  async shutDown() {
    try {
      console.log('Shutting down...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Shutting down complete...');
      return true;
    } catch (e) {
      console.error('Shutdown error:', e);
      throw e;
    }
  }
}

class ShuttingDownHandler {
  constructor(handler) {
    this.handler = handler;
  }

  async onShuttingDown() {
    return async () => {
      if (this.handler) {
        await this.handler('SHUTTING_DOWN');
      }
    };
  }
}

class LifecycleAware {
  #status = LifecycleStatuses.STARTED;

  get status() {
    return this.#status;
  }

  set status(value) {
    if (!LifecycleStatuses.isValidStatus(value)) {
      throw new Error(`Invalid lifecycle status: ${value}`);
    }
    this.#status = value;
  }

  get isConfigured() {
    return this.#status === LifecycleStatuses.CONFIGURED;
  }

  get isLoaded() {
    return this.#status === LifecycleStatuses.LOADED;
  }

  get isShuttingDown() {
    return this.#status === LifecycleStatuses.SHUTTING_DOWN;
  }

  get isStarted() {
    return this.#status === LifecycleStatuses.STARTED;
  }

  #onStartLifecycleEvent() {
    return this;
  }

  #configure(lifecycle) {
    if (this.isConfigured) {
      return this._self;
    }
    return this._start(lifecycle);
  }

  #start(lifecycle) {
    this.status = LifecycleStatuses.STARTED;
    if (this.isLoaded) {
      return this._self;
    }
    return this._startLoading(lifecycle);
  }

  #startLoading(lifecycle) {
    if (this.isShuttingDown) {
      return this._self;
    }
    return this._startLifecycle(lifecycle);
  }

  #startLifecycle(lifecycle) {
    const lifecycleEventHandlers = lifecycle.lifecycles.handlers;
    console.log('NexusCore lifecycle:', this.lifecycles.handlers.size);
    return Promise.resolve(lifecycleEventHandlers.get('LOADED').await());
  }

  #startShuttingDown() {
    this.status = LifecycleStatuses.SHUTTING_DOWN;
    if (this.isConfigured && this.isLoaded) {
      return this._self;
    }
    return this._startLifecycle();
  }
}

class LifecycleStatuses {
  static STARTED = 'STARTED';
  static CONFIGURED = 'CONFIGURED';
  static LOADED = 'LOADED';
  static SHUTTING_DOWN = 'SHUTTING_DOWN';
  static DESTROYED = 'DESTROYED';

  static isValidStatus(status) {
    return [
      LifecycleStatuses.STARTED,
      LifecycleStatuses.CONFIGURED,
      LifecycleStatuses.LOADED,
      LifecycleStatuses.SHUTTING_DOWN,
      LifecycleStatuses.DESTROYED
    ].includes(status);
  }
}

class NexusCore extends (
  Configurable & Loadable & LifecycleAware & Lifecycles
) {
  async configure() {
    const config = await super.configure();
    console.log('Configured configuration:', config);
    return config;
  }

  on(event, handler) {
    return async () => {
      if (this.#lifecycleStatusManager.lifecycles.handlers.has(event)) {
        try {
          const lifecycleEventHandler = new LifecycleHandler(handler);
          const executeLifecycleEvent = lifecycleEventHandler.execute(event);
          await this.#lifecycleStatusManager.lifecycles.handlers.set(event, await executeLifecycleEvent());
        } catch (e) {
          console.error('Lifecycle event handler error:', e);
          throw e;
        }
      }
    };
  }

  async onload() {
    this.status = LifecycleStatuses.LOADED;
    return this;
  }

  async shutdown() {
    this.status = LifecycleStatuses.SHUTTING_DOWN;
    return await super.shutDown();
  }

  async onShutdownComplete() {
    this.status = LifecycleStatuses.DESTROYED;
    return this;
  }

  async _startLifecycle(event) {
    return await super.#onStartLifecycleEvent();
  }
}

class ConfigSchema extends ConfigSchema {
  static schema = {
    type: 'object',
    properties: {
      VERSION: { type: 'string' },
      env: { type: 'string' },
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    },
    required: ['VERSION', 'env', 'foo', 'baz']
  };
}

const ConfigSchemaNexusCore = class extends Configurable & Lifecycles {
  constructor(configSchema = ConfigSchema) {
    super(configSchema);
  }

  static schemaCache = new Map();

  static registerSchema() {
    if (!NexusCore.schemaCache.has(NexusSchema)) {
      const schema = new (await import('jsonschema')).Schema(schema, );
      NexusCore.schemaCache.set(NexusSchema, schema);
    }
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log('NexusCore instance destroyed.');
});
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();