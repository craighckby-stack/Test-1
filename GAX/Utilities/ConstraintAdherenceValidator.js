class Config {
  #_schema;
  #_values;
  #_validator;

  constructor(values = {}) {
    this.#_schema = {
      type: 'object',
      properties: {
        foo: { type: 'string', default: 'bar' },
        baz: { type: 'boolean', default: false }
      },
      required: ['foo', 'baz']
    };
    this.#_values = { ...values };
    this.#_validator = new JSONSchemaValidator();
    this.#_validator.addSchema(this.#_schema);
    this.#validateConfig();
  }

  #validateConfig() {
    try {
      this.#_validator.validate(this.#_values, this.#_schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  get schema() {
    return this.#_schema;
  }

  get values() {
    return { ...this.#_values };
  }

  set values(value) {
    this.#parseValues(value);
    this.#validateConfig();
  }

  #parseValues(values) {
    Object.assign(this.#_values, values);
  }

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: false
    };
  }
}

abstract class LifecycleEvent extends Error {
  constructor(eventName, message = '') {
    super(message);
    this.name = 'LifecycleEvent';
    this.eventName = eventName;
  }
}

abstract class LifecycleHandler {
  #_target;
  #_event;
  #_handler;

  constructor(handler) {
    this.#_handler = handler;
  }

  bind(target = this, event = this.eventName, handler = this.handler) {
    this.#_target = target;
    this.#_event = event;
  }

  async execute(event, params = {}) {
    if (!this.#_target) {
      console.error('Target object not found for event:', event);
      throw new Error(`Target object not found for event: ${event}`);
    }
    await this.#_handler.call(this.#_target, this.#_event, params);
  }
}

class NexusCore {
  #_instance;
  #_config;
  #_status;
  #_lifecycle;
  #_eventHandlers;

  static get instance() {
    if (!this.#_instance) {
      this.#_instance = new NexusCore();
    }
    return this.#_instance;
  }

  constructor() {
    if (this.constructor === NexusCore) {
      throw new Error('NexusCore instance is not singleton');
    }
  }

  get status() {
    return this.#_status;
  }

  get lifecycle() {
    return this.#_lifecycle;
  }

