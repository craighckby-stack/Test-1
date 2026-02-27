// Encapsulates the configuration schema and default values.
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

  constructor(values = {}) {
    const { staticConfig, defaultConfig } = this;
    this.config = Object.assign({}, defaultConfig, staticConfig, values);
  }

  async validate() {
    try {
      const validator = new (await import('jsonschema')).Validator();
      await validator.checkSchema(this.#configSchema);
      validator.validate(this.config, this.#configSchema);
    } catch (e) {
      throw e;
    }
  }

  get defaultConfig() {
    return this.#defaultConfig;
  }
}

// Represents a lifecycle event with a specific type.
class LifecycleEvent {
  #event;

  constructor(event) {
    this.#event = event;
  }

  get event() {
    return this.#event;
  }
}

// Manages a lifecycle event execution with a target instance.
class LifecycleHandler {
  #handler;

  #target;

  constructor(handler) {
    this.#handler = handler;
  }

  bind(target) {
    this.#handler = this.#handler.bind(target);
    this.#target = target;
  }

  async execute() {
    await this.#handler(this.#target);
  }
}

// Implements the NexusCore lifecycle cycle.
class NexusCoreLifecycle {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  #status = "INIT";

  get status() {
    return this.#status;
  }

  set status(value) {
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
    }
    if (value === 'SHUTDOWN') {
      this.lifecycle.shuttingDown = false;
    }
    if (currentValue === 'INIT' && value !== 'INIT') {
      this.lifecycle.configured = true;
    }
    this.#status = value;
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  async configure(lifecycle) {
    await lifecycle.validate();
    await Promise.all([
      await lifecycle.onLifecycleEvent("CONFIGURED"),
      lifecycle.lifecycle.configured = true,
    ]);
  }

  async load(lifecycle) {
    await lifecycle.onLifecycleEvent("LOADED");
    await new Promise(resolve => setTimeout(resolve, 1000));
    lifecycle.lifecycle.loaded = true;
    await lifecycle.onLifecycleEvent("LOADED");
  }

  async shutdown(lifecycle) {
    await lifecycle.onLifecycleEvent("SHUTTING_DOWN");
    await new Promise(resolve => setTimeout(resolve, 2000));
    lifecycle.lifecycle.shuttingDown = false;
    lifecycle.status = "SHUTDOWN";
  }

  async destroy(lifecycle) {
    lifecycle.status = "DESTROYED";
    Object.values(lifecycle.#lifecycle).forEach(handler => {
      if (handler instanceof LifecycleHandler) {
        handler = null;
      }
    });
    lifecycle.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
  }
}

// Represents the NexusCore instance with lifecycle events.
class NexusCore {
  #lifecycle;

  #config;

  #configSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    }
  };

  get configSchema() {
    return this.#configSchema;
  }

  constructor() {
    this.#lifecycle = new NexusCoreLifecycle();
    this.#config = new Config();
  }

  get config() {
    return this.#config;
  }

  get lifecycle() {
    return this.#lifecycle.lifecycle;
  }

  get status() {
    return this.#lifecycle.status;
  }

  set status(value) {
    this.#lifecycle.status = value;
  }

  async start() {
    const lifecycle = this.#lifecycle;
    const lifecycleHandlers = [
      "configure",
      "load",
      "shutdown"
    ];
    await Promise.all(lifecycleHandlers.map(async methodName => {
      if (lifecycle.lifecycle[methodName]) {
        await lifecycle[methodName](this.#config);
      }
    }));
  }

  async configure() {
    const lifecycle = this.#lifecycle;
    const config = this.#config;
    await lifecycle.configure(config);
  }

  async load() {
    const lifecycle = this.#lifecycle;
    await lifecycle.load(lifecycle);
  }

  async shutdown() {
    const lifecycle = this.#lifecycle;
    await lifecycle.shutdown(lifecycle);
  }

  async destroy() {
    const lifecycle = this.#lifecycle;
    await lifecycle.destroy(lifecycle);
  }

  async onLifecycleEvent(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }
    const lifecycleEvent = new LifecycleEvent(event);
    const lifecycleHandler = new LifecycleHandler(handler.bind(this));
    if (this.#lifecycle.lifecycle[event]) {
      throw new Error(`Lifecycle event '${event}' already exists`);
    }
    this.#lifecycle.lifecycle[event] = lifecycleHandler;
    return lifecycleHandler;
  }

  async on(event, handler) {
    const lifecycleEvent = await this.onLifecycleEvent(event, handler);
    return lifecycleEvent.execute.bind(this)();
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', async () => {
  console.log("NexusCore instance destroyed.");
});
await nexusCore.configure();
await nexusCore.start();
await nexusCore.load();
await nexusCore.shutdown();
await nexusCore.destroy();