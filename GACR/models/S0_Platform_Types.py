class Config {
  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development",
      defaultConfig: {
        foo: 'bar',
        baz: true
      },
      configSchema: {
        type: 'object',
        properties: {
          foo: { type: 'string' },
          baz: { type: 'boolean' }
        }
      }
    };
  }

  constructor(values) {
    this.#config = {
      ...Config.staticConfig,
      ...values
    };

    this.#validateConfig();
  }

  #validateConfig() {
    try {
      const schema = this.#getConfigSchema();
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(this.#config, schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  #getConfigSchema() {
    return this.constructor.configSchema;
  }

  getConfig() {
    return { ...this.#config, ...Config.staticConfig };
  }
}

class LifecycleEvent {
  constructor(event) {
    this.event = event;
  }
}

class LifecycleHandler {
  constructor(events) {
    this.events = events;
  }

  bind(target = this) {
    this.events.forEach((event) => {
      event.bind(target);
    });
  }

  execute() {
    this.events.forEach((event) => {
      event.execute();
    });
  }
}

class BaseService {
  #services = {};
  #initialized = false;

  constructor(name, methods) {
    if (!this.#initialized) {
      throw new Error('BaseService must be extended from a class with an "initialize" method.');
    }

    this.#services[name] = methods;
  }

  getService(name) {
    return this.#services[name];
  }

  get isInitialized() {
    return this.#initialized;
  }
}

class BaseLifecycleHandler {
  constructor(handler, service) {
    this.handler = handler;
    this.service = service;
  }

  execute() {
    return this.handler();
  }

  bind(target) {
    this.handler.bind(target);
  }
}

class EventInterface {
  constructor() {
    this.#handlers = {};
  }

  #registerHandler(event, handler) {
    const handlers = this.#handlers[event] || [];
    handlers.push(handler);
    this.#handlers[event] = handlers;
  }

  on(event, handler) {
    this.#registerHandler(event, handler);
  }

  trigger(event, ...args) {
    const handlers = this.#handlers[event];
    if (handlers) {
      handlers.forEach(handler => {
        handler(...args);
      });
    }
  }
}

class NexusCore extends BaseService {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };
  #status = 'INIT';

  get lifecycle() {
    return this.#lifecycle;
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        this.#lifecycle.shuttingDown = false;
      }
    }
    this.#status = value;
  }

  initialize(methods) {
    super('NexusCore', methods);
    this.#initialized = true;

    this.on('DESTROYED', new BaseLifecycleHandler(() => {
      console.log("NexusCore instance destroyed.");
    }));
  }

  async configure(config = Config.defaultConfig) {
    try {
      await this.validateConfig(config);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
    this.trigger('CONFIGURED');
    this.#lifecycle.configured = true;
    this.config = config;
  }

  async validateConfig(config) {
    const schema = Config.staticConfig.configSchema;
    const validator = new (require('jsonschema').Validator)();
    validator.checkSchema(schema);
    validator.validate(config, schema);
  }

  on(event, handlerOrInitialStatus) {
    this.#registerHandler(event, handlerOrInitialStatus);
  }

  #registerHandler(event, handlerOrInitialStatus) {
    super.getService('NexusCore').on(event, handler => {
      if (this.#status === 'INIT') {
        if (event === 'DESTROYED') this.status = 'DESTROYED';
        else {
          console.warn('Lifecycle event for event "${event}" skipped because the NexusCore instance is already ${this.#status}');
        }
      } else {
        if (typeof handler === 'function') {
          handler(this.config, this.#status);
        } else {
          handlerOrInitialStatus.target = this;
          handlerOrInitialStatus();
        }
      }
    });
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }

  async load() {
    console.log("Loading...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Loading complete...");
    this.#lifecycle.loaded = true;
    this.executeLifecycleEvent("LOADED");
  }

  async shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      console.log("Shutdown initiated...");
      this.#lifecycle.shuttingDown = true;
      this.executeLifecycleEvent("SHUTTING_DOWN");
      console.log("Shutdown complete...");
      this.status = "SHUTDOWN";
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (super.getService('NexusCore')[methodName] instanceof Function) {
        await super.getService('NexusCore')[methodName]();
      }
    }
  }

  async destroy() {
    this.status = "DESTROYED";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
  }
}

class NexusCoreService extends BaseService {
  constructor(nexusCore) {
    this.nexusCore = nexusCore;
    super('NexusCoreService', {
      configure: nexusCore.configure,
      load: nexusCore.load,
      shutdown: nexusCore.shutdown,
      start: nexusCore.start,
      destroy: nexusCore.destroy
    });
  }
}

const nexusCore = new NexusCore({
  configure: NexusCore.prototype.configure,
  load: NexusCore.prototype.load,
  shutdown: NexusCore.prototype.shutdown,
  start: NexusCore.prototype.start,
  destroy: NexusCore.prototype.destroy,

  get status() {
    return this.nexusCore.status;
  }
});
const nexusCoreService = new NexusCoreService(nexusCore);
nexusCoreService.start();
nexusCoreService.configure();
nexusCoreService.load();
nexusCoreService.shutdown();
nexusCoreService.destroy();