  get config() {
    return { ...this.#_config };
  }

  set config(value) {
    if (!value || typeof value !== 'object') {
      throw new Error('Invalid config');
    }
    this.#_config = value;
    this.#_validateConfig();
    this.#_lifecycle.configured = true;
  }

  #_validateConfig() {
    try {
      const validator = new JSONSchemaValidator();
      if (!validator.addSchema(Config.schema)) {
        console.error('Schema validation error:', validator.errors);
        throw new Error('Schema validation error');
      }
      validator.validate(this.#_config, Config.schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  on(event, handler, priority = 0) {
    if (!this.#_eventHandlers[event]) {
      this.#_eventHandlers[event] = [];
    }
    const eventHandler = new LifecycleHandler(handler);
    eventHandler.bind(this, event, handler);
    if (priority !== 0) {
      this.#addHandler(event, eventHandler, priority);
    } else {
      this.#_eventHandlers[event].push(eventHandler);
    }
  }

  #addHandler(event, handler, priority) {
    const sortedHandlers = [...this.#_eventHandlers[event]].sort((a, b) => b.priority - a.priority);
    const handlerIndex = sortedHandlers.findIndex((h) => h.priority < priority && h !== handler);
    if (handlerIndex !== -1) {
      sortedHandlers.splice(handlerIndex, 0, handler);
      this.#_eventHandlers[event] = sortedHandlers;
    } else if (!this.#_eventHandlers[event].includes(handler)) {
      this.#_eventHandlers[event].push(handler);
    }
  }

  async executeLifecycleEvent(event, params = {}) {
    if (!this.#_lifecycle[event]) {
      console.error('Lifecycle event not found:', event);
      throw new Error(`Lifecycle event not found: ${event}`);
    }
    const lifecycleEventHandler = this.#_lifecycle[event];
    try {
      for (const handler of this.#_eventHandlers[event]) {
        await handler.execute(event, params);
      }
      return lifecycleEventHandler.resolve();
    } catch (e) {
      console.error('Lifecycle event handler error:', e);
      throw e;
    }
  }

  async configure(config = Config.defaultConfig) {
    await this.#onLifecycleEvent('CONFIGURING');
    this.#_config = { ...config };
    this.#_validateConfig();
    try {
      await this.#onLifecycleEvent('CONFIGURED');
    } catch (e) {
      console.error('Configuration error:', e);
      throw e;
    }
  }

  async #onLifecycleEvent(event) {
    if (!this.#_lifecycle[event]) {
      console.error('Lifecycle event not found:', event);
      throw new Error(`Lifecycle event not found: ${event}`);
    }
    await this.executeLifecycleEvent(event);
  }

  async load() {
    if (!this.#_lifecycle.loaded) {
      try {
        await this.#onLifecycleEvent('LOADING');
        console.log('Loading...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Loading complete...');
        await this.#onLifecycleEvent('LOADED');
      } catch (e) {
        console.error('Load error:', e);
        throw e;
      }
    }
  }

  async shutdown() {
    if (this.#_lifecycle.shuttingDown) return;
    try {
      await this.#onLifecycleEvent('SHUTTING_DOWN');
      console.log('Shutdown initiated...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Shutdown complete...');
      this.#_lifecycle.shuttingDown = true;
      await this.#onLifecycleEvent('SHUTDOWN');
    } catch (e) {
      console.error('Shutdown error:', e);
      throw e;
    }
  }

  async start() {
    for (const method of ['configure', 'load']) {
      if (this[method] instanceof Function) {
        await this[method]();
      }
    }
  }

  async destroy() {
    if (!this.#_lifecycle.destroying) {
      try {
        this.#_lifecycle.destroying = true;
        await this.#onLifecycleEvent('DESTROYING');
        this.#_lifecycle = {
          configured: false,
          loaded: false,
          shuttingDown: false,
          destroying: false
        };
        console.log('NexusCore instance destroyed.');
      } catch (e) {
        console.error('Destroy error:', e);
        throw e;
      }
    }
  }
}

class NexusCoreLifecycle extends NexusCore {
  #_initialStatus;
  #_lifecycleStatus;

  constructor(status = 'INIT') {
    super();
    this.#_initialStatus = status;
    this.#_lifecycleStatus = status;
  }

  get status() {
    return this.#_lifecycleStatus;
  }

  #onLifecycleEvent(event) {
    if (event.includes('CONFIGURING')) {
      this.#_lifecycleStatus = 'CONFIGURING';
    } else if (event.includes('CONFIGURED')) {
      this.#_lifecycleStatus = 'CONFIGURED';
    } else if (event.includes('LOADING')) {
      this.#_lifecycleStatus = 'LOADING';
    } else if (event.includes('LOADED')) {
      this.#_lifecycleStatus = 'LOADED';
    } else if (event.includes('SHUTTING_DOWN')) {
      this.#_lifecycleStatus = 'SHUTTING_DOWN';
    } else if (event.includes('SHUTDOWN')) {
      this.#_lifecycleStatus = 'SHUTDOWN';
    } else if (event.includes('DESTROYING')) {
      this.#_lifecycleStatus = 'DESTROYING';
      this.#lifecycleEventComplete(event);
    } else {
      this.#lifecycleEventComplete(event);
      this.#_lifecycleStatus = this.#_initialStatus;
    }
  }

  #lifecycleEventComplete(event) {
    this.#_lifecycle[event.replace('_', '')] = true;
  }
}

const nexusCore = new NexusCoreLifecycle();
nexusCore.on('DESTROYED', () => {
  console.log('NexusCore instance destroyed.');
}, 0);
nexusCore.config = Config.defaultConfig;
await nexusCore.start();
await nexusCore.load();
await nexusCore.shutdown();
await nexusCore.destroy();


In the enhanced version, I have encapsulated the lifecycle event handling and status management within the `NexusCoreLifecycle` class. This allows for a cleaner separation of concerns between lifecycle event handling and the actual NexusCore instance.

Additionally, I have refactored some code to follow best practices, such as using consistent naming conventions and removing redundant comments.

Note that this is an advanced implementation, and you should adjust the code according to your specific requirements and use case.