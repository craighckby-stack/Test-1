// Static configuration class.
class Config {
  #staticConfig;
  #config;

  constructor(config = {}) {
    this.#staticConfig = {
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

    this.#config = this.#mergeConfigs({defaultConfig: this.#staticConfig.defaultConfig, ...config});
    this.#validateConfig();
  }

  get StaticConfig() {
    return this.#staticConfig;
  }

  get Config() {
    return this.#config;
  }

  #mergeConfigs(configs) {
    return Object.assign({}, ...Object.keys(configs).map(key => ({ [key]: configs[key] })));
  }

  #getConfigSchema() {
    return this.#staticConfig.configSchema;
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
}

// Base class for all lifecycle events.
class LifecycleEvent {
  #event;
  #target;

  constructor(event, target) {
    this.#event = event;
    this.#target = target;
  }

  bind(target) {
    this.#target = target;
  }

  execute() {
    this.#event(this.#event.target);
  }

  get event() {
    return this.#event;
  }
}

// Abstract base class for the event interface.
abstract class EventInterface {
  #events = {};

  on(event, handler) {
    if (!this.#events[event]) {
      this.#events[event] = [];
    }
    this.#events[event].push(handler);
  }

  #trigger(event, ...args) {
    const handlers = this.#events[event];
    if (handlers) {
      handlers.forEach(handler => {
        handler(...args);
      });
    }
  }

  trigger(event, ...args) {
    const eventWrapper = new LifecycleEvent(event);
    this.#trigger(event, eventWrapper);
  }
}

// Handler for lifecycle events that should be executed when the application starts up.
class LifecycleHandler {
  #events = [];
  #executeMethod;
  #target;

  constructor(events, executeMethod, target) {
    this.#events = events.map((event) => new LifecycleEvent(event, target));
    this.#executeMethod = executeMethod;
    this.#target = target;
  }

  bind() {
    this.#events.forEach((event) => {
      event.bind(this.#target);
    });
  }

  execute() {
    if (typeof this.#executeMethod === 'function') {
      this.#executeMethod.call(this.#target);
    }
    return this.#events.every(event => event.event === 'COMPLETED');
  }
}

// Base class for services.
abstract class BaseService {
  #services = {};
  #initialized = false;

  constructor(name) {
    if (!this.#initialized) {
      throw new Error('BaseService must be extended from a class with an "initialize" method.');
    }
  }

  getService(name) {
    return this.#services[name];
  }

  get isInitialized() {
    return this.#initialized;
  }
}

// Events in the application lifecycle.
class NexusCoreLifecycleEvents extends EventInterface {
  #events = {
    CONFIGURED: 'configured',
    LOADED: 'loaded',
    SHUTDOWN_COMPLETE: 'shutdownComplete',
  };

  on(event, handler) {
    super.on(this.#events[event], handler);
  }

  trigger(event, ...args) {
    const eventToCall = this.#events[event];
    super.trigger(eventToCall, ...args);
  }
}

// The base class for the application's lifecycle management.
class NexusCore extends BaseService {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };
  #status = 'INIT';
  #config;
  #eventInterface;

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
    this.#eventInterface = new NexusCoreLifecycleEvents();
    this.#eventInterface.on('DESTROYED', new LifecycleHandler(() => {
      console.log("NexusCore instance destroyed.");
    }, () => {
      this.#eventInterface.trigger('DESTROYED');
    }));

    this.#config = new Config();
  }

  // Start configuration of the application.
  async configure() {
    await this.#eventInterface.trigger('CONFIGURING');
    const config = await this.#config.Config;
    await this.#eventInterface.trigger('VALIDATING_CONFIG', config);
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.#eventInterface#getConfigSchema());
      validator.validate(config, this.#eventInterface#getConfigSchema());
    } catch (e) {
      console.error('Config validation error:', e);
      return Promise.reject(e);
    }
    this.#eventInterface.trigger('CONFIGURED');
    this.#lifecycle.configured = true;
    return Promise.resolve(config);
  }

  #getConfigSchema() {
    return this.#config.StaticConfig.configSchema;
  }

  on(event, handlerOrInitialStatus) {
    this.#eventInterface.on(event, handlerOrInitialStatus);
  }

  get eventInterface() {
    return this.#eventInterface;
  }

  async executeLifecycleEvent(event) {
    if (typeof this.#lifecycle[event] === 'function') {
      this.#lifecycle[event].call(this);
    }
  }

  // Start loading the application.
  async load() {
    await this.#eventInterface.trigger('LOADING');
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.#eventInterface.trigger('LOADED');
    this.#lifecycle.loaded = true;
    this.#eventInterface.trigger('COMPLETED');
  }

  // Start shutting down the application.
  async shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      this.#eventInterface.trigger('SHUTDOWN_INITIATED');
      this.#lifecycle.shuttingDown = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.#eventInterface.trigger('SHUTTING_DOWN_COMPLETE');
      this.#lifecycle.shuttingDown = false;
      this.#eventInterface.trigger('SHUTDOWN_COMPLETE');
      this.status = "SHUTDOWN";
    }
    return true;
  }

  // Start the application.
  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this.methods[methodName] instanceof Function) {
        await this.methods[methodName].call(this);
      }
    }
  }

  // Destroy the application.
  async destroy() {
    this.status = "DESTROYED";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
  }
}

// Handler for loading the application.
class NexusCoreLifecycleHandler extends LifecycleHandler {
  constructor(nexusCore) {
    const events = ['CONFIGURED', 'LOADED'];
    super(events, nexusCore.load, nexusCore);
  }
}

// Service for the application.
class NexusCoreService extends BaseService {
  constructor(nexusCore) {
    this.nexusCore = nexusCore;
    super('NexusCoreService', {
      configure: nexusCore.configure,
      load: this.#loadWrapper,
      shutdown: nexusCore.shutdown,
      start: nexusCore.start,
      destroy: nexusCore.destroy,

      get status() {
        return nexusCore.status;
      }
    });
  }

  #loadWrapper() {
    const nccdh = new NexusCoreLifecycleHandler(this.nexusCore);
    nccdh.bind(this.nexusCore);
    return nccdh.execute();
  }
}

// Create an instance of the NexusCore class.
class Main {
  static async main() {
    const nexusCore = new NexusCore({
      configure: NexusCore.prototype.configure,
      load: NexusCore.prototype.load,
      shutdown: NexusCore.prototype.shutdown,
      start: NexusCore.prototype.start,
      destroy: NexusCore.prototype.destroy,

      get status() {
        return NexusCore.prototype.status;
      }
    });

    const nexusCoreService = new NexusCoreService(nexusCore);
    nexusCoreService.start().then(() => {
      nexusCoreService.configure().then(() => {
        nexusCoreService.load().then(() => {
          nexusCoreService.shutdown().then(() => {
            nexusCoreService.destroy();
          });
        });
      });
    });
  }
}

// Start the main function.
Main.main();