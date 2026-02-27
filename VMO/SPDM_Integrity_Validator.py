class Config {
  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true,
      version: "1.0.0",
    };
  }

  constructor(config) {
    this.#configSchema = this.createConfigSchema();
    this.#cache = this.mergeDefaultConfig(config);
    this.validateConfig();
  }

  createConfigSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' },
        version: { type: 'string' },
      },
      required: ['foo', 'baz', 'version']
    };
  }

  mergeDefaultConfig(defaultConfig) {
    const mergedConfig = Object.assign({}, Config.defaultConfig, defaultConfig);
    const configTimestamp = new Date().getTime();
    return {...mergedConfig, configTimestamp};
  }

  validateConfig() {
    const validator = new (require('jsonschema').Validator)();
    validator.validate(this.#cache, this.#configSchema);
  }

  get config() {
    return this.#cache;
  }

  set config(value) {
    this.#cache = this.mergeDefaultConfig(value);
    this.validateConfig();
  }
}

class LifecycleEvent {
  static get INIT() {
    return 'INIT';
  }

  static get CONFIGURED() {
    return 'CONFIGURED';
  }

  static get LOADED() {
    return 'LOADED';
  }

  static get SHUTTING_DOWN() {
    return 'SHUTTING_DOWN';
  }

  static get SHUTDOWN() {
    return 'SHUTDOWN';
  }

  static get DESTROYED() {
    return 'DESTROYED';
  }
}

class LifecycleHandler {
  #target;
  #handler;

  constructor(handler, target = this) {
    this.#target = target;
    this.#handler = handler;
  }

  bind(target = this) {
    this.#handler = this.#handler.bind(target);
  }

  execute() {
    this.#handler();
  }
}

class NexusCore {
  static get INIT() {
    return 'INIT';
  }

  static get CONFIGURED() {
    return 'CONFIGURED';
  }

  static get LOADED() {
    return 'LOADED';
  }

  static get SHUTTING_DOWN() {
    return 'SHUTTING_DOWN';
  }

  static get SHUTDOWN() {
    return 'SHUTDOWN';
  }

  static get DESTROYED() {
    return 'DESTROYED';
  }

  #status;
  #lifecycle;
  #pendingDestroy;

  constructor() {
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      handlers: [],
      lastLifecycleUpdate: Date.now(),
    };
    this.#status = NexusCore.INIT;
    this.#pendingDestroy = false;
  }

  async configure(config) {
    await this.validateConfig(config);
    this.#lifecycle.configured = true;
    this.#updateLifecycle(NexusCore.CONFIGURED);
    this.#status = NexusCore.CONFIGURED;
    return this;
  }

  async load() {
    console.log("Loading...");
    await Promise.all(this.#lifecycle.handlers.map(({event, handler}) => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Handler for ${event} did not complete within the expected timeframe.`));
        }, 10000);
        handler().finally(() => {
          clearTimeout(timeoutId);
          resolve();
        });
      });
    }));
    this.#lifecycle.loaded = true;
    this.#updateLifecycle(NexusCore.LOADED);
    this.#status = NexusCore.LOADED;
    return this;
  }

  shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      this.#lifecycle.shuttingDown = true;
      this.#updateLifecycle(NexusCore.SHUTTING_DOWN);

      return new Promise((resolve, reject) => {
        console.log("Shutdown initiated...");
        Promise.all(this.#lifecycle.handlers.map(({event, handler}) => {
          return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error(`Handler for ${event} did not complete within the expected timeframe.`));
            }, 10000);
            handler().finally(() => {
              clearTimeout(timeoutId);
              resolve();
            });
          });
        })).then(() => {
          this.#status = NexusCore.SHUTDOWN;
          resolve(this);
        }).catch((e) => {
          console.error("Shutdown error:", e);
          reject(e);
        });
      });
    } else {
      return Promise.reject("NexusCore instance is already shutting down.");
    }
  }

  destroy() {
    this.#pendingDestroy = true;
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      handlers: [],
      lastLifecycleUpdate: Date.now(),
    };
    this.#status = NexusCore.DESTROYED;
    this.#updateLifecycle(NexusCore.DESTROYED);
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    this.#updateLifecycle(value);
  }

  #updateLifecycle(event) {
    let updateStatusWithEvent;
    switch (event) {
      case NexusCore.CONFIGURED:
        break;
      case NexusCore.LOADED:
        break;
      case NexusCore.SHUTTING_DOWN:
        if (this.#lifecycle.lastLifecycleUpdate === NexusCore.INIT) {
          break;
        }
        break;
      case NexusCore.SHUTDOWN:
        if (this.#lifecycle.lastLifecycleUpdate !== NexusCore.SHUTTING_DOWN) {
          break;
        }
        break;
      default:
      case NexusCore.INIT:
        if (this.#lifecycle.lastLifecycleUpdate !== NexusCore.INIT) {
          break;
        }
        break;
      case NexusCore.DESTROYED:
        if (this.#lifecycle.lastLifecycleUpdate) {
          break;
        }
        break;
    }
    this.#lifecycle.lastLifecycleUpdate = Date.now();
    this.#performLifecycleUpdate(event);
  }

  #performLifecycleUpdate(event) {
    const handler = this.#lifecycle.handlers.find(({event: e}) => e === event);
    if (handler) {
      handler.handler();
    } else {
      console.log(`No handler found for event ${event}.`);
    }
  }

  validateConfig(config) {
    const configSchema = this.createConfigSchema();
    const validator = new (require('jsonschema').Validator)();
    try {
      validator.checkSchema(configSchema);
      validator.validate(config, configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  createConfigSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' },
        version: { type: 'string' },
      },
      required: ['foo', 'baz', 'version']
    };
  }

  onLifecycleUpdate(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler, this);
    this.#lifecycle.handlers.push({event, handler: lifecycleHandler.handler});
  }

  get onLifecycleEvent() {
    return (event, handler) => {
      this.onLifecycleUpdate(event, handler);
    };
  }

  async waitForDestroy() {
    while (this.#pendingDestroy) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

const nexusCore = new NexusCore();
nexusCore.onLifecycleEvent(NexusCore.DESTROYED, async () => {
  console.log("NexusCore instance destroyed.");
});

await nexusCore.configure({ foo: 'baz', baz: false });
nexusCore.status = NexusCore.LOADED;
nexusCore.waitForDestroy().then(() => console.log("NexusCore instance has been destroyed."));