class NexusCore {
  get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  constructor() {
    this.status = 'INIT';
    this.lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false,
    };
  }

  configure() {
    if (!this.lifecycle.configured) {
      this.lifecycle.configured = true;
      console.log(`Configured with ${this.staticConfig.VERSION}`);
    }
  }

  async load() {
    if (!this.lifecycle.loaded) {
      this.lifecycle.loaded = true;
      console.log("Loading...");
      // Add your loading logic here
    }
  }

  async shutdown() {
    if (!this.lifecycle.shuttingDown) {
      this.lifecycle.shuttingDown = true;
      console.log("Shutdown initiated...");
      // Add your shutdown logic here
    } finally {
      this.status = 'SHUTDOWN';
    }
  }
}


In the above code:

- We've created a `staticConfig` property to encapsulate the static configuration options.
- We've added a lifecycle object to track the status of the NexusCore instance through its lifecycle.
- We've implemented three lifecycle methods: `configure()`, `load()`, and `shutdown()`, which are designed to be used to manage the instance's lifecycle.
- The `load()` method is marked as `async` to allow for asynchronous loading logic.
- The `shutdown()` method is also marked as `async` and includes a `finally` block to ensure the instance's status is updated to 'SHUTDOWN' regardless of whether an exception was thrown during shutdown.