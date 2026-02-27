// Utilities:
const AJVTransformer = class {
  static get ajv() {
    const ajv = require('ajv');
    const ajvInstance = new ajv();
    const ajvPlugin = require('@szmarczak/ajv-keywords');
    ajvInstance.addFormat('email', /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
    ajvInstance.addKeyword(ajvPlugin);
    return ajvInstance;
  }
};

// Schemas:
class Config {
  #_schema = {
    $id: 'config',
    type: 'object',
    properties: {
      VERSION: { type: 'string' },
      env: { type: 'string' },
      email: {
        $id: 'email',
        type: 'string',
        format: 'email'
      }
    },
    required: ['VERSION', 'env', 'email']
  };

  get schema() {
    return this.#_schema;
  };

  #_defaultConfig = {
    VERSION: "1.0.0",
    env: "development",
    email: "user@example.com"
  };

  get defaultConfig() {
    return this.#_defaultConfig;
  }

  constructor(values = {}) {
    this.#validateConfig(values);
    this.#assignValues(values);
  }

  #validateConfig(values) {
    const ajvInstance = AJVTransformer.ajv;
    ajvInstance.addSchema(this.schema);
    const valid = ajvInstance.validate(this.schema, values);
    if (!valid) {
      console.error('Config validation error:', ajvInstance.errors[0]);
      throw ajvInstance.errors[0];
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

// Lifecycle Events:
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

// Lifecycle Handlers:
class LifecycleHandler {
  #_handler;
  #_target;

  constructor(handler, target = null) {
    this.#_handler = handler;
    this.#_target = target;
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

// NexusCore:
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
  }

  get lifecycle() {
    return this._lifecycle;
  }

  async configure(config) {
    this.#checkStatus('INIT', async () => {
      this.#validateConfig(config);
      this.#onLifecycleEvent("CONFIGURED");
      this.#_lifecycle.configured = true;
      this.config = config;
    });
  }

  async load() {
    this.#checkStatus('CONFIGURED', async () => {
      try {
        console.log("Loading...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Loading complete...");
        this.#_lifecycle.loaded = true;
        this.#onLifecycleEvent("LOADED");
      } catch (e) {
        console.error('Load error:', e);
      }
    });
  }

  async shutdown() {
    this.#checkStatus('LOADED', async () => {
      try {
        if (!this.#_lifecycle.shuttingDown) {
          console.log("Shutdown initiated...");
          this.#_lifecycle.shuttingDown = true;
          this.#onLifecycleEvent("SHUTTING_DOWN");
          console.log("Shutdown complete...");
          this.status = "SHUTDOWN";
        }
      } catch (e) {
        console.error("Shutdown error:", e);
      }
    });
  }

  #checkStatus(status, callback) {
    if (this.status === status) {
      callback();
    } else if (this.status === "DESTROYED") {
      console.error('NexusCore instance already destroyed.');
    } else {
      console.error(`Cannot perform action: ${status}`);
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

  #validateConfig(config) {
    const ajvInstance = AJVTransformer.ajv;
    ajvInstance.addSchema(Config.schema);
    const valid = ajvInstance.validate(Config.schema, config);
    if (!valid) {
      console.error('Config validation error:', ajvInstance.errors[0]);
      throw ajvInstance.errors[0];
    }
  }

  executeLifecycleEvent(event) {
    if (this._lifecycle._event.has(event)) {
      const lifecycleEvent = this._lifecycle._event.get(event);
      lifecycleEvent.execute();
    }
  }
}

// Usage:
const nexusCore = new NexusCore();

nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});

const config = Config.mergeConfigs(Config.defaultConfig, {
  VERSION: "1.0.1",
  email: "user2@example.com"
});

nexusCore.configure(config);

const emailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const isValidEmail = emailValid.test(config.email);

if (isValidEmail) {
  nexusCore.start();
  nexusCore.load();
  nexusCore.shutdown();
  nexusCore.destroy();
} else {
  console.error('Invalid email address in configuration.');
}