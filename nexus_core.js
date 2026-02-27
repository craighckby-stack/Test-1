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
    this.#validateConfig(values);
    Object.assign(this, values);
  }

  #validateConfig(options) {
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.#configSchema);
      validator.validate(options, this.#configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  static withSchema(schema) {
    return new class ExtendsConfig {
      #configSchema = schema;

      constructor(values = {}) {
        this.#validateConfig(values);
        Object.assign(this, values);
      }

      #validateConfig(options) {
        try {
          const validator = new (require('jsonschema').Validator)();
          validator.checkSchema(this.#configSchema);
          validator.validate(options, this.#configSchema);
        } catch (e) {
          console.error('Config validation error:', e);
          throw e;
        }
      }
    };
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
  #lifeCycles = {
    configured: false,
    loading: false,
    loaded: false,
    shuttingDown: false,
    destroying: false,
    destroyed: false
  };

  #status = "INIT";

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    const currentValue = this.#status;
    const lifeCycles = this.#lifeCycles;
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        lifeCycles.shuttingDown = false;
      }
    }
    if (currentValue === 'INIT' && value !== 'INIT') {
      lifeCycles.configured = true;
    }
    if (value === 'DESTROYED') {
      lifeCycles.destroyed = true;
    }
  }

  get lifeCycles() {
    return this.#lifeCycles;
  }

  configure(config) {
    this.#validateConfig(config);
    this.#lifeCycles.configured = true;
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
    if (!this.#lifeCycles[event]) {
      this.#lifeCycles[event] = new LifecycleHandler({ handler, context });
    } else {
      this.#lifeCycles[event].handler = handler;
      this.#lifeCycles[event].context = context;
      this.#lifeCycles[event].handler = this.#lifeCycles[event].handler.bind(context);
    }
  }

  on(event, handler, context) {
    const lifecycleEvent = new LifecycleEvent(event);
    this.#onLifecycleEvent(event, handler, context);
  }

  executeLifecycleEvent(event) {
    if (this.#lifeCycles[event]) {
      this.#lifeCycles[event].execute();
    }
  }

  async load() {
    if (this.#lifeCycles.configured) {
      this.#lifeCycles.loading = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.#lifeCycles.loaded = true;
        this.#onLifecycleEvent("LOADED");
      } catch (e) {
        console.error(e.message);
      } finally {
        this.#lifeCycles.loading = false;
      }
    } else {
      throw new Error('Configuration not set before loading');
    }
  }

  async shutdown() {
    if (!this.#lifeCycles.shuttingDown) {
      console.log("Shutdown initiated...");
      this.#lifeCycles.shuttingDown = true;
      this.#onLifecycleEvent("SHUTTING_DOWN");
      console.log("Shutdown complete...");
      this.status = "SHUTDOWN";
    }
  }

  async destroy() {
    this.#lifeCycles.destroying = true;
    this.status = "DESTROYING";
    await this.#onLifecycleEvent("DESTROYING");
    this.status = "DESTROYED";
    this.#lifeCycles = {
      configured: false,
      loading: false,
      loaded: false,
      shuttingDown: false,
      destroying: false,
      destroyed: true
    };
  }

  async initialize() {
    this.status = "INIT";
    this.#lifeCycles = {
      configured: false,
      loading: false,
      loaded: false,
      shuttingDown: false,
      destroying: false,
      destroyed: false
    };
  }

  validate() {
    for (const lifecycle in this.#lifeCycles) {
      if (this.#lifeCycles[lifecycle].handler) {
        try {
          this.#lifeCycles[lifecycle].handler();
        } catch (e) {
          console.error(`Validation error in ${lifecycle} lifecycle:`, e);
          return false;
        }
      }
    }
    return true;
  }
}

class Initializer {
  async initialize(nexusCore) {
    await nexusCore.initialize();
    await nexusCore.load();
    if (!nexusCore.validate()) {
      throw new Error('Invalid lifecycle state');
    }
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

class CustomLifecycleConfig {
  #configSchema = {
    type: 'object',
    properties: {
      custom: { type: 'boolean' }
    }
  };

  configure(nexusCore) {
    nexusCore.configure({
      custom: true
    });
  }
}

const customLifecycleConfig = new CustomLifecycleConfig();
customLifecycleConfig.configure(new NexusCore());

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
  startup.nexusCore.load();
} catch (e) {
  console.error(e.message);
}

try {
  startup.nexusCore.destroy();
} catch (e) {
  console.error(e.message);
}