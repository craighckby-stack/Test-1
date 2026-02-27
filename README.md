class Config {
  #schema = {
    type: 'object',
    properties: {
      VERSION: { type: 'string' },
      env: { type: 'string' }
    }
  };

  static get configSchema() {
    return this.#schema;
  };

  #defaultConfig = {
    VERSION: "1.0.0",
    env: "development"
  };

  get staticConfig() {
    return this.#defaultConfig;
  }

  constructor(values = {}) {
    this.#validate(values);
    this.#assignValues(values);
  }

  #validate(values) {
    const { Validator } = require('jsonschema');
    try {
      const validator = new Validator();
      validator.checkSchema(this.#schema);
      validator.validate(values, this.#schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  #assignValues(values) {
    Object.assign(this, values);
  }
}

class LifecycleEvent {
  #_event;

  constructor(event) {
    this.#_event = event;
  }

  get event() {
    return this.#_event;
  }

  set event(value) {
    this.#_event = value;
  }
}

class LifecycleHandler {
  #_handler;
  #_target;

  constructor(handler, target = this) {
    this.#_handler = handler;
    this.#_target = target;
  }

  bind(target) {
    this.#_target = target;
  }

  get handler() {
    return this.#_handler;
  }

  set handler(value) {
    this.#_handler = value;
  }

  get target() {
    return this.#_target;
  }

  set target(value) {
    this.#_target = value;
  }

  execute() {
    this.handler.call(this.#_target);
  }
}

class NexusCore {
  #_lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    _event: new Map()
  };

  #_status = "INIT";

  get status() {
    return this._status;
  }

  set status(value) {
    this.#_status = value;
    this.#updateStatus(value);
  }

  get lifecycle() {
    return this._lifecycle;
  }

  #updateStatus(value) {
    console.log(`NexusCore instance is ${value}.`);
    if (value === 'SHUTDOWN') {
      this.#_lifecycle.shuttingDown = false;
    }
    if (this.#_status === 'INIT' && value !== 'INIT') {
      this.#_lifecycle.configured = true;
    }
  }

  configure(config) {
    this.#validateConfig(config);
    this.#onLifecycleEvent("CONFIGURED");
    this.#_lifecycle.configured = true;
    this.config = config;
  }

  #validateConfig(config) {
    const { Validator } = require('jsonschema');
    try {
      const validator = new Validator();
      validator.checkSchema(Config.configSchema);
      validator.validate(config, Config.configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  #onLifecycleEvent(event, handler) {
    if (!this._lifecycle._event.has(event)) {
      this._lifecycle._event.set(event, new LifecycleEvent(event));
    }
    this._lifecycle._event.get(event).event = handler;
  }

  get on() {
    return (event, handler) => {
      this.#onLifecycleEvent(event, handler);
    };
  }

  executeLifecycleEvent(event) {
    if (this._lifecycle._event.has(event)) {
      const lifecycleEvent = this._lifecycle._event.get(event);
      lifecycleEvent.handler = lifecycleEvent.handler.bind(lifecycleEvent.target);
      lifecycleEvent.execute();
    }
  }

  async load() {
    await this.executeLifecycleEvent("CONFIGURED");
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#_lifecycle.loaded = true;
      this.executeLifecycleEvent("LOADED");
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#_lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#_lifecycle.shuttingDown = true;
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
    this._lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      _event: new Map()
    };
  }

  async on(event, handler) {
    await this.onLifecycleEvent(event, handler);
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});

const config = Config.defaultConfig;
console.log(config);
nexusCore.configure({
  ...config,
  VERSION: "1.0.1"
});
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();