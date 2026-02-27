class Config {
  #staticConfig = {
    VERSION: "1.0.0",
    env: process.env.NODE_ENV || "development"
  };

  #defaultConfig = {
    foo: 'bar',
    baz: true
  };

  get staticConfig() {
    return { ...this.#staticConfig };
  }

  get defaultConfig() {
    return { ...this.#defaultConfig };
  }

  get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      }
    };
  }

  #values = {};

  setValues(values) {
    Object.assign(this.#values, values);
  }

  validate() {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.configSchema);
      validator.validate(this.#values, this.configSchema);
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
  constructor() {
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
    this.#status = "INIT";
    this.#config = new Config();
  }

  #loadLifecycleMethods() {
    return ["configure", "load", "shutdown"];
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    const currentValue = this.#status;
    const lifecycle = this.#lifecycle;
    if (value !== 'INIT' && value !== 'DESTROYED') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        lifecycle.shuttingDown = false;
      }
      this.executeLifecycleEvent("CONFIGURED");
    }
    if (currentValue === 'INIT' && value !== 'INIT' && value !== 'DESTROYED') {
      lifecycle.configured = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  configure(config) {
    this.#config.setValues(config);
    this.#config.validate();
    this.#lifecycle.configured = true;
  }

  async load() {
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      console.log(this.#config.getValues());
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        console.log("Shutdown complete...");
        this.#lifecycleConfigured = false;
        this.status = "SHUTDOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  get on() {
    return (event, handler) => {
      const lifecycleEvent = new LifecycleEvent(event);
      this.#onLifecycleEvent(event, handler);
    };
  }

  #onLifecycleEvent(event, handler) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event] = new LifecycleHandler(handler);
      this.#lifecycle[event].bind(this);
    }
  }

  getValues() {
    return this.#config.#values;
  }

  async start() {
    const startMethodOrder = this.#loadLifecycleMethods();
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
    Object.values(this.#lifecycle).forEach(lifecycleHandler => lifecycleHandler.handler = null);
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }

  get #lifecycleConfigured() {
    return this.#lifecycle.configured;
  }

  set #lifecycleConfigured(value) {
    this.#lifecycle.configured = value;
  }
}

class Logger {
  #logs = [];

  write(message) {
    this.#logs.push(message);
  }

  get logs() {
    return this.#logs;
  }
}

const logger = new Logger();
const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', async () => {
  logger.write("NexusCore instance destroyed.");
  console.log("NexusCore instance destroyed.");
  await nexusCore.destroy();
});
nexusCore.on('CONFIGURED', () => {
  logger.write("NexusCore instance configured.");
  console.log("NexusCore instance configured.");
});
 await nexusCore.configure(NexusCore.getStaticConfig());
await nexusCore.start();
await nexusCore.load();
await nexusCore.shutdown();
console.log(nexusCore.getValues());
console.log(logger.logs);



class NexusCore {
  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
  }

  static create() {
    return new NexusCore();
  }
}

const nexusCore = NexusCore.create();