class ConfigSchema {
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
}

class ConfigManager {
  #schema;
  #config;

  constructor(schema, defaultConfig = {}) {
    this.#schema = schema;
    this.#config = defaultConfig;
  }

  async validate(config) {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.#schema);
      validator.validate(config, this.#schema);
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

class Config extends ConfigManager {
  constructor(schema, defaultConfig = {}) {
    super(schema, defaultConfig);
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

  bind(target = this) {
    this.handler = this.handler.bind(target);
  }

  execute() {
    this.handler();
  }
}

class NexusCore {
  #configManager = new Config(ConfigSchema.schema, Config.defaultConfig);
  #LifecycleEventHandlers = new Map();
  #status = 'INIT';
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  get status() {
    return this.#status;
  }

  set status(value) {
    if (value !== 'INIT' && value !== 'DESTROYED' && value !== 'SHUTDOWN') {
      throw new Error(`${value} is not a valid status`);
    }
    this.#status = value;
    const currentValue = this.#status;
    const lifecycle = this.#lifecycle;
    if (value !== "INIT") {
      console.log(`NexusCore instance is ${value}.`);
      if (value === "SHUTDOWN") {
        this.#lifecycle.shuttingDown = false;
      }
    }
    if (currentValue === 'INIT' && value !== 'INIT') {
      lifecycle.configured = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  configure() {
    this.validateConfig(this.#configManager.getConfig());
    this.#lifecycle.configured = true;
  }

  validateConfig(config) {
    this.#configManager.validate(config);
  }

  onLifecycleEvent(event, handler) {
    if (this.#LifecycleEventHandlers.has(event)) {
      const lifeCycleEventHandler = new LifecycleHandler(handler);
      this.#LifecycleEventHandlers.get(event).handler = handler;
      lifeCycleEventHandler.bind(this);
      this.#LifecycleEventHandlers.set(event, lifeCycleEventHandler);
    }
  }

  get on() {
    return (event, handler) => {
      this.onLifecycleEvent(event, handler);
    };
  }

  executeLifecycleEvent(event) {
    if (this.#LifecycleEventHandlers.has(event)) {
      this.#LifecycleEventHandlers.get(event).execute();
    }
  }

  async load() {
    try {
      console.log('Loading...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Loading complete...');
      this.#lifecycle.loaded = true;
      this.executeLifecycleEvent('LOADED');
      this.status = 'INIT';
    } catch (e) {
      console.error('Load error:', e);
      this.status = 'DESTROYED';
    }
  }

  async shutdown() {
    try {
      await this.executeLifecycleEvent('SHUTTING_DOWN');
      this.status = 'SHUTDOWN';
    } catch (e) {
      console.error('Shutdown error:', e);
      this.status = 'DESTROYED';
    }
  }

  async start() {
    const startMethodOrder = ['configure', 'load', 'shutdown'];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
    this.status = 'INIT';
  }

  async destroy() {
    this.status = 'DESTROYED';
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
    this.#LifecycleEventHandlers.clear();
  }
}

const nexusCore = new NexusCore();
nexusCore.configure();
nexusCore.on('DESTROYED', () => {
  console.log('NexusCore instance destroyed.');
});
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();