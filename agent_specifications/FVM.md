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

  get staticConfig() {
    return this.#staticConfig;
  }

  get defaultConfig() {
    return this.#defaultConfig;
  }

  get configSchema() {
    return this.#configSchema;
  }

  constructor(values = Config.defaultConfig) {
    const validatedValues = this.validate(values);
    Object.assign(this, validatedValues);
  }

  async validate(values = {}) {
    try {
      const schema = Config.configSchema;
      const validator = new (await (async () => { return import('jsonschema') })()).Validator();
      validator.checkSchema(schema);
      const result = await Promise.resolve(validator.validate(values, schema));
      return result.valid ? values : {};
    } catch (e) {
      console.error('Config validation error:', e);
      return {};
    }
  }
}

class LifecycleEvent {
  #eventsToNotify = {};

  constructor(event) {
    this.event = event;
  }

  async append(handler) {
    if (!this.#eventsToNotify[event]) {
      this.#eventsToNotify[event] = [];
    }
    this.#eventsToNotify[event].push(handler);
  }

  async notify(value) {
    if (this.#eventsToNotify[this.event]) {
      for (const handler of this.#eventsToNotify[this.event]) {
        await handler(value, this);
      }
    }
  }
}

class LifecycleHandler {
  #handlersToNotify = {};

  constructor(handler) {
    this.handler = handler;
  }

  async append(event, handler) {
    if (!this.#handlersToNotify[event]) {
      this.#handlersToNotify[event] = [];
    }
    this.#handlersToNotify[event].push(handler);
  }

  async invoke(event, target = null) {
    if (target) {
      this.handler = this.handler.bind(target);
    }
    const result = await this.handler();
    return result;
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
      await this.#lifecycleHandlers['CONFIGURED'].append(new LifecycleHandler(() => {
        this.#lifecycle.configured = true;
        this.config = config;
      }));
      this.#lifecycleEvents['CONFIGURED'] = new LifecycleEvent('CONFIGURED');
      await this.#lifecycleEvents['CONFIGURED'].append(this.#lifecycleHandlers['CONFIGURED'].append.bind(this.#lifecycleHandlers['CONFIGURED']));
      await this.#lifecycleEvents['CONFIGURED'].append((value) => {
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
    try {
      const validator = new (await (async () => { return import('jsonschema') })()).Validator();
      validator.checkSchema(Config.configSchema);
      return new Promise((resolve) => {
        validator.validate(config, Config.configSchema, (e) => {
          if (e) {
            console.error('Config validation error:', e);
          } else {
            config = config;
            resolve(true);
          }
        });
      });
    } catch (e) {
      console.error('Config validation error:', e);
      return null;
    }
  }

  async onLifecycleEvent(event, handler) {
    if (this.#lifecycleEvents[event]) {
      console.error('Lifecycle event already exists:', event);
      return;
    }
    this.#lifecycleEvents[event] = new LifecycleEvent(event);
    await this.#lifecycleEvents[event].append(new LifecycleHandler(handler));
  }

  async executeLifecycleEvent(event) {
    try {
      await new Promise((resolve) => {
        if (this.#lifecycleEvents[event]) {
          this.#lifecycleEvents[event].notify(undefined).catch(e => {
            this.#lifecycleEvents[event] = undefined;
            throw e;
          });
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
      if (this[methodName] && typeof this[methodName] === "function") {
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