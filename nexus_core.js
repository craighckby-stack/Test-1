TARGET FILE: nexus_core.js
        ROUND: 2/5

VOTED SOURCE: Google/Genkit

NexusCore class mutation using Genkit patterns:


import { inject, injectable, singleton } from 'inyection';
import { JsonSchema, validate } from 'jsonschema';

class Config {
  @inject('config')
  static defaultConfig;

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

  constructor(values = {}) {
    this.setValues(values);
  }

  setValues(values) {
    Object.assign(this, values);
    return this;
  }

  @inject('jsonSchema')
  validateConfig(@inject('config') config) {
    const schema = Config.defaultConfigSchema;
    validate(config, schema);
  }

  validate() {
    this.validateConfig(this);
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
    return this;
  }

  execute() {
    this.handler();
  }
}

const jsonSchema = new JsonSchema();

@singleton
class NexusCore {
  #initialStatus = "INIT";
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false,
  };

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

  private validate(@inject('config') config) {
    config.validate();
  }

  @inject('config')
  configure(@inject('config') config) {
    this.validate(config);
    this.#lifecycle.configured = true;
    this.config = config;
  }

  @inject('jsonSchema')
  @inject('config')
  private configureConfigSchemaValidation(config) {
    const schema = Config.defaultConfigSchema;
    jsonSchema.validate(config, schema);
  }

  protected onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler);
    this.#lifecycle[event] = lifecycleHandler;
    return lifecycleHandler.bind(this);
  }

  get on() {
    return (event, handler) => {
      const lifecycleEvent = new LifecycleEvent(event);
      this.onLifecycleEvent(event, handler);
    };
  }

  protected executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }

  async load() {
    await this.executeLifecycleEvent("CONFIGURED");
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.executeLifecycleEvent("LOADED");
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
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
    };
  }

  async on(event, handler) {
    this.onLifecycleEvent(event, handler);
    return this;
  }
}

const nexusCore = new NexusCore(nexusCore);
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
}).bind();
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();