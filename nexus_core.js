import { performance } from 'perf_hooks';

const WorkPriority = {
  Immediate: 1,
  UserBlocking: 2,
  Normal: 4,
  Low: 8,
  Idle: 16
};

const DiagnosticCategory = {
  Warning: 0,
  Error: 1,
  Suggestion: 2,
  Message: 3,
  Telemetry: 4
};

const DiagnosticMessages = {
  PHASE_ENTER: { code: 1000, category: DiagnosticCategory.Message, message: "Entering phase: {0}" },
  BOOTSTRAP_START: { code: 1001, category: DiagnosticCategory.Message, message: "Bootstrap sequence initiated." },
  CONFIG_VALIDATION_FAILED: { code: 2001, category: DiagnosticCategory.Error, message: "Configuration audit failed: Missing property '{0}'" },
  PIPELINE_CANCELED: { code: 3001, category: DiagnosticCategory.Warning, message: "Pipeline execution preempted via CancellationToken." },
  PHASE_TRANSITION_ERROR: { code: 4001, category: DiagnosticCategory.Error, message: "Phase transition error from {0} to {1}: {2}" },
  SYSTEM_READY: { code: 5001, category: DiagnosticCategory.Message, message: "System ready. Version: {0}. Path: {1}" },
  METRIC_SUMMARY: { code: 6001, category: DiagnosticCategory.Suggestion, message: "Unit '{0}' processed in {1}ms." },
  SCHEDULER_YIELD: { code: 7001, category: DiagnosticCategory.Telemetry, message: "Scheduler yielding control. Execution time: {0}ms" },
  WORK_COMMIT: { code: 8001, category: DiagnosticCategory.Message, message: "Work root committed. Total units: {0}" }
};

class NexusScheduler {
  #taskQueue = [];
  #isHostCallbackScheduled = false;
  #isPerformingWork = false;
  #yieldInterval = 5;
  #deadline = 0;

  constructor(host) {
    this.host = host;
  }

  scheduleCallback(priority, callback) {
    const currentTime = performance.now();
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      callback,
      priority,
      startTime: currentTime,
      expirationTime: currentTime + (priority === WorkPriority.Immediate ? -1 : priority * 100)
    };

    this.#taskQueue.push(newTask);
    this.#taskQueue.sort((a, b) => a.expirationTime - b.expirationTime);

    if (!this.#isHostCallbackScheduled && !this.#isPerformingWork) {
      this.#isHostCallbackScheduled = true;
      setImmediate(() => this.#workLoop());
    }

    return newTask;
  }

  #shouldYield() {
    return performance.now() >= this.#deadline;
  }

  #workLoop() {
    this.#isPerformingWork = true;
    this.#isHostCallbackScheduled = false;
    this.#deadline = performance.now() + this.#yieldInterval;

    try {
      while (this.#taskQueue.length > 0 && !this.#shouldYield()) {
        const currentTask = this.#taskQueue.shift();
        const continuation = currentTask.callback(this.#shouldYield.bind(this));

        if (typeof continuation === 'function') {
          currentTask.callback = continuation;
          this.#taskQueue.unshift(currentTask);
        }
      }

      if (this.#taskQueue.length > 0) {
        this.#isHostCallbackScheduled = true;
        setImmediate(() => this.#workLoop());
      }
    } finally {
      this.#isPerformingWork = false;
    }
  }
}

class NexusFiber {
  constructor(name, action, priority) {
    this.name = name;
    this.action = action;
    this.priority = priority;
    this.stateNode = null;
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.memoizedState = new Map();
  }
}

class TelemetryRegistry {
  #subscribers = new Set();

  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};
    this.#subscribers.add(callback);
    return () => this.#subscribers.delete(callback);
  }

  notify(event, data) {
    for (const sub of this.#subscribers) {
      try { sub(event, data); } catch (e) {}
    }
  }
}

class CancellationToken {
  #isCancelled = false;
  #listeners = new Set();

