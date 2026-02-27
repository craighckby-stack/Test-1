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

  constructor(values = {}) {
    this.setValues(values);
  }

  setValues(values) {
    Object.assign(this, values);
  }

  validate() {
    try {
      const schema = this.constructor.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(this, schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
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

class BaseLifecycleHandler {
  constructor(handler) {
    this.handler = handler;
  }

  execute() {
    this.handler();
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  get lifecycle() {
    return this.#lifecycle;
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    const currentValue = this.#status;
    const lifecycle = this.#lifecycle;
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        lifecycle.shuttingDown = false;
      }
    }
    if (currentValue === 'INIT' && value !== 'INIT') {
      lifecycle.configured = true;
    }
  }

  constructor() {
    this.on("DESTROYED", new BaseLifecycleHandler(() => {
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
    await this.onLifecycleEvent("CONFIGURED");
    this.#lifecycle.configured = true;
    this.config = config;
  }

  async validateConfig(config) {
    const schema = Config.configSchema;
    const validator = new (require('jsonschema').Validator)();
    validator.checkSchema(schema);
    validator.validate(config, schema);
  }

  onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler([new LifecycleEvent(event), handler]);
    return lifecycleHandler;
  }

  on(event, handlerOrInitialStatus) {
    const lifecycleHandler = this.onLifecycleEvent(event, (target) => {
      if (target.status === 'INIT') {
        if (event === 'DESTROYED') this.status = 'DESTROYED';
        else
          console.warn('Lifecycle event for event "${event}" skipped because the NexusCore instance is already ${this.status}');
      } else {
        handlerOrInitialStatus.target = target;
        handlerOrInitialStatus(config = target.config, status = target.#status)();
      }
    });
    this.#lifecycle[event] = lifecycleHandler;
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }

  async load() {
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.executeLifecycleEvent("LOADED");
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        this.executeLifecycleEvent("SHUTTING_DOWN");
        console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
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

const nexusCore = new NexusCore();
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();