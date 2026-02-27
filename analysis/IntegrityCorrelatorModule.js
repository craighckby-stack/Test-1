class Config {
  static get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      },
      required: ['foo', 'baz']
    };
  }

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
  }

  static async getConfig(values = {}) {
    const config = { ...Config.defaultConfig, ...values };
    await this.validateConfig(config);
    return config;
  }

  static async validateConfig(config) {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema,this.configSchema);
      validator.validate(config, this.configSchema);
    } catch (e) {
      throw e;
    }
  }
}

class Lifecycle {
  #events = {};

  eventNamespace(event, handler) {
    if (!this.#events[event]) {
      this.#events[event] = new LifecycleEvent(event);
    }
    this.#events[event].addHandler(handler);
  }

  removeEventHandler(event, handler) {
    if (this.#events[event]) {
      this.#events[event].removeHandler(handler);
    }
  }

  notify(event, data) {
    if (this.#events[event]) {
      this.#events[event].notify(data);
    }
  }

  get events() {
    return this.#events;
  }
}

class LifecycleEvent {
  #name;
  #data;
  #handlers = [];

  constructor(event, data = {}) {
    this.#name = event;
    this.#data = data;
  }

  addHandler(handler) {
    this.#handlers.push(handler);
  }

  removeHandler(handler) {
    const index = this.#handlers.indexOf(handler);
    if (index >= 0) {
      this.#handlers.splice(index, 1);
    }
  }

  notify(data = {}) {
    this.#data = { ...this.#data, ...data };
    this.#handlers.forEach(handler => handler.execute(this));
  }

  get name() {
    return this.#name;
  }

  get data() {
    return this.#data;
  }

  get handlers() {
    return this.#handlers;
  }
}

class LifecycleHandler {
  #handler;
  #target;

  constructor(handler, target) {
    this.#handler = handler;
    this.#target = target;
    this.bind();
  }

  bind() {
    this.#handler = this.#handler.bind(this.#target);
  }

  execute(event) {
    this.#handler(event);
  }
}

class NexusCore {
  #config = null;
  #lifecycle = new Lifecycle();
  #statusLifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };
  #status = 'INIT';

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    this.logStatus(value);
    if (value !== 'INIT') {
      if (value === 'SHUTDOWN') {
        this.#lifecycle>StatusLifecycle().shuttingDown = false;
      }
      this.#statusLifecycle(configured) = true;
    }
  }

  get statusLifecycle() {
    return this.#statusLifecycle;
  }

  logStatus(status) {
    globalThis.console.log(`NexusCore instance is ${status} (${new Date().toISOString()})`);
  }

  getConfigSchema() {
    return Config.configSchema;
  }

  async configure(config) {
    try {
      this.#config = await Config.getConfig(config);
      this.#lifecycle.eventNamespace('CONFIGURED', event => event.data = this.#config);
      this.status = 'CONFIGURED';
      this.#statusLifecycle.configured = true;
    } catch (e) {
      globalThis.console.error('Configure error:', e);
    }
  }

  async load() {
    try {
      this.#lifecycle.notify('LOADED');
      this.status = 'LOADING';
      globalThis.console.log('Loading...');
      await new globalThis.Promise(resolve => globalThis.setTimeout(resolve, 1000));
      globalThis.console.log('Loading complete...');
      this.#statusLifecycle.loaded = true;
      this.#lifecycle.notify('LOADED');
      this.status = 'LOADED';
    } catch (e) {
      globalThis.console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#statusLifecycle.shuttingDown) {
        this.#statusLifecycle.shuttingDown = true;
        globalThis.console.log('Shutdown initiated...');
        this.#lifecycle.notify('SHUTTING_DOWN');
        globalThis.console.log('Shutdown complete...');
        this.status = 'SHUTDOWN';
      }
    } catch (e) {
      globalThis.console.error('Shutdown error:', e);
    }
  }

  async start() {
    const startMethodOrder = ['configure', 'load', 'shutdown'];
    for (const methodName of startMethodOrder) {
      try {
        if (this[methodName] instanceof Function) {
          await this[methodName]();
        }
      } catch (e) {
        globalThis.console.error(`${methodName} error:`, e);
      }
    }
  }

  async destroy() {
    try {
      this.status = 'DESTROYED';
      this.#config = null;
      this.#statusLifecycle = {
        configured: false,
        loaded: false,
        shuttingDown: false
      };
    } catch (e) {
      globalThis.console.error('Destroy error:', e);
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  get config() {
    return this.#config;
  }

  get configSchema() {
    return this.getConfigSchema();
  }
}

class CustomEventHandler {
  execute(event) {
    globalThis.console.log(`Received ${event.name} event with data: ${JSON.stringify(event.data)}`);
  }
}

const nexusCore = new NexusCore();
nexusCore.lifecycle.eventNamespace('DESTROYED', new CustomEventHandler());
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();