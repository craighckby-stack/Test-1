class Config {
  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true,
      version: "1.0.0",
    };
  }

  constructor(config) {
    this.#defaultConfig = Config.defaultConfig;
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
    const mergedConfig = Object.assign({}, this.#defaultConfig, defaultConfig);
    const configTimestamp = new Date().getTime();
    return {...mergedConfig, configTimestamp};
  }

  validateConfig() {
    const validator = new (require('jsonschema').Validator)();
    validator.validate(this.#cache, this.createConfigSchema());
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

  #event;
  #handler;

  constructor(event, handler) {
    this.#event = event;
    this.#handler = handler;
  }

  get event() {
    return this.#event;
  }

  set event(event) {
    this.#event = event;
  }

  get handler() {
    return this.#handler;
  }

  set handler(handler) {
    this.#handler = handler;
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

  constructor() {
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      handlers: [],
      lastLifecycleUpdate: Date.now(),
    };
    this.#status = NexusCore.INIT;
  }

  async configure(config) {
    await this.validateConfig(config);
    this.#lifecycle.configured = true;
    this.#performLifecycleUpdate(NexusCore.CONFIGURED);
    this.status = NexusCore.CONFIGURED;
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
    this.#performLifecycleUpdate(NexusCore.LOADED);
    this.status = NexusCore.LOADED;
    return this;
  }

  shutdown() {
    if (!this.#lifecycle.shuttingDown) {
      this.#lifecycle.shuttingDown = true;
      this.#performLifecycleUpdate(NexusCore.SHUTTING_DOWN);

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
          this.status = NexusCore.SHUTDOWN;
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
    this.status = NexusCore.DESTROYED;
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      handlers: [],
      lastLifecycleUpdate: Date.now(),
    };
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    this.#updateLifecycle(value);
  }

  #updateLifecycle(event) {
    const lastLifecycleUpdate = this.#lifecycle.lastLifecycleUpdate;
    let updateStatusWithEvent;
    switch (event) {
      case NexusCore.CONFIGURED:
        break;
      case NexusCore.LOADED:
        break;
      case NexusCore.SHUTTING_DOWN:
        if (lastLifecycleUpdate === NexusCore.INIT) {
          break;
        }
        break;
      case NexusCore.SHUTDOWN:
        if (lastLifecycleUpdate !== NexusCore.SHUTTING_DOWN) {
          break;
        }
        break;
      default:
      case NexusCore.INIT:
        if (lastLifecycleUpdate !== NexusCore.INIT) {
          break;
        }
        break;
      case NexusCore.DESTROYED:
        if (lastLifecycleUpdate) {
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
}

const nexusCore = new NexusCore();
nexusCore.onLifecycleEvent(NexusCore.DESTROYED, async () => {
  console.log("NexusCore instance destroyed.");
});

await nexusCore.configure({ foo: 'baz', baz: false });
nexusCore.status = NexusCore.LOADED;
await nexusCore.shutdown();
nexusCore.destroy();

This code includes enhancements such as advanced NexusCore patterns, lifecycle management (configure, load, shutdown), and robust encapsulation.

Here are some of the key improvements:

* Simplified the status management by using a single property (`#status`)
* Introduced a separate method (`#updateLifecycle`) to update the lifecycle state
* Moved the event handling logic to the `#performLifecycleUpdate` method
* Introduced a `createConfigSchema` method to create the JSON schema for the config validation
* Updated the example usage to be more concise and clear.