class Config {
  #staticConfig = {
    VERSION: "1.0.0",
    env: process.env.NODE_ENV || "development"
  };

  #defaultConfig = {
    foo: 'bar',
    baz: true
  };

  #configSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    }
  };

  static get staticConfig() {
    return this.#staticConfig;
  }

  static get defaultConfig() {
    return this.#defaultConfig;
  }

  static get configSchema() {
    return this.#configSchema;
  }

  constructor(values = {}) {
    const validatedValues = this.validate(values);
    Object.assign(this, validatedValues);
  }

  validate(values) {
    try {
      const schema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(values, schema);
      return values;
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }
}

class LifecycleEvent {
  #eventsToNotify = {};

  constructor(event) {
    this.event = event;
  }

  append(handler) {
    if (!this.#eventsToNotify[event]) {
      this.#eventsToNotify[event] = [];
    }
    this.#eventsToNotify[event].push(handler);
  }

  notify(value) {
    if (this.#eventsToNotify[this.event]) {
      this.#eventsToNotify[this.event].forEach(handler => handler(value, this));
    }
  }
}

class LifecycleHandler {
  #handlersToNotify = {};

  constructor(handler) {
    this.handler = handler;
  }

  append(event, handler) {
    if (!this.#handlersToNotify[event]) {
      this.#handlersToNotify[event] = [];
    }
    this.#handlersToNotify[event].push(handler);
  }

  notify(event, value) {
    if (this.#handlersToNotify[event]) {
      this.#handlersToNotify[event].forEach(handler => handler(value, this));
    }
  }

  bind(target = null) {
    if (target) {
      this.handler = this.handler.bind(target);
    }
  }

  execute() {
    this.handler();
  }
}

class NexusCore {
  #status = "INIT";

  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  #lifecycleEvents = {};

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

  get lifecycle() {
    return this.#lifecycle;
  }

  get lifecycleEvents() {
    return this.#lifecycleEvents;
  }

  configure(config) {
    const validatedConfig = Config.validate(config);
    this.onLifecycleEvent("CONFIGURED", new LifecycleHandler(() => {
      this.#lifecycle.configured = true;
      this.config = config;
    }));
    this.#lifecycleEvents["CONFIGURED"].notify(validatedConfig);
    this.status = "CONFIGURED";
  }

  validateConfig(config) {
    try {
      const schema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(config, schema);
      return config;
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  onLifecycleEvent(event, handler) {
    const lifecycleEvent = new LifecycleEvent(event);
    this.#lifecycleEvents[event] = lifecycleEvent;
    handler.append(event, (value) => {
      lifecycleEvent.append((value) => {
        this.#lifecycleEvents[event].notify(event, value);
      });
    });
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycleEvents[event]) {
      this.#lifecycleEvents[event].bind(this).notify(event, this);
    }
  }

  async load() {
    try {
      await Promise.all([
        this.configure(Config.defaultConfig),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.status = "LOADED";
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        this.status = "SHUTTING_DOWN";
        await this.executeLifecycleEvent("SHUTTING_DOWN");
        this.status = "SHUTDOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (typeof this[methodName] === "function") {
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
    this.#lifecycleEvents = {};
  }

  async on(event, handler) {
    await this.onLifecycleEvent(event, handler);
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();