  get isCancellationRequested() { return this.#isCancelled; }

  cancel() {
    if (this.#isCancelled) return;
    this.#isCancelled = true;
    this.#listeners.forEach(fn => { try { fn(); } catch (e) {} });
    this.#listeners.clear();
  }

  onCancellationRequested(fn) {
    if (this.#isCancelled) { fn(); return () => {}; }
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  throwIfCancelled() {
    if (this.#isCancelled) {
      const error = new Error(DiagnosticMessages.PIPELINE_CANCELED.message);
      error.code = DiagnosticMessages.PIPELINE_CANCELED.code;
      error.isCancellation = true;
      throw error;
    }
  }
}

class Host {
  #config;
  #perf = new Map();
  #telemetry = new TelemetryRegistry();
  #scheduler;

  constructor(config) {
    this.#config = config;
    this.diagnostics = [];
    this.#scheduler = new NexusScheduler(this);
  }

  get scheduler() { return this.#scheduler; }
  get telemetry() { return this.#telemetry; }
  
  mark(name) { this.#perf.set(name, performance.now()); }
  getDuration(name) { 
    const start = this.#perf.get(name);
    return start ? performance.now() - start : 0; 
  }

  reportDiagnostic(diagnostic, ...args) {
    let formatted = diagnostic.message;
    args.forEach((arg, i) => formatted = formatted.replace(`{${i}}`, String(arg)));

    const entry = {
      timestamp: Date.now(),
      code: diagnostic.code,
      category: diagnostic.category,
      message: formatted,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    this.diagnostics.push(entry);
    this.#logToConsole(entry);
    this.#telemetry.notify('DIAGNOSTIC_REPORTED', entry);
  }

  #logToConsole(entry) {
    const categories = Object.keys(DiagnosticCategory);
    const categoryName = categories[entry.category].toUpperCase();
    const logString = `[${entry.id}] [${entry.code}] [${categoryName}] ${entry.message}`;
    if (entry.category === DiagnosticCategory.Error) console.error(logString);
    else if (entry.category === DiagnosticCategory.Warning) console.warn(logString);
    else console.log(logString);
  }
}

class NexusProgram {
  #host;
  #token;
  #results = {};
  #currentFiber = null;

  constructor(host, token) {
    this.#host = host;
    this.#token = token;
  }

  get host() { return this.#host; }
  get token() { return this.#token; }
  get results() { return this.#results; }
  set currentFiber(f) { this.#currentFiber = f; }
  
  setResult(key, value) { this.#results[key] = value; }
  
  usePersistence(key, initialValue) {
    if (!this.#currentFiber.memoizedState.has(key)) {
      this.#currentFiber.memoizedState.set(key, initialValue);
    }
    return [
      this.#currentFiber.memoizedState.get(key),
      (nextVal) => this.#currentFiber.memoizedState.set(key, nextVal)
    ];
  }
}

class NexusRuntime {
  #root = null;
  #workInProgress = null;
  #fiberCount = 0;

  constructor(host) {
    this.host = host;
  }

  createWork(phaseName, steps) {
    const phaseRoot = new NexusFiber(phaseName, null, WorkPriority.Normal);
    let prevFiber = null;

    steps.forEach((step, index) => {
      const fiber = new NexusFiber(step.name, step.action, step.priority || WorkPriority.Normal);
      fiber.return = phaseRoot;
      if (index === 0) {
        phaseRoot.child = fiber;
      } else {
        prevFiber.sibling = fiber;
      }
      prevFiber = fiber;
      this.#fiberCount++;
    });

    this.#root = phaseRoot;
    return this;
  }

  async execute(program) {
    this.#workInProgress = this.#root;
    
    return new Promise((resolve, reject) => {
      const performWork = (didYield) => {
        try {
          while (this.#workInProgress !== null && !didYield) {
            program.token.throwIfCancelled();
            this.#workInProgress = this.#performUnitOfWork(this.#workInProgress, program);
          }

          if (this.#workInProgress === null) {
            this.host.reportDiagnostic(DiagnosticMessages.WORK_COMMIT, this.#fiberCount);
            resolve(program.results);
            return null;
          }

          return performWork;
        } catch (e) {
          reject(e);
        }
      };

      this.host.scheduler.scheduleCallback(WorkPriority.Normal, performWork);
    });
  }

  #performUnitOfWork(fiber, program) {
    program.currentFiber = fiber;
    
    if (fiber.action) {
      const start = performance.now();
      try {
        const result = fiber.action(program);
        program.setResult(fiber.name, result);
        const duration = performance.now() - start;
        this.host.reportDiagnostic(DiagnosticMessages.METRIC_SUMMARY, fiber.name, duration.toFixed(4));
      } catch (err) {
        this.host.reportDiagnostic(DiagnosticMessages.PHASE_TRANSITION_ERROR, "Runtime", fiber.name, err.message);
        throw err;
      }
    }

    if (fiber.child) return fiber.child;
    
    let nextFiber = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) return nextFiber.sibling;
      nextFiber = nextFiber.return;
    }
    return null;
  }
}