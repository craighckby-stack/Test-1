Here's the updated code with enhancements:



class Config {
  static async loadConfig() {
    if (Config.#configCache[Config.name]) return Config.#configCache[Config.name];

    try {
      const config = await require('@nexus-core/config.json');
      Config.#configCache[Config.name] = config;
      return config;
    } catch (error) {
      console.error('Config error:', error);
      throw error;
    }
  }

  static async getStaticConfig() {
    const data = await Config.loadConfig();
    return {
      ...Config.defaultConfig,
      ...data,
    };
  }

  static defaultConfig = {
    foo: 'bar',
    baz: true,
  };

  static configSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' },
    },
  };

  constructor(values = {}) {
    if (!(values instanceof this.constructor)) {
      throw new TypeError(`Config values must be an instance of Config, but got: ${typeof values}`);
    }
    Object.assign(this, values);
  }

  static withConfig(values) {
    const instance = new Config(values);
    return new Proxy(instance, {
      get(target, property) {
        if (property in target) return target[property];
        else if (Config.defaultConfig[property]) return Config.defaultConfig[property];
        else console.error(`Undefined property: ${property}`);
      },
    });
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

  bind(target) {
    this.handler = this.handler.bind(target);
  }

  execute(...args) {
    this.handler(...args);
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
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

  configure(options = {}) {
    if (!options.config) return Promise.reject(new Error('No configuration provided'));
    const configValidator = new (require('jsonschema').Validator)();
    configValidator.checkSchema(Config.configSchema);
    try {
      const validatedConfig = configValidator.validate({
        ...Config.defaultConfig,
        ...options.config,
      }, Config.configSchema);
      const lifecycleHandler = new LifecycleHandler(() => this.config = Config.withConfig(validatedConfig));
      this.#lifecycle.configured = true;
      this.#lifecycle.CONFIGURED = lifecycleHandler;
      lifecycleHandler.bind(this).execute();
      return Promise.resolve(this);
    } catch (error) {
      console.error('Config validation error:', error);
      return Promise.reject(error);
    }
  }

  on(event, handler) {
    if (!this.#lifecycle[event]) this.#lifecycle[event] = [];
    this.#lifecycle[event].push(handler);
    return new Promise((resolve, reject) => {
      const lifecycleHandler = new LifecycleHandler(() => {
        try {
          handler();
          this.#lifecycle[event].shift();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      lifecycleHandler.bind(this).execute();
    });
  }

  async load() {
    if (!this.#lifecycle.CONFIGURED) {
      console.error('CONFIGURED event is not handled');
      return Promise.reject(new Error('CONFIGURED event is not handled'));
    }
    this.#lifecycle.LOADED = async () => {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
    };
    try {
      await this.#lifecycle.LOADED.bind(this)();
    } catch (error) {
      console.error('Load error:', error);
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.SHUTTING_DOWN = async () => {
          console.log("Shutdown complete...");
          this.status = "SHUTDOWN";
        };
        try {
          await this.#lifecycle.SHUTTING_DOWN.bind(this)();
        } catch (error) {
          console.error("Shutdown error:", error);
        }
      }
    } catch (error) {
      console.error("Shutdown error:", error);
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      try {
        const method = await this[methodName]();
        if (method && method instanceof Promise) await method;
      } catch (error) {
        console.error(error);
      }
    }
  }

  async destroy() {
    this.status = "DESTROYED";
    this.#lifecycle.destroyed = async () => {
      console.log("NexusCore instance destroyed.");
    };
    this.#lifecycle.destroyed.bind(this).execute();
  }
}

async function main() {
  const nexusCore = new NexusCore();
  await nexusCore.configure(Config.defaultConfig);
  await nexusCore.start();
  await nexusCore.load();
  await nexusCore.shutdown();
  await nexusCore.destroy();
}

main();