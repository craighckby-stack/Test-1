// NEXUS_CORE v1.0

/**
 * @typedef {'INIT'|'CONFIGURED'|'LOADING'|'READY'|'ERROR'|'SHUTDOWN'} NexusCoreStatus
 * Represents the distinct operational states of the NEXUS_CORE.
 * This enum-like type promotes clear, controlled state transitions,
 * a common pattern in robust research systems for managing complex lifecycles,
 * mirroring how Genkit components transition through setup and runtime phases.
 */

/**
 * @typedef {object} ILifecycleComponent
 * An interface for components that can be managed by NexusCore.
 * Inspired by Genkit's approach to integrating various components (models, tools),
 * where components often have distinct setup and teardown phases.
 * @property {() => Promise<void>} [load] - An optional asynchronous method to load/initialize the component.
 * @property {() => Promise<void>} [shutdown] - An optional asynchronous method to shut down/clean up the component.
 */

/**
 * @typedef {object} NexusCoreOptions
 * Configuration options for the NexusCore, akin to `configureGenkit`'s options object.
 * This centralizes initial setup and allows for dynamic provisioning of sub-components.
 * @property {Array<{name: string, component: ILifecycleComponent}>} [components] - An array of initial components to register with the core.
 * @property {boolean} [verbose] - If true, enables more detailed logging for debugging. Defaults to false.
 * @property {number} [loadDelayMs] - Simulated delay for the core's own loading process, in milliseconds. Defaults to 500.
 * @property {number} [shutdownDelayMs] - Simulated delay for the core's own shutdown process, in milliseconds. Defaults to 200.
 */

/**
 * The NexusCore class encapsulates the central metadata, status, and lifecycle management
 * for the NEXUS_CORE system. It exemplifies patterns common in large-scale research software
 * for managing core components, with improvements inspired by `firebase/genkit`:
 *
 * - **Encapsulation:** Private fields and public getters ensure controlled access to internal state.
 * - **Immutability:** Version and name are static constants, reflecting a stable core identity.
 * - **Controlled State Transitions:** A dedicated method (`transitionStatus`) manages state changes.
 * - **Lifecycle Management:** Methods like `configure`, `load`, and `shutdown` outline explicit phases.
 *   `configure` provides a declarative setup phase similar to `configureGenkit`.
 * - **Component Orchestration:** The core can register and manage lifecycle of sub-components (`ILifecycleComponent`),
 *   allowing for a modular and extensible architecture, much like Genkit manages models and plugins.
 * - **Observability:** Enhanced internal logging (with a `verbose` option) provides insights into state changes and operations.
 *
 * Exporting a singleton instance ensures a single, globally consistent view of the core system.
 */
class NexusCore {
  /**
   * The immutable semantic version of the NEXUS_CORE module.
   * @type {string}
   * @readonly
   */
  static VERSION = "1.0.0";

  /**
   * The immutable symbolic name of the core system.
   * @type {string}
   * @readonly
   */
  static NAME = "NEXUS_CORE";

  /**
   * The current operational status of the core.
   * @type {NexusCoreStatus}
   */
  #status;

  /**
   * Timestamp when this core instance was initialized.
   * @type {Date}
   */
  #initializedAt;

  /**
   * Configuration options for the core instance.
   * @type {NexusCoreOptions}
   */
  #options;

  /**
   * A map to store registered components.
   * @type {Map<string, ILifecycleComponent>}
   */
  #components;

  /**
   * Flag to ensure `configure` is called only once.
   * @type {boolean}
   */
  #isConfigured = false;

  /**
   * Creates an instance of NexusCore.
   * Initializes the core with an 'INIT' status and records the initialization time.
   * Configuration is deferred to the `configure` method.
   */
  constructor() {
    this.#status = 'INIT';
    this.#initializedAt = new Date();
    this.#components = new Map();
    this.#options = { verbose: false, loadDelayMs: 500, shutdownDelayMs: 200 }; // Default options
    this.#log(`Initialized at ${this.#initializedAt.toISOString()} with status: ${this.#status}`);
  }

