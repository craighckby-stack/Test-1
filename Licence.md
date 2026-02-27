class ConfigSchema {
  static get schema() {
    throw new Error('ConfigSchema must be subclassed.');
  }
}

class ConfigSchemaAware {
  #configSchema;

  constructor(configSchema) {
    this.#configSchema = configSchema;
  }

  get schema() {
    return this.#configSchema.schema;
  }
}

abstract class ConfigManager {
  #config;
  #schemaCache = new WeakMap();

  constructor(configSchema, defaultConfig = {}) {
    if (!configSchema.schema) {
      throw new Error('ConfigSchema must be provided.');
    }
    this.#config = defaultConfig;
    this.#schemaCache.set(this.constructor.name, configSchema.schema);
  }

  async loadSchema() {
    return this.#schemaCache.get(this.constructor.name);
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

class LifecycleAware {
  #lifecycleStatus = 'STARTED';

  get lifecycleStatus() {
    return this.#lifecycleStatus;
  }

  set lifecycleStatus(value) {
    this.#handleLifecycleStatusChange(value);
  }

  #handleLifecycleStatusChange(newValue) {
    if (!LifecycleStatuses.isValidStatus(newValue)) {
      throw new Error(`Invalid lifecycle status: ${newValue}`);
    }
    this.#lifecycleStatus = newValue;
  }

  get isConfigured() {
    return this.#lifecycleStatus === LifecycleStatuses.CONFIGURED;
  }

  get isLoaded() {
    return this.#lifecycleStatus === LifecycleStatuses.LOADED;
  }

  get isShuttingDown() {
    return this.#lifecycleStatus === LifecycleStatuses.SHUTTING_DOWN;
  }

  get isStarted() {
    return this.#lifecycleStatus === LifecycleStatuses.STARTED;
  }

  #onStartLifecycleEvent() {
    return this;
  }

  #configure() {
    if (this.isConfigured) {
      return this._self;
    }
    return this._start();
  }

  #start() {
    this.lifecycleStatus = LifecycleStatuses.STARTED;
    if (this.isLoaded) {
      return this._self;
    }
    return this._startLoading();
  }

  #startLoading() {
    if (this.isShuttingDown) {
      return this._self;
    }
    return this._startLifecycle();
  }

  #startLifecycle() {
    const lifecycleEventHandlers = this.lifecycles.handlers;
    console.log('NexusCore lifecycle:', this.lifecycles.handlers.size);
    return Promise.resolve(lifecycleEventHandlers.get('LOADED').await());
  }

  #startShuttingDown() {
    this.lifecycleStatus = LifecycleStatuses.SHUTTING_DOWN;
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
class Loadable {
  #lifecycles;
  #statusManager;

  constructor() {
    this.#lifecycles = new Lifecycles();
    this.#statusManager = new LifecycleStatuses();
  }

  async configure() {
    if (this.#statusManager.lifecycleStatus === LifecycleStatuses.STARTED) {
      return this._self;
    }
    this.#statusManager.lifecycleStatus = LifecycleStatuses.CONFIGURED;
  }

  async load() {
    if (this.#statusManager.lifecycleStatus === LifecycleStatuses.LOADED) {
      return this._self;
    }
    this.#statusManager.lifecycleStatus = LifecycleStatuses.LOADED;
  }

  async shutdown() {
    if (this.#statusManager.lifecycleStatus === LifecycleStatuses.SHUTTING_DOWN) {
      return this._self;
    }
    this.#statusManager.lifecycleStatus = LifecycleStatuses.SHUTTING_DOWN;
  }

  async on(event, handler) {
    return async () => {
      if (this.#lifecycles.handlers.has(event)) {
        try {
          const lifecycleEventHandler = new LifecycleHandler(handler);
          const executeLifecycleEvent = lifecycleEventHandler.execute(event);
          this.#lifecycles.handlers.set(event, await executeLifecycleEvent());
        } catch (e) {
          console.error('Lifecycle event handler error:', e);
          throw e;
        }
      }
    };
  }
}
class Configurable extends Configurable & LifeCycles & Loadable {
  static ConfigSchema = class ConfigSchema extends ConfigSchema {
  static get schema() {
    return {
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
  constructor(configSchema = ConfigSchema) {
    super();
    this.#configSchema = configSchema;
  }
};

onst nexusCore = new Configurable();
nexusCore.on('DESTROYED', () => {
  console.log('NexusCore instance destroyed.');
});
nexusCore.configure();
nexusCore.load();
nexusCore.shutdown();
nexusCore.on('DESTROYED').await();