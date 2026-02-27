class Configuration {
  #staticConfiguration = {
    VERSION: "1.0.0",
    env: process.env.NODE_ENV || "development"
  };

  #defaultConfiguration = {
    foo: 'bar',
    baz: true
  };

  #configurationSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    },
    required: ['foo', 'baz']
  };

  constructor(values = {}) {
    this.#staticConfiguration = { ...this.#staticConfiguration };
    this.#defaultConfiguration = { ...this.#defaultConfiguration };
    this.#configurationSchema = { ...this.#configurationSchema };
    this.configure(values);
    this.validate();
  }

  configure(values) {
    Object.assign(this, values);
  }

  validate() {
    const validator = new (require('jsonschema').Validator)();
    validator.checkSchema(this.#configurationSchema);
    try {
      validator.validate(this, this.#configurationSchema);
      if (this.VERSION !== Configuration.staticConfiguration.VERSION) {
        throw new Error("Configuration version mismatch");
      }
    } catch (e) {
      console.error('Configuration validation error:', e);
      throw e;
    }
  }

  get configuration() {
    const properties = {
      foo: this.foo,
      baz: this.baz
    };
    return { ...this.#configurationSchema.properties, ...properties };
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

  execute(nexusCore) {
    this.handler(nexusCore);
  }
}

abstract class AbstractLifecycleHandler {
  abstract execute(nexusCore);
}

class ShutdownHandler extends AbstractLifecycleHandler {
  constructor(handler) {
    super();
    this.handler = handler;
  }

  execute(nexusCore) {
    this.handler();
    nexusCore.status = 'SHUTDOWN';
  }
}

class NexusCore {
  #configuration;
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    shuttingDownHandler: null
  };

  #status = "INIT";

  constructor() {
    this.#configuration = new Configuration();
  }

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
        lifecycle.shuttingDownHandler = null;
      }
    }
    if (currentValue === 'INIT' && value !== 'INIT') {
      lifecycle.configured = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  async configure(config = {}) {
    this.#configuration.configure(config);
    this.#configuration.validate();
    this.#configuration = new Configuration();
    this.#configuration.configure(this.#configuration.configuration);
    this.onLifecycleEvent("CONFIGURED");
    this.#lifecycle.configured = true;
  }

  async onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler);
    const handlerMap = {
      'CONFIGURED': lifecycleHandler,
      'LOADED': lifecycleHandler,
      'SHUTTING_DOWN': new ShutdownHandler(handler),
      'SHUTDOWN': () => {
        this.status = 'SHUTDOWN';
      }
    };
    if (event in handlerMap) {
      this.#lifecycle[event] = handlerMap[event];
      if (event === "SHUTTING_DOWN" && this.#lifecycle.SHUTTING_DOWN) {
        this.#lifecycle.shuttingDownHandler = handlerMap['SHUTTING_DOWN'];
      }
    }
  }

  on(event, handler) {
    const lifecycleEvent = new LifecycleEvent(event);
    this.onLifecycleEvent(event, handler);
  }

  abstract executeLifecycleEvent(event);

  async load() {
    if (!this.#lifecycle.loaded) {
      try {
        await this.executeLifecycleEvent("CONFIGURED");
        if (this.#configuration.configuration.baz) {
          console.log("Loading...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log("Loading complete...");
          this.#lifecycle.loaded = true;
          await this.executeLifecycleEvent("LOADED");
        }
      } catch (e) {
        console.error('Load error:', e);
      }
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        const shuttingDownHandler = this.#lifecycle.shuttingDownHandler;
        if (shuttingDownHandler) {
          shuttingDownHandler.execute(this);
        }
        console.log("Shutdown complete...");
        this.status = 'SHUTDOWN';
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    } finally {
      this.#lifecycle.shuttingDown = false;
      this.#lifecycle.shuttingDownHandler = null;
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load"];
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
      shuttingDown: false,
      shuttingDownHandler: null
    };
  }
}

enum EventTypes {
  CONFIGURED = true,
  LOADED = true,
  SHUTTING_DOWN = true,
  SHUTDOWN = true
}

class NexusCoreImpl extends NexusCore {
  executeLifecycleEvent(event) {
    super.executeLifecycleEvent(event);
    this.#lifecycle[event] && this.#lifecycle[event].execute(this);
  }
}

const nexusCore = new NexusCoreImpl();
nexusCore.on('DESTROYED', nexusCore => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(NexusCoreImpl.defaultConfig.configuration);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();


This code maintains the same functionality as the original code but with the enhancements you requested.