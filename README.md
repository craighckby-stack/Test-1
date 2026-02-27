class Config {
  #_schema = {
    $id: 'config',
    type: 'object',
    properties: {
      VERSION: { type: 'string' },
      env: { type: 'string' }
    },
    required: ['VERSION', 'env']
  };

  static get schema() {
    return this.#_schema;
  };

  #_defaultConfig = {
    VERSION: "1.0.0",
    env: "development"
  };

  static get defaultConfig() {
    return this.#_defaultConfig;
  }

  constructor(values = {}) {
    this.#validate(values);
    this.#assignValues(values);
  }

  #validate(values) {
    try {
      const { ajv } = require('ajv');
      const ajvInstance = new ajv();
      ajvInstance.addSchema(this.schema);
      const valid = ajvInstance.validate(this.schema, values);
      if (!valid) {
        console.error('Config validation error:', ajvInstance.errors[0]);
        throw ajvInstance.errors[0];
      }
    } catch (e) {
      throw e;
    }
  }

  #assignValues(values) {
    Object.assign(this, values);
  }

  #merge(obj1, obj2) {
    return { ...obj1, ...obj2 };
  }

  static mergeConfigs(config1, config2) {
    return new Config(this.#merge(config1, config2));
  }
}

class LifecycleEvent {
  #_event;

  constructor(event) {
    this.#_event = { event, handler: () => {} };
  }

  get event() {
    return this.#_event.event;
  }

  set event(value) {
    this.#_event.event = value;
  }

  set handler(value) {
    this.#_event.handler = value;
  }

  get handler() {
    return this.#_event.handler;
  }
}

class LifecycleHandler {
  #_handler;
  #_target;

  constructor(handler, target = null) {
    this.#_handler = handler;
    this.#_target = target || this;
  }

  bind(target) {
    this.#_target = target;
  }

  set handler(value) {
    this.#_handler = value;
  }

  get handler() {
    return this.#_handler;
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

  #_status = 'INIT';

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
    try {
      const { ajv } = require('ajv');
      const ajvInstance = new ajv();
      ajvInstance.addSchema(Config.schema);
      const valid = ajvInstance.validate(Config.schema, config);
      if (!valid) {
        console.error('Config validation error:', ajvInstance.errors[0]);
        throw ajvInstance.errors[0];
      }
    } catch (e) {
      throw e;
    }
  }

  #onLifecycleEvent(event, handler) {
    if (!this._lifecycle._event.has(event)) {
      this._lifecycle._event.set(event, new LifecycleEvent(event));
    }
    this._lifecycle._event.get(event).handler = handler;
  }

  get on() {
    return (event, handler) => {
      this.#onLifecycleEvent(event, handler);
    };
  }

  executeLifecycleEvent(event) {
    if (this._lifecycle._event.has(event)) {
      const lifecycleEvent = this._lifecycle._event.get(event);
      lifecycleEvent.execute();
    }
  }

  async load() {
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
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});

const config = Config.mergeConfigs(Config.defaultConfig, {
  VERSION: "1.0.1"
});
console.log(config);
nexusCore.configure(config);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();