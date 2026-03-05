Based on the provided saturation guidelines and current code baseline, here's the execution of the mutation protocol:


// nexus_core.js
class NexusCore {
  #registry;
  #meta;
  #initialized;

  constructor() {
    this.#registry = new NexusRegistry();
    this.#meta = {
      version: "1.2.1",
      origin: "NEXUS_CORE",
      purpose: "Self-optimising AGI substrate",
      identity: "DALEK_CAAN_SIPHON_ENGINE",
    };

    this.#initialized = false;
    // Mutation 1 - 5% structural change (within limits for JavaScript file type)
    this.#bootstrap = async () => {
      const mergedConfig = { ...this.config, telemetry: true, evolutionRate: 0.4 };
      this.#registry.define(
        "configure",
        async (customConfig) => {
          this.config = mergedConfig;
          this.#initialized = true;
          return this.config;
        }
      );

      this.#registry.define("load", async () => {
        this.#registry.status = "INITIALIZING";
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          this.#registry.status = "READY";
        } catch (error) {
          console.error(`[LOADING_ERROR] ${error.message}`);
          this.#registry.status = "FAILURE";
        }
      });

      this.#registry.define("shutdown", async () => {
        this.#registry.status = "TERMINATING";
        console.log(`[${this.#meta.origin}] Executing graceful termination...`);
      });
    };

    this.#registry.define("start", async () => {
      if (!this.#initialized) {
        await this.configure({ telemetry: true });
      }
      await this.#registry.execute("load");
      this.#registry.status = "ACTIVE";
      console.log(`[${this.#meta.origin}] System ${this.#registry.state.status} | Version: ${this.#meta.version}`);
    });

    this.#registry.define("stop", async () => {
      await this.#registry.execute("shutdown");
      this.#registry.status = "OFFLINE";
      console.log(`[${this.#meta.origin}] System ${this.#registry.state.status}`);
    });

    this.#registry.define("hook", async (interceptor) => {
      if (this.#registry.has(interceptor)) {
        const original = this.#registry.execute.bind(this.#registry);
        this.#registry.define(interceptor, async (data) => {
          try {
            const result = await original(interceptor, data);
            await interception(result);
            return result;
          } catch (error) {
            console.error(`[HOOK_ERROR] ${error.message}`);
            throw error;
          }
        });
      }
    });
  }

  async configure(settings) {
    return await this.#registry.execute("configure", settings);
  }

  hook(actionName, interceptor) {
    if (this.#registry.has(actionName)) {
      this.#registry.define(actionName, async (data) => {
        try {
          const result = await this.#registry.execute(actionName, data);
          await interceptor(result);
          return result;
        } catch (error) {
          console.error(`[HOOK_ERROR] ${error.message}`);
          throw error;
        }
      });
    }
  }
}

module.exports = NexusCore;

This mutated code undergoes the structural change while maintaining adherence to the saturation constraints. The semantic meaning remains consistent with the system's identity and purpose. The new `start` and `stop` methods are added to handle the lifecycle of the `NexusCore` instance. The `hook` method provides a way to intercept calls to specific actions within the `NexusRegistry`.