class Config {
  #configSchema = {
    type: 'object',
    properties: {
      VERSION: { type: 'string' },
      env: { type: 'string' },
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    },
    required: ['VERSION', 'env', 'foo', 'baz'],
  };

  #values = {};

  constructor(config = {}) {
    this.#values = {
      ...this.#configSchema.default,
      ...config,
    };
  }

  validate() {
    try {
      const validator = new jsonSchema.Validator();
      validator.validate(this.#values, this.#configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get values() {
    return { ...this.#values };
  }

  set values(value) {
    this.#values = { ...this.#values, ...value };
  }
}

class LifecycleEvent {
  constructor(event, target) {
    this.event = event;
    this.target = target;
  }
}

class LifecycleHandler {
  get handler() {
    return this._handler;
  }

  set handler(value) {
    this._handler = value;
    this.target = this.handler?.target || this;
    this.handler?.bind?.(this.target);
  }

  execute() {
    if (this.handler) {
      this.handler();
    }
  }
}

class Logger {
  #logs = [];

  write(message) {
    this.#logs = this.#logs.concat(message);
  }

  get logs() {
    return this.#logs;
  }
}

class NexusCore {
  #logger;
  #config;
  #lifecycleStatus = "INIT";
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    destroyeds: false,
    onConfigure: null,
    onLoaded: null,
    onShuttingDown: null,
    onDestroyed: null,
  };

  constructor(config = {}) {
    this.#logger = new Logger();
    this.#config = new Config({
      VERSION: NexusCore.VERSION,
      env: NexusCore.env,
      ...config,
    });
  }

  get status() {
    return this.#lifecycleStatus;
  }

  set status(value) {
    this.#lifecycleStatus = value;
    if (value !== 'INIT' && value !== 'DESTROYED') {
      this.#logger.write(`NexusCore instance is ${value}.`);
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        this.#lifecycle.onShuttingDown?.execute();
        this.#lifecycle.shuttingDown = false;
      }
      if (value === 'CONFIGURED') {
        this.#lifecycle.onConfigure?.execute();
        this.#lifecycle.configured = true;
      }
      if (value === 'LOADED') {
        this.#lifecycle.onLoaded?.execute();
        this.#lifecycle.loaded = true;
      }
    }
    if (value === 'DESTROYED') {
      this.#lifecycle.onDestroyed?.execute();
      Object.values(this.#lifecycle).forEach((lifecycleHandler, index) => {
        if (!lifecycleHandler) return;
        lifecycleHandler.handler = null;
        if (index <= 2) {
          this.#lifecycle[index] = null;
        }
        const destroyedHandler = this.#lifecycle[`onDestroy${index >= 3 ? index + 1 : index}`];
        if (destroyedHandler) {
          destroyedHandler.handler = null;
        }
      });
      this.#lifecycle.destroyeds = true;
    }
  }

  get on() {
    return (event, handler) => {
      const lifecycleEvent = new LifecycleEvent(event, this);
      this.#lifecycle[event] = new LifecycleHandler();
      this.#lifecycle[event].handler = handler;
    };
  }

  getValues() {
    return this.#config.values;
  }

  getLifecycleHandler(event) {
    return this.#lifecycle[event];
  }

  async configure(config) {
    await this.#config.validate();
    this.#config.values = config;
    this.status = 'CONFIGURED';
  }

  async load() {
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.status = 'LOADED';
    } catch (e) {
      console.error('Load error:', e);
      this.status = 'DESTROYED';
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.onShuttingDown?.execute();
        this.#lifecycle.shuttingDown = true;
        console.log("Shutdown complete...");
        this.status = 'SHUTDOWN';
      }
    } catch (e) {
      console.error("Shutdown error:", e);
      this.status = 'DESTROYED';
    }
  }

  async destroy() {
    this.status = 'DESTROYED';
  }

  async start() {
    this.#lifecycle.onConfigure = this.on('CONFIGURED');
    this.#lifecycle.onLoaded = this.on('LOADED');
    this.#lifecycle.onShuttingDown = this.on('SHUTDOWN');
    this.#lifecycle.onDestroyed = this.on('DESTROYED');
    this.status = 'INIT';
    await this.configure(NexusCore.getStaticConfig());
    await this.load();
  }
}

NexusCore.VERSION = "1.0.0";
NexusCore.env = process.env.NODE_ENV || "development";

Object.freeze(NexusCore);
Object.freeze(NexusCore.VERSION);
Object.freeze(NexusCore.env);

NexusCore.getStaticConfig = function() {
  return {
    VERSION: NexusCore.VERSION,
    env: NexusCore.env,
  };
};

NexusCore.getDefaultConfig = function() {
  return {
    foo: 'bar',
    baz: true,
  };
};

NexusCore.create = function(config = {}) {
  return new NexusCore(config);
};

const logger = NexusCore.create().logger;
const nexusCore = NexusCore.create();
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


Please note that `jsonSchema` package is required in your project, install it with:

bash
npm install jsonschema


Or with yarn:

bash
yarn add jsonschema