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

  constructor(values = Config.defaultConfig) {
    const validatedValues = this.validate(values);
    Object.assign(this, validatedValues);
  }

  async validate(values = {}) {
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

  #lifecycleHandlers = {};

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

  get lifecycleHandlers() {
    return this.#lifecycleHandlers;
  }

  async configure(config) {
    try {
      const validatedConfig = await Config.validate(config);
      this.#lifecycleHandlers['CONFIGURED'] = new LifecycleHandler(() => {
        this.#lifecycle.configured = true;
        this.config = config;
      });
      this.#lifecycleEvents['CONFIGURED'] = new LifecycleEvent('CONFIGURED');
      this.#lifecycleEvents['CONFIGURED'].append(this.#lifecycleHandlers['CONFIGURED'].append.bind(this.#lifecycleHandlers['CONFIGURED']));
      this.#lifecycleEvents['CONFIGURED'].append((value) => {
        this.#lifecycle.configured = true;
        this.config = config;
      });
      this.#lifecycleEvents['CONFIGURED'].notify(validatedConfig);
      this.status = "CONFIGURED";
    } catch (e) {
      console.error('Config validation error:', e);
    }
  }

  async validateConfig(config) {
    const validator = new (require('jsonschema').Validator)();
    validator.checkSchema(Config.configSchema);
    return new Promise((resolve) => {
      validator.validate(config, Config.configSchema, (e) => {
        if (e) {
          console.error('Config validation error:', e);
          throw e;
        }
        config = config;
        resolve(config);
      });
    });
  }

  async onLifecycleEvent(event, handler) {
    const lifecycleEvent = new LifecycleEvent(event);
    this.#lifecycleEvents[event] = lifecycleEvent;
    await new Promise((resolve) => {
      lifecycleEvent.append((value) => {
        this.#lifecycleHandlers[event] = new LifecycleHandler(handler);
        this.#lifecycleHandlers[event].append(event, (value) => {
          lifecycleEvent.append((value) => {
            this.#lifecycleEvents[event].notify(event, value);
          });
        });
        resolve(true);
      });
    });
  }

  async executeLifecycleEvent(event) {
    try {
      await new Promise((resolve) => {
        if (this.#lifecycleEvents[event]) {
          this.#lifecycleEvents[event].bind(this).notify(event);
        }
        resolve(true);
      });
    } catch (e) {
      console.error('Error:', e);
    }
  }

  async asyncLoad() {
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

  async asyncShutdown() {
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
        await this[methodName];
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
    this.#lifecycleHandlers = {};
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
nexusCore.asyncLoad();
nexusCore.asyncShutdown();
nexusCore.destroy();