class Config {
  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true,
      version: "1.0.0",
    };
  }

  #configSchema;
  #cache;

  constructor(config) {
    this.#configSchema = this.createConfigSchema();
    this.#cache = this.mergeDefaultConfig(config);
    this.validateConfig();
  }

  createConfigSchema() {
    return new ConfigSchema({
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' },
        version: { type: 'string' },
      },
      required: ['foo', 'baz', 'version']
    });
  }

  mergeDefaultConfig(defaultConfig) {
    const mergedConfig = { ...Config.defaultConfig, ...defaultConfig };
    const configTimestamp = new Date().getTime();
    return { ...mergedConfig, configTimestamp };
  }

  validateConfig() {
    const validator = new JsonValidator();
    try {
      validator.checkSchema(this.#configSchema);
      validator.validate(this.#cache, this.#configSchema);
    } catch (e) {
      throw new ConfigValidationError(`Config validation error: ${e.message}`);
    }
  }

  get config() {
    return this.#cache;
  }

  set config(value) {
    this.#cache = this.mergeDefaultConfig(value);
    this.validateConfig();
  }
}

class ConfigSchema {
  constructor(schema) {
    this.schema = schema;
  }

  get schema() {
    return this._schema;
  }

  set schema(schema) {
    this._schema = schema;
  }
}

class JsonValidator {
  constructor(schema) {
    this.schema = schema;
  }

  checkSchema(schema) {
    // eslint-disable-next-line no-undef
    return new Validator().validate(schema);
  }

  validate(data, schema) {
    // eslint-disable-next-line no-undef
    return new Validator().validate(data, schema);
  }
}

class ConfigValidationError extends Error {}

class LifecycleEvent {
  static INIT = 'INIT';
  static CONFIGURED = 'CONFIGURED';
  static LOADED = 'LOADED';
  static SHUTTING_DOWN = 'SHUTTING_DOWN';
  static SHUTDOWN = 'SHUTDOWN';
  static DESTROYED = 'DESTROYED';
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
  static INIT = 'INIT';
  static CONFIGURED = 'CONFIGURED';
  static LOADED = 'LOADED';
  static SHUTTING_DOWN = 'SHUTTING_DOWN';
  static SHUTDOWN = 'SHUTDOWN';
  static DESTROYED = 'DESTROYED';

  #status;
  #lifecycle;
  #pendingDestroy;
  #handlers;

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
    this.#handlers = [];
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
    await Promise.all(this.#lifecycle.handlers.map(({ event, handler }) => {
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
        Promise.all(this.#lifecycle.handlers.map(({ event, handler }) => {
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

  onLifecycleUpdate(event, handler) {
    this.#handlers.push({ event, handler: new LifecycleHandler(handler).bind(this) });
    this.#updateLifecycle(event);
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

  private async raiseLifecycleEvent(event: LifecycleEvent, args: any) {
    try {
      const handler = this.#lifecycle.handlers.find(handler => handler.event === event);
      if (handler) {
        await handler.handler();
      }
    } catch (e) {
      console.error(`Error raising event ${event}: ${e.message}`);
    }
  }

  private async #updateLifecycle(event: LifecycleEvent) {
    this.#raiseLifecycleEvent(event);
    this.#handlers.forEach(({ event: e }) => {

      if (e === event) {
        this.#raiseLifecycleEvent(e);
      }
    });
  }

  private async raiseInit() {
    await this.#raiseLifecycleEvent(LifecycleEvent.INIT);
    return this;
  }

  async configure(config) {
    await this.raiseConfigured();
    return this;
  }

  private async raiseConfigured() {
    await this.#raiseLifecycleEvent(LifecycleEvent.CONFIGURED);
  }

  async ensureConfigured() {
    if (!this.#lifecycle.configured) {
      throw new Error('Not Configured');
    }
  }

  private async raiseLoaded() {
    await this.#raiseLifecycleEvent(LifecycleEvent.LOADED);
  }

  async ensureLoaded() {
    if (!this.#lifecycle.loaded) {
      throw new Error('Not Loaded');
    }
  }

  private async raiseShuttingDown() {
    await this.#raiseLifecycleEvent(LifecycleEvent.SHUTTING_DOWN);
  }

  async ensureShuttingDown() {
    if (!this.#lifecycle.shuttingDown) {
      throw new Error('Not Shuting Down');
    }
  }

  private async raiseShutdown() {
    await this.#raiseLifecycleEvent(LifecycleEvent.SHUTDOWN);
  }

  private async raiseDestroyed() {
    await this.#raiseLifecycleEvent(LifecycleEvent.DESTROYED);
    this.destroy();
  }

  async shutdown() {
    await this.raiseShuttingDown();
    return new Promise((resolve, reject) => {
      console.log("Shutdown initiated...");
      Promise.all(this.#lifecycle.handlers.map(({ event, handler }) => {
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
        this.raiseShutdown();
        resolve(this);
      }).catch((e) => {
        console.error("Shutdown error:", e);
        reject(e);
      });
    });
  }

  async destroy() {
    this.raiseDestroyed();
  }

  async start() {
    return this.raiseInit();
  }
}

class MyEvent {
  async handle() {
    console.error('MyEvent triggered');
    return 1;
  }
}

(() => {
  const nexusCore = new NexusCore();
  nexusCore.onLifecycleEvent(LifecycleEvent.DESTROYED, () => {
    console.log("NexusCore instance destroyed.");
  });

  try {
    await nexusCore.configure({ foo: 'baz', baz: false });
    nexusCore.status = LifecycleEvent.LOADED;
    await nexusCore.shutdown();
  } catch (err) {
    console.error("Error in tests:", err);
  }
})();