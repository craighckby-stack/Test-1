VOTE for React-Core from Meta


class Config {
  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  constructor(values = {}) {
    this.setValues(values);
  }

  setValues(values) {
    Object.assign(this, values);
  }

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
  }

  static get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      }
    };
  }

  validate() {
    try {
      const schema = Config.configSchema;
      const jsYaml = require('js-yaml');
      const schemaString = jsYaml.dump(schema);
      const ast = jsYaml.load(schemaString);
      const { createValidator } = require('yup');
      const Yup = createValidator(ast);
      Yup.validate(this, { recursive: true });
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
  constructor(handler, context = {}) {
    this.handler = handler;
    this.context = context;
  }

  bind(target = this) {
    return new (target.constructor.bind(target))(
      Object.assign({}, this.handler, this.context)
    ).prototype.execute.bind(target);
  }

  execute() {
    const result = this.handler.apply(this.context, []);
    return result;
  }
}

class EventObject {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

class EventEmitter {
  #events = new Map();

  on(event, handler) {
    if (!this.#events.has(event)) {
      this.#events.set(event, []);
    }
    this.#events.get(event).push(handler);
  }

  off(event, handler) {
    if (this.#events.has(event)) {
      this.#events.get(event).splice(
        this.#events.get(event).indexOf(handler),
        1
      );
      if (this.#events.get(event).length === 0) {
        this.#events.delete(event);
      }
    }
  }

  emit(event, ...args) {
    if (this.#events.has(event)) {
      for (const handler of this.#events.get(event)) {
        handler(...args);
      }
    }
  }
}

class NexusCore {
  #events = new EventEmitter();
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

  configure(config) {
    this.validateConfig(config);
    this.#events.emit("CONFIGURED", config);
    this.#lifecycle.configured = true;
    this.config = config;
  }

  validateConfig(config) {
    const configSchema = Config.configSchema;
    try {
      const Yup = require('yup');
      const schema = Yup.object().shape(configSchema);
      schema.validateSync(config);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  on(event, handler) {
    this.#events.on(event, handler);
  }

  off(event, handler) {
    this.#events.off(event, handler);
  }

  emit(event, ...args) {
    this.#events.emit(event, ...args);
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      const execute = this.#lifecycle[event].bind(this);
      execute();
    }
  }

  async load() {
    await this.executeLifecycleEvent("CONFIGURED");
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
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();