class Config {
  #configSchema = jsonSchema.compile({
    type: 'object',
    properties: {
      VERSION: { type: 'string' },
      env: { type: 'string' },
      foo: { type: 'string' },
      baz: { type: 'boolean' },
    },
    required: ['VERSION', 'env', 'foo', 'baz'],
  });

  #values = {};

  constructor(config = {}) {
    this.#values = {
      ...this.#configSchema.default(),
      ...config,
    };
  }

  validate() {
    try {
      jsonSchema.validate(this.#values, this.#configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get values() {
    return Object.freeze(this.#values);
  }

  set values(value) {
    this.#values = Object.freeze({ ...this.#values, ...value });
  }
}

class LifecycleEvent {
  constructor(event, target) {
    this.event = event;
    this.target = target;
  }
}

class LifecycleHandler {
  #handler;
  #target;

  constructor() {
    this.#target = this;
  }

  set handler(value) {
    this.#handler = value;
    this.#handler?.bind?.(this.#target);
  }

  execute() {
    if (this.#handler) {
      this.#handler();
    }
  }
}

class Logger {
  #logs = [];

  write(message) {
    this.#logs = this.#logs.concat(message);
  }

  get logs() {
    return Object.freeze(this.#logs);
  }
}

class NexusCore {
  #logger;
  #config;
  #lifecycleStatus = "INIT";
  #lifecycle = {
    configured: false,
    loaded: false,
    destroying: false,
    destroyed: false,
    onConfigure: null,
    onLoaded: null,
    onShuttingDown: null,
    onDestroyed: null,
  };

  static configSchema = jsonSchema.compile({
    type: 'object',
    properties: {
      VERSION: { type: 'string' },
      env: { type: 'string' },
      foo: { type: 'string' },
      baz: { type: 'boolean' },
    },
    required: ['VERSION', 'env', 'foo', 'baz'],
  });

  static getStaticConfig() {
    return {
      VERSION: NexusCore.VERSION,
      env: NexusCore.env,
    };
  }

  static getDefaultConfig() {
    return {
      foo: 'bar',
      baz: true,
    };
  }

  constructor(config = {}) {
    this.#logger = Object.freeze(new Logger());
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
        this.#lifecycle.destroying = false;
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
      // Clear lifecycle handlers and reset their status
      Object.values(this.#lifecycle).forEach(lifecycleHandler => {
        if (lifecycleHandler) {
          lifecycleHandler.handler = null;
        }
      });
      this.#lifecycle.destroyed = true;
      this.#logger.write("NexusCore instance destroyed.");
      console.log("NexusCore instance destroyed.");
      this.#config = null;
      this.#logger = null;
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
    try {
      await this.#config.validate();
      await new Promise(resolve => setTimeout(resolve, 500));
      this.#config.values = Object.freeze(config);
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.status = 'CONFIGURED';
    } catch (e) {
      console.error('Config error:', e);
      await this.shutdown();
      this.status = 'DESTROYED';
    }
  }

  async load() {
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("Loading complete...");
      this.status = 'LOADED';
    } catch (e) {
      console.error('Load error:', e);
      await this.shutdown();
      this.status = 'DESTROYED';
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.destroying) {
        console.log("Shutdown initiated...");
        this.#lifecycle.onShuttingDown?.execute();
        this.#lifecycle.destroying = true;
        await new Promise(resolve => setTimeout(resolve, 3000));
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
    const result = await this.configure(NexusCore.getStaticConfig());
    await this.load();
  }
}

NexusCore.VERSION = "1.0.0";
NexusCore.env = process.env.NODE_ENV || "development";

Object.freeze(NexusCore);
Object.freeze(NexusCore.VERSION);
Object.freeze(NexusCore.env);

const nexusCore = NexusCore.create();
nexusCore.on('DESTROYED', async () => {
  nexusCore.getLogger().write("NexusCore instance destroyed.");
  console.log("NexusCore instance destroyed.");
  await nexusCore.destroy();
});
nexusCore.on('CONFIGURED', () => {
  nexusCore.getLogger().write("NexusCore instance configured.");
  console.log("NexusCore instance configured.");
});
await nexusCore.configure(NexusCore.getStaticConfig());
await nexusCore.start();
await nexusCore.load();
await nexusCore.shutdown();
console.log(nexusCore.getValues());
console.log(nexusCore.getLogger().logs);

NexusCore.create = function(config = {}) {
  return new NexusCore(config);
};

NexusCore.getLogger = function() {
  return this.#logger;
};