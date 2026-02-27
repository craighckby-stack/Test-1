class Entity {
  #name;

  get name() {
    return this.#name;
  }

  constructor(name) {
    this.#name = name;
    this.onCreate();
  }

  onCreate() {}

  onDispose() {}
}

class Config extends Entity {
  #staticConfig = {
    VERSION: "1.0.0",
    env: process.env.NODE_ENV || "development"
  };

  #defaultConfig = {
    foo: 'bar',
    baz: true
  };

  #configSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' }
    }
  };

  get staticConfig() {
    return this.#staticConfig;
  }

  get defaultConfig() {
    return this.#defaultConfig;
  }

  get configSchema() {
    return this.#configSchema;
  }

  async validate(values = {}) {
    try {
      const schema = Config.configSchema;
      const validator = new (await import('jsonschema')).Validator();
      validator.checkSchema(schema);
      const result = await new Promise((resolve) => {
        validator.validate(values, schema, (e) => {
          if (e) {
            console.error('Config validation error:', e);
          } else {
            resolve(true);
          }
        });
      });
      return result;
    } catch (e) {
      console.error('Config validation error:', e);
      return null;
    }
  }
}

class LifecycleEvent extends Entity {
  #eventsToNotify = {};

  constructor(event) {
    super(event);
    this.event = event;
  }

  async append(handler) {
    if (!this.#eventsToNotify[this.event]) {
      this.#eventsToNotify[this.event] = [];
    }
    this.#eventsToNotify[this.event].push(handler);
  }

  async notify(value) {
    if (this.#eventsToNotify[this.event]) {
      for (const handler of this.#eventsToNotify[this.event]) {
        await handler(value);
      }
    }
  }
}

class LifecycleHandler extends Entity {
  #handlersToNotify = {};

  constructor(handler) {
    super('LifecycleHandler');
    this.handler = handler;
  }

  async append(event, handler) {
    if (!this.#handlersToNotify[event]) {
      this.#handlersToNotify[event] = [];
    }
    this.#handlersToNotify[event].push(handler);
  }

  async invoke(event) {
    const result = await this.handler(this);
    return result;
  }
}

class NexusCore {
  #config = null;
  #lifecycleStatus = 'INIT';
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
    events: {},
    handlers: {}
  };

  constructor() {
    this.#lifecycle.events = {};
    this.#lifecycle.handlers = {};
    this.onCreate();
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] && typeof this[methodName] === "function") {
        try {
          await this[methodName]();
        } catch (e) {
          console.error('Error starting NexusCore:', e);
          this.destroy();
        }
      }
    }
  }

  async configure(config) {
    try {
      const validatedConfig = await Config.validate(config);
      await this.#lifecycle.handlers.CONFIGURED.append(new LifecycleHandler(async () => {
        this.#lifecycle.configured = true;
        this.#config = config;
      }));
      this.#lifecycle.events.CONFIGURED = new LifecycleEvent('CONFIGURED');
      await this.#lifecycle.events.CONFIGURED.append(this.#lifecycle.handlers.CONFIGURED.append.bind(this.#lifecycle.handlers.CONFIGURED));
      await this.#lifecycle.events.CONFIGURED.append(() => {
        this.#lifecycle.configured = true;
        this.#config = config;
      });
      await this.#lifecycle.events.CONFIGURED.notify(true);
      this.#lifecycleStatus = "CONFIGURED";
    } catch (e) {
      console.error('Config validation error:', e);
    }
  }

  async asyncLoad() {
    try {
      await Promise.all([
        this.configure(Config.defaultConfig),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      this.#lifecycle.loaded = true;
      console.log("Loading complete...");
      this.#lifecycleStatus = "LOADED";
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async asyncShutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        this.#lifecycleStatus = "SHUTTING_DOWN";
        await this.executeLifecycleEvent("SHUTTING_DOWN");
        this.#lifecycleStatus = "SHUTDOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  on(event, handler) {
    if (!this.#lifecycle.handlers[event]) {
      this.#lifecycle.handlers[event] = new LifecycleHandler(handler);
    }
    this [#lifecycle.handlers[event]].append(event, handler);
    return this;
  }

  executeLifecycleEvent(event) {
    try {
      new Promise((resolve) => {
        if (this.#lifecycle.events[event]) {
          this.#lifecycle.events[event].notify().then(() => {
            this.#lifecycle.events[event] = undefined;
            resolve(true);
          }).catch(e => {
            console.error('Error:', e);
            this.destroy();
          });
        }
        resolve(true);
      });
    } catch (e) {
      console.error('Error:', e);
    }
  }

  destroy() {
    this.#lifecycleStatus = "DESTROYED";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
      events: {},
      handlers: {}
    };
    this.#config = null;
  }

  get status() {
    return this.#lifecycleStatus;
  }

  get lifecycle() {
    return this.#lifecycle;
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.asyncLoad();
nexusCore.asyncShutdown();
nexusCore.destroy();


In the updated code, Entity class is introduced which makes classes like Config, LifecycleEvent, and LifecycleHandler inheritable, which also inherit the onCreate and onDispose methods to add encapsulation in Entity-related classes by creating instances of these classes dynamically.

Additionally, the Lifecycle handlers and Events of the NexusCore class are now stored in objects to improve memory management by storing related events in objects instead of arrays.