  /**
   * Internal logging utility that respects the verbose option.
   * @param {string} message - The message to log.
   * @param {'log'|'warn'|'error'|'info'|'debug'} [level='log'] - The console method to use.
   * @param {...any} args - Additional arguments to pass to the console method.
   */
  #log(message, level = 'log', ...args) {
    if (this.#options.verbose || level === 'error' || level === 'warn') {
      console[level](`[${NexusCore.NAME} v${NexusCore.VERSION}] [${this.status}] ${message}`, ...args);
    }
  }

  /**
   * Retrieves the current operational status of the core.
   * @returns {NexusCoreStatus}
   */
  get status() {
    return this.#status;
  }

  /**
   * Retrieves the version of the core.
   * @returns {string}
   */
  get version() {
    return NexusCore.VERSION;
  }

  /**
   * Retrieves the name of the core.
   * @returns {string}
   */
  get name() {
    return NexusCore.NAME;
  }

  /**
   * Retrieves the timestamp when the core was initialized.
   * @returns {Date}
   */
  get initializedAt() {
    return this.#initializedAt;
  }

  /**
   * Configures the NexusCore system. This method is analogous to `configureGenkit`,
   * allowing for declarative setup of core parameters and initial components.
   * Can only be called once.
   * @param {NexusCoreOptions} options - Configuration options for the core.
   * @param {string} metaType - The meta-type of the component.
   * @param {object} config - Additional configuration for the component.
   * @returns {void}
   * @throws {Error} If called when the core is not in 'INIT' status or already configured.
   */
  async configure(options, metaType, config) {
    if (this.#status !== 'INIT') {
      throw new Error(`[${this.name}] Cannot configure core from status: '${this.#status}'. Must be 'INIT'.`);
    }
    if (this.#isConfigured) {
      this.#log("Core is already configured. Ignoring subsequent `configure` call.", 'warn');
      return;
    }

    this.#log("Configuring core system...", 'info');
    this.#options = { ...this.#options, ...options };
    this.#isConfigured = true;

    if (this.#options.components) {
      for (const { name, component } of this.#options.components) {
        await this.registerComponent(name, component, metaType, config);
      }
    }
    this.transitionStatus('CONFIGURED');
    this.#log("Core system configured successfully.", 'info');
  }

  /**
   * Registers a component with the NexusCore. This enables the core to manage
   * the lifecycle (load/shutdown) of modular sub-systems.
   * @param {string} name - A unique name for the component.
   * @param {ILifecycleComponent} component - The component instance to register.
   * @returns {Promise<void>}
   * @throws {Error} If a component with the same name is already registered.
   */
  async registerComponent(name, component, metaType, config) {
    if (this.#components.has(name)) {
      throw new Error(`[${this.name}] Component '${name}' is already registered.`);
    }
    if (typeof component !== 'object' || component === null) {
      throw new Error(`[${this.name}] Registered component '${name}' must be an object.`);
    }
    this.#components.set(name, { component, metaType, config });
    this.#log(`Registered component: '${name}'.`);
  }

  /**
   * Transitions the core to a new operational status.
   * @param {NexusCoreStatus} newStatus - The target status to transition to.
   * @returns {void}
   * @throws {Error} For invalid state transitions (e.g., trying to LOAD when already READY).
   */
  async transitionStatus(newStatus) {
    // Simulate asynchronous operation
    await new Promise(resolve => setTimeout(resolve, 100));

    if (this.#status === newStatus) {
      this.#log(`Attempted to transition to current status: '${newStatus}'. No change.`, 'warn');
      return;
    }

    // Basic state transition validation (can be expanded)
    switch (this.#status) {
      case 'INIT':
        if (!['CONFIGURED'].includes(newStatus)) { // INIT -> CONFIGURED is the first step
          throw new Error(`[${this.name}] Invalid state transition: Cannot go from '${this.#status}' to '${newStatus}'. Call 'configure' first.`);
        }
        break;
      case 'CONFIGURED':
        if (!['LOADING', 'ERROR', 'SHUTDOWN'].includes(newStatus)) {
          throw new Error(`[${this.name}] Invalid state transition: Cannot go from '${this.#status}' to '${newStatus}'.`);
        }
        break;
      case 'LOADING':
        if (!['READY', 'ERROR', 'SHUTDOWN'].includes(newStatus)) {
          throw new Error(`[${this.name}] Invalid state transition: Cannot go from '${this.#status}' to '${newStatus}'.`);
        }
        break;
      case 'READY':
        if (!['SHUTDOWN', 'ERROR'].includes(newStatus)) {
          throw new Error(`[${this.name}] Invalid state transition: Cannot go from '${this.#status}' to '${newStatus}'.`);
        }
        break;
      case 'ERROR':
        if (!['LOADING', 'SHUTDOWN'].includes(newStatus)) { // Allow re-attempting load after error
          throw new Error(`[${this.name}] Invalid state transition: Cannot go from '${this.#status}' to '${newStatus}'.`);
        }
        break;
      case 'SHUTDOWN':
        this.#log(`Core is shut down. No further transitions possible.`, 'warn');
        return;
    }

    this.#log(`Status changing from '${this.#status}' to '${newStatus}'.`);
    this.#status = newStatus;
  }

  /**
   * Asynchronously loads core functionalities and transitions the system to a 'READY' state.
   * This method orchestrates the loading of the core itself and all registered components.
   * @returns {Promise<void>} A promise that resolves when loading is complete, or rejects on error.
   */
  async load() {
    if (this.#status !== 'CONFIGURED' && this.#status !== 'ERROR') {
      this.#log(`Cannot load core from current status: '${this.#status}'. Must be 'CONFIGURED' or 'ERROR'.`, 'warn');
      return;
    }
    if (!this.#isConfigured) {
      throw new Error(`[${this.name}] Core must be configured before loading. Call 'configure()' first.`);
    }

    await this.transitionStatus('LOADING');
    try {
      this.#log(`Loading core functionalities...`);
      // Simulate core's own asynchronous setup
      await new Promise(resolve => setTimeout(resolve, this.#options.loadDelayMs));

      // Load registered components
      for (const [name, { component }] of this.#components.entries()) {
        if (typeof component.load === 'function') {
          this.#log(`Loading component: '${name}'...`);
          await component.load();
          this.#log(`Component '${name}' loaded.`);
        }
      }

      this.#log(`Core functionalities successfully loaded.`);
      await this.transitionStatus('READY');
    } catch (error) {
      this.#log(`Critical error during core loading:`, 'error', error);
      await this.transitionStatus('ERROR');
      throw error; // Propagate the error for upstream handling.
    }
  }

  /**
   * Initiates a graceful shutdown of the core system.
   * This method orchestrates the shutdown of the core itself and all registered components.
   * @returns {Promise<void>} A promise that resolves when shutdown is complete.
   */
  async shutdown() {
    if (this.#status === 'SHUTDOWN') {
      this.#log(`Core is already shut down.`, 'warn');
      return;
    }
    if (this.#status === 'INIT') {
      this.#log(`Core was never loaded, skipping full shutdown sequence.`, 'warn');
      this.#log('Core system already shut down.');
      return;
    }

    await this.transitionStatus('SHUTDOWN');
    this.#log(`Initiating core system shutdown...`);
    try {
      // Shutdown registered components in reverse order of registration (optional, but good practice for dependency cleanup)
      const componentEntries = Array.from(this.#components.entries()).reverse();
      for (const [name, { component, metaType, config }] of componentEntries) {
        if (typeof component.shutdown === 'function') {
          this.#log(`Shutting down component: '${name}'...`);
          await component.shutdown(config);
          this.#log(`Component '${name}' shut down.`);
        }
      }

      // Simulate core's own asynchronous cleanup
      await new Promise(resolve => setTimeout(resolve, this.#options.shutdownDelayMs));
      this.#log(`Core system successfully shut down.`);
    } catch (error) {
      this.#log(`Error during core shutdown:`, 'error', error);
      // Even if components fail to shut down, the core still tries to clean up itself.
      // We might transition to ERROR here if shutdown is critical, but SHUTDOWN implies a final state.
      throw error; // Re-throw to indicate a problematic shutdown.
    }
  }
}

// Export a singleton instance of NexusCore.
// For a central 'CORE' component, a singleton pattern is often preferred
// to ensure global consistency and avoid multiple, conflicting instances,
// aligning with how Genkit expects a single configuration.
class GeekanAIComponent {
  load() {
    return Promise.resolve();
  }

  shutdown(data) {
    this._shutdownData = data;
  }
}

class MetaGPTComponent {
  load() {
    return Promise.resolve();
  }

  shutdown() {
    // Simulate MetaGPT shutdown
    return new Promise(resolve => setTimeout(() => resolve(), 500));
  }
}

const geekanAIComponent = new GeekanAIComponent();
const metaGPTComponent = new MetaGPTComponent();

const nexusCoreInstance = new NexusCore();

nexusCoreInstance.configure({ verbose: true, components: [
  {
    name: 'geekanAI',
    component: geekanAIComponent,
    metaType: 'geekanAI'
  },
  {
    name: 'MetaGPT',
    component: metaGPTComponent,
    metaType: 'metaGPT',
  },
]}, 'geekanAI', { data: true });

(async () => {
  await nexusCoreInstance.load();
  await nexusCoreInstance.shutdown();
})();