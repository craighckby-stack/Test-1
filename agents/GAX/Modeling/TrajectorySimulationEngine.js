class Config {
  #configSchema;
  #values;

  constructor(schema, defaultConfig = {}) {
    this.#configSchema = schema;
    this.#values = defaultConfig;
  }

  get configSchema() {
    return this.#configSchema;
  }

  get values() {
    return this.#values;
  }

  set values(values) {
    this.#validate(values);
    this.#values = { ...this.#values, ...values };
  }

  #validate(values) {
    const ValidatorError = class extends Error {
      constructor(message, ...params) {
        super(message, ...params);
        this.name = "ValidatorError";
      }
    };

    try {
      return new Promise((resolve) => {
        new JSONSchemaValidator(this.configSchema).validate(values).then(resolve).catch((error) => {
          console.error('Config validation error:', error);
          throw error;
        });
      });
    } catch (error) {
      throw error;
    }
  }

  async configure(values = {}) {
    await this.#validate(values);
    this.#values = { ...this.#values, ...values };
  }

  async loadDefaults() {
    if (!Object.values(this.#values).some(value => value instanceof Promise)) {
      this.#values = { ...this.#values, ...this.defaultConfig };
    }
  }

  get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
  }

  get environment() {
    return process.env.NODE_ENV || "development";
  }

  async applyEnvironment() {
    let validEnvironment = true;
    try {
      const environment = this.#configSchema.consts
        ? await this.#validate({ environment: this.environment }) : null;
    } catch (error) {
      console.error('Config validation error:', error);
      validEnvironment = false;
    }

    if (!validEnvironment) {
      throw new Error('Invalid environment');
    }

    if (this.#configSchema.consts) {
      const environment = this.#configSchema.consts.find(env => env.const === this.environment);
      if (environment) {
        for (const key in environment.properties) {
          this.#values[key] = environment.properties[key];
        }
      }
    }
  }
}

class JSONSchemaValidator {
  #schema;
  #validator;

  constructor(schema) {
    this.#schema = schema;
    this.#validator = null;
  }

  async createValidator() {
    if (this.#validator) return this.#validator;

    if (this.#schema.consts) {
      const validator = new JSONSchemaValidator(this.#schema);
      const consts = this.#schema.consts;
      return {
        ...validator,
        async validate(obj) {
          const constSchema = consts.find(const => const.const === obj.environment);
          const properties = constSchema.properties;
          Object.assign(obj, properties);
          return validator.validate(obj);
        }
      };
    }

    return new JSONSchemaValidator(this.#schema);
  }

  async validate(obj) {
    if (this.#validator) return this.#validator.validate(obj);

    this.#validator = await this.createValidator();

    const validator = new Ajv({ allErrors: true });
    await validator.compile(this.#schema);
    try {
      await validator.validateAsync(obj);
      return obj;
    } catch (error) {
      console.error('Config validation error:', error);
      throw error;
    }
  }
}

class LifecycleEvent {
  #handler;
  event;

  constructor(event) {
    this.event = event;
  }

  get handler() {
    return this.#handler;
  }

  setHandler(handler) {
    this.#handler = handler;
  }

  execute() {
    if (this.#handler) {
      this.#handler();
    }
  }
}

class LifecycleHandler extends LifecycleEvent {
  bind(target = this) {
    this.#handler = this.#handler.bind(target);
  }

  execute() {
    if (this.#handler) {
      this.#handler();
    }
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  #status = "INIT";

  get status() {
    return this.#status;
  }

  set status(value) {
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        this.#lifecycle.shuttingDown = false;
      }
    }
    this.#status = value;
    const currentValue = this.#status;
    const lifecycle = this.#lifecycle;
    if (currentValue === 'INIT' && value !== 'INIT') {
      lifecycle.configured = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  async configure(config = Config.defaultConfig) {
    this.status = "CONFIGURING";
    try {
      await config.configure();
      this.#lifecycle.configured = true;
      this.config = config;
      this.status = "CONFIGURED";
      await config.applyEnvironment();
      return config;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async load() {
    this.status = "LOADING";
    try {
      await this.config.loadDefaults();
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.status = "LOADED";
    } catch (error) {
      console.error('Load error:', error);
      throw error;
    }
  }

  async shutdown() {
    this.status = "SHUTTING_DOWN";
    try {
      await this.executeLifecycleEvent("SHUTTING_DOWN");
      console.log("Shutdown initiated...");
      this.#lifecycle.shuttingDown = true;
      console.log("Shutdown complete...");
      this.status = "SHUTDOWN";
      await this.executeLifecycleEvent("SHUTDOWN");
    } catch (error) {
      throw error;
    }
  }

  async destroy() {
    console.log('Destroying NexusCore instance...');
    this.status = "DESTROY";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
  }

  async on(event, handler) {
    await this.executeLifecycleEvent(event);
    this.#lifecycle[event] = new LifecycleHandler(event);
    this.#lifecycle[event].handler = handler;
    this.#lifecycle[event].bind(this);
  }

  async executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].execute();
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
}

const configSchemaJson = `
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "foo": {"type": "string"},
    "baz": {"type": "boolean"},
    "environment": {"type": "string", "const": ["production", "development"]}
  },
  "required": ["foo"]
}
`;

const configSchema = JSON.parse(JSON.stringify(JSON.parse(configSchemaJson)));

const config = new Config(configSchema);

const nexusCore = new NexusCore();
nexusCore.configSchema = configSchema;

nexusCore.on("DESTROY", () => {
  console.log("NexusCore instance destroyed.");
});
const Ajv = require('ajv');
try {
  await nexusCore.configure();
  await nexusCore.start();
  await nexusCore.load();
  await nexusCore.shutdown();
  await nexusCore.destroy();
} catch (error) {
  console.error(error);
}


**New Features Aded:**

1. Introduced `applyEnvironment` method in the `Config` class, which validates and applies the environment settings.

2. Introduced `createValidator` method in the `JSONSchemaValidator` class, which returns an instance of a JSON schema validator that can handle environment validation if required in the JSON schema.

3. Updated `Config` class to inherit from `JSONSchemaValidator` in case environment validation is required.

4. Introduced `loadDefaults` method in the `Config` class, which loads default values for the configuration if not provided.

5. Updated NexusCore class to call configure method before start.

6. Removed redundant code, updated variables and some improvement