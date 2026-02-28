import { Inject, injectable, singleton } from 'genkit';
import { JsonSchema } from 'jsonschema';

class Config {
  @Inject('config') static defaultConfig;

  static readonly defaultConfigSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      baz: { type: 'boolean' },
    },
  };

  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development",
    };
  }

  constructor(values = {}, container) {
    this.setValues(values, container);
  }

  setValues(values, container) {
    container.bind('config', values);
    return this;
  }

  @Inject('jsonSchema')
  validateConfig(@Inject('config') config) {
    const schema = Config.defaultConfigSchema;
    const jsonSchemaInstance = new JsonSchema();
    jsonSchemaInstance.validate(config, schema);
  }

  validate(container) {
    this.validateConfig(this, container);
  }
}

class LifecycleEvent {
  constructor(event, container) {
    container.bind('lifecycleEvent', this);
    this.event = event;
  }
}

class LifecycleHandler {
  constructor(handler, container) {
    container.bind('lifecycleHandler', this);
    this.handler = handler;
  }

  bind(target = this) {
    this.handler = this.handler.bind(target);
    return this;
  }

  execute(container) {
    this.handler(container);
  }
}

@singleton
class NexusCore {
  #initialStatus = "INIT";
  #container;
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
  };

  constructor(container) {
    this.#container = container;
  }

  @Inject()
  private get container() {
    return this.#container;
  }

  private get status() {
    return this.#initialStatus;
  }

  private set status(value) {
    this.#initialStatus = value;
    const currentValue = this.#initialStatus;
    const lifecycle = this.#lifecycle;
    if (value !== "INIT") {
      console.log(`NexusCore instance is ${value}.`);
      if (value === "SHUTDOWN") {
        lifecycle.shuttingDown = false;
      }
    }
    if (currentValue === "INIT" && value !== "INIT") {
      lifecycle.configured = true;
    }
  }

  private get lifecycle() {
    return this.#lifecycle;
  }

  private validate(@Inject('config') config) {
    config.validate(this.container);
  }

  @Inject('config')
  configure(@Inject('config') config) {
    this.validate(config);
    this.#lifecycle.configured = true;
    this.config = config;
  }

  @Inject('jsonSchema')
  @Inject('config')
  private configureConfigSchemaValidation(config) {
    const schema = Config.defaultConfigSchema;
    const jsonSchemaInstance = new JsonSchema();
    jsonSchemaInstance.validate(config, schema);
  }

  protected onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler, this.container);
    this.#lifecycle[event] = lifecycleHandler;
    return lifecycleHandler.bind(this);
  }

  get on() {
    return (event, handler) => {
      const lifecycleEvent = new LifecycleEvent(event, this.container);
      this.onLifecycleEvent(event, handler);
    };
  }

  protected executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute(this.container);
    }
  }

  async load(container) {
    try {
      this.executeLifecycleEvent("CONFIGURED");
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.executeLifecycleEvent("LOADED");
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown(container) {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        this.executeLifecycleEvent("SHUTTING_DOWN");
        console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName](this.container);
      }
    }
  }

  async destroy(container) {
    this.status = "DESTROYED";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
    };
  }

  async on(event, handler) {
    this.onLifecycleEvent(event, handler);
    return this;
  }
}

const container = new genkit.Container();
const nexusCore = new NexusCore(container);
container.bind('nexusCore', nexusCore);
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();