class Config {
  #configSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    }
  };

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
  }

  static getConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  constructor(values = {}) {
    this.#validate(values);
    Object.assign(this, values);
  }

  #validate(options) {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.#configSchema);
      validator.validate(options, this.#configSchema);
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
  constructor({ handler, context }) {
    this.handler = handler;
    this.context = context;
    if (context) this.handler = this.handler.bind(context);
  }

  execute() {
    this.handler();
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    destroying: false
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
    this.#validateConfig(config);
    this.#lifecycle.configured = true;
    this.config = config;
    this.#onLifecycleEvent("CONFIGURED");
  }

  #validateConfig(config) {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(Config.#configSchema);
      validator.validate(config, Config.#configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  #onLifecycleEvent(event, handler, context) {
    if (!this.#lifecycle[event]) {
      this.#lifecycle[event] = new LifecycleHandler({ handler, context });
    } else {
      this.#lifecycle[event].handler = handler;
      this.#lifecycle[event].context = context;
      this.#lifecycle[event].handler = this.#lifecycle[event].handler.bind(context);
    }
  }

  on(event, handler, context) {
    const lifecycleEvent = new LifecycleEvent(event);
    this.#onLifecycleEvent(event, handler, context);
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event] && this.#lifecycle[event].handler) {
      this.#lifecycle[event].execute();
    }
  }

  async load() {
    if (this.#lifecycle.configured) {
      this.#lifecycle.loaded = true;
      this.#onLifecycleEvent("LOADED");
    } else {
      throw new Error('Configuration not set before loading');
    }
  }

  async shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      console.log("Shutdown initiated...");
      this.#lifecycle.shuttingDown = true;
      this.#onLifecycleEvent("SHUTTING_DOWN");
      console.log("Shutdown complete...");
      this.status = "SHUTDOWN";
    }
  }

  async destroy() {
    this.#lifecycle.destroying = true;
    this.status = "DESTROYING";
    await this.#onLifecycleEvent("DESTROYING");
    this.status = "DESTROYED";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      destroying: false
    };
  }

  async start() {
    const startMethodOrder = ["load", "shutdown"];
    for (const methodName of startMethodOrder) {
      await this[methodName]();
    }
  }

  async loadAsync() {
    if (this.#lifecycle.configured) {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.#onLifecycleEvent("LOADED");
    } else {
      throw new Error('Configuration not set before loading');
    }
  }

  async initialize() {
    this.status = "INIT";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      destroying: false
    };
  }
}

class Initializer {
  async initialize(nexusCore) {
    await nexusCore.initialize();
    await nexusCore.load();
  }
}

class Startup {
  constructor(nexusCore) {
    this.#nexusCore = nexusCore;
  }

  get nexusCore() {
    return this.#nexusCore;
  }
}

const startup = new Startup(new NexusCore());
const initializer = new Initializer();
initializer.initialize(startup.nexusCore);

startup.nexusCore.configure(Config.defaultConfig);

startup.nexusCore.on("DESTROYED", () => {
  console.log("NexusCore instance destroyed.");
}, startup.nexusCore);

startup.nexusCore.on("LOADED", () => {
  console.log("NexusCore has been loaded successfully.");
}, startup.nexusCore);

try {
  startup.nexusCore.load();
} catch (e) {
  console.error(e.message);
}

try {
  startup.nexusCore.shutdown();
} catch (e) {
  console.error(e.message);
}

try {
  startup.nexusCore.loadAsync();
} catch (e) {
  console.error(e.message);
}

try {
  startup.nexusCore.destroy();
} catch (e) {
  console.error(e.message);
}

Changes Made:

* Introduced `#validateConfig` private method to validate configuration object and removed redundant validation code from `configure` method.
* Introduced `#onLifecycleEvent` private method to handle lifecycle event registration and removed redundant code from `on` method.
* Introduced `destroying` property to the lifecycle object to properly handle destruction lifecycle event.
* Improved code formatting and consistency.
* Removed `startup.nexusCore.initialize()` method call as it's already called inside the `initializer` class.