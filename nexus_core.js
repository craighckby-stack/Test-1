class Config {
  static readonly CACHE_NAME = "Config";

  #configCache = Object.create(null);
  static get cache() {
    return Config.#configCache;
  }
  static set cache(value) {
    Config.#configCache = value;
  }
  static get defaultConfig() {
    return Config.defaultConfig || {};
  }
  static set defaultConfig(value) {
    Config.defaultConfig = value;
  }
  static get configSchema() {
    return Config.configSchema || {};
  }
  static set configSchema(value) {
    Config.configSchema = value;
  }

  _data;

  get data() {
    return this._data;
  }
  set data(value) {
    this._data = {
      ...this.defaultConfig,
      ...value
    }
  }

  async loadConfig() {
    if (Config.cache[Config.CACHE_NAME]) return Config.cache[Config.CACHE_NAME];
    try {
      const config = await import('{config.json}').then(m => m.config.json);
      Config.cache[Config.CACHE_NAME] = config;
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static getStaticConfig() {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await Config.loadConfig();
        resolve({
          ...Config.defaultConfig,
          ...data,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  constructor(_data) {
    this.data = _data;
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

class LifecycleManager {
  constructor(handlers) {
    this.handlers = handlers;
  }

  setEvent(event, handler) {
    this.handlers.push({
      event,
      handler
    });
  }

  execute(event) {
    return new Promise((resolve, reject) => {
      const handler = this.handlers.find((e) => e.event === event);
      if (handler)
        handler.handler().then(resolve).catch(reject);
    });
  }
}

class NexusCore {
  #lifecycle = {
    lifecycleStatus: "INIT",
    handlers: new Map(),
    shutDownHandler: null,
  };

  get status() {
    return this.#lifecycle.lifecycleStatus;
  }

  set status(value) {
    this.#lifecycle.lifecycleStatus = value;
  }

  get lifecycle() {
    return this.#lifecycle.handlers;
  }

  get shutDownHandler() {
    return this.#lifecycle.shutDownHandler;
  }

  set shutDownHandler(value) {
    this.#lifecycle.shutDownHandler = value;
  }

  config = new Config();

  configure(options) {
    return new Promise((resolve, reject) => {
      if (!options.config) reject(new Error('No configuration provided'));
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(this.config.configSchema);
      try {
        const validatedConfig = validator.validate(options.config, this.config.configSchema);
        this.config.data = validatedConfig;
        this.status = "CONFIGURED";
        resolve(this);
      } catch (error) {
        reject(error);
      }
    });
  }

  load() {
    return new Promise((resolve, reject) => {
      if (this.status !== "CONFIGURED") reject(new Error("No configuration provided"));
      const lifecycleHandler = new LifecycleHandler(() => {
        return Promise.resolve("LOADED");
      });
      this.#lifecycle.handlers.set("LOADED", lifecycleHandler);
      lifecycleHandler.execute().then(resolve).catch(reject);
    });
  }

  shutdown() {
    return new Promise((resolve, reject) => {
      if (this.status !== "LOADED") return reject(new Error("No Loaded Status"));
      const lifecycleHandler = new LifecycleHandler(() => {
        this.status = "SHUTDOWN";
      });
      this.#lifecycle.handlers.set("SHUTDOWN", lifecycleHandler);
      lifecycleHandler.execute().then(resolve).catch(reject);
    });
  }

  async start() {
    const handler = new LifecycleHandler(() => {
      return this.configure({ config: this.config.data }).then(() => this.load());
    });
    this.#lifecycle.handlers.set("INIT", handler);
    handler.execute().catch(error => console.error(error));
  }

  destroy() {
    this.status = "DESTROYED";
  }
}

class StartupManager {
  constructor(nexusCore) {
    this.nexusCore = nexusCore;
  }

  run() {
    const lifeCyleEvents = ["initialized", "configured", "loaded", "shutdown"];
    this.nexusCore.start().catch(error => console.error(error));
    lifeCyleEvents.forEach((event) => {
      new LifecycleHandler(() => {
        console.log(`${event} event has been executed`);
      }).bind(this.nexusCore).execute().catch(error => console.error(error));
    });
  }
}

async function main() {
  const nexusCore = new NexusCore();
  await Config.getStaticConfig().then(data => {
    nexusCore.config = new Config(data);
  });
  const startupManager = new StartupManager(nexusCore);
  startupManager.run();
  await nexusCore.shutdown();
}

main();