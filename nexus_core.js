class Config {
  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  constructor(values = {}) {
    Object.assign(this, values);
  }

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
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

  on(event) {
    this.handler.bind(this);
  }

  execute() {
    this.handler();
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

  configure(config) {
    this.on("CONFIGURED", () => {
      console.log(`Configured with ${Config.staticConfig.VERSION} and ${JSON.stringify(config)}.`);
      this.config = config;
      this.#lifecycle.configured = true;
    });
  }

  on(event, handler) {
    const lifecycleEvent = new LifecycleEvent(event);
    const lifecycleHandler = new LifecycleHandler(handler);
    this.#lifecycle[event] = lifecycleHandler;
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].execute();
    }
  }

  async load() {
    this.on("LOADED", () => {
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
    });
    console.log("Loading...");
    // Add your loading logic here
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.executeLifecycleEvent("LOADED");
  }

  async shutdown() {
    this.on("SHUTTING_DOWN", () => {
      console.log("Shutdown initiated...");
      try {
        // Add your shutdown logic here
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        this.status = "SHUTDOWN";
        this.executeLifecycleEvent("SHUTTING_DOWN");
      }
    });
    this.executeLifecycleEvent("SHUTTING_DOWN");
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
      shuttingDown: false
    };
  }
}

const nexusCore = new NexusCore();
nexusCore.on("DESTROYED", () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.status = 'RUNNING';
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();