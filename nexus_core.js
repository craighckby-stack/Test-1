import { performance } from 'perf_hooks';

const DiagnosticCategory = {
  Warning: 0,
  Error: 1,
  Suggestion: 2,
  Message: 3
};

const DiagnosticMessages = {
  PHASE_ENTER: { code: 1000, category: DiagnosticCategory.Message, message: "Entering phase: {0}" },
  BOOTSTRAP_START: { code: 1001, category: DiagnosticCategory.Message, message: "Bootstrap sequence initiated." },
  CONFIG_VALIDATION_FAILED: { code: 2001, category: DiagnosticCategory.Error, message: "Configuration audit failed: Missing property '{0}'" },
  PIPELINE_CANCELED: { code: 3001, category: DiagnosticCategory.Warning, message: "Pipeline execution preempted." },
  PHASE_TRANSITION_ERROR: { code: 4001, category: DiagnosticCategory.Error, message: "Phase transition error from {0} to {1}: {2}" },
  SYSTEM_READY: { code: 5001, category: DiagnosticCategory.Message, message: "System ready. Version: {0}. Path: {1}" },
  METRIC_SUMMARY: { code: 6001, category: DiagnosticCategory.Suggestion, message: "Phase '{0}' (Step: '{1}') completed in {2}ms." }
};

class CancellationToken {
  #isCancelled = false;
  #listeners = new Set();

  get isCancellationRequested() {
    return this.#isCancelled;
  }

  cancel() {
    if (this.#isCancelled) return;
    this.#isCancelled = true;
    this.#listeners.forEach(fn => {
      try { fn(); } catch (e) { }
    });
    this.#listeners.clear();
  }

  onCancellationRequested(fn) {
    if (this.#isCancelled) {
      fn();
      return () => {};
    }
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

class PerformanceTracker {
  #marks = new Map();
  
  mark(name) {
    this.#marks.set(name, performance.now());
  }

  getDuration(name) {
    const start = this.#marks.get(name);
    return start ? performance.now() - start : 0;
  }
}

class Host {
  #config;
  #perf = new PerformanceTracker();

  constructor(config) {
    this.#config = config;
    this.diagnostics = [];
  }

  getCurrentDirectory() { return process.cwd(); }

  getEnv(name) { return process.env[name] || this.#config[name]; }

  reportDiagnostic(diagnostic, ...args) {
    let formatted = diagnostic.message;
    args.forEach((arg, i) => formatted = formatted.replace(`{${i}}`, String(arg)));

    const entry = {
      timestamp: Date.now(),
      code: diagnostic.code,
      category: diagnostic.category,
      message: formatted
    };
    
    this.diagnostics.push(entry);
    this.#logToConsole(entry);
  }

  #logToConsole(entry) {
    const categoryName = Object.keys(DiagnosticCategory)[entry.category].toUpperCase();
    const logString = `[${entry.code}] [${categoryName}] ${entry.message}`;
    if (entry.category === DiagnosticCategory.Error) console.error(logString);
    else if (entry.category === DiagnosticCategory.Warning) console.warn(logString);
    else console.log(logString);
  }

  getTimer() { return this.#perf; }
}

class NexusProgram {
  #host;
  #token;
  #state = new Map();
  #results = {};

  constructor(host, token) {
    this.#host = host;
    this.#token = token;
  }

  get host() { return this.#host; }
  get token() { return this.#token; }
  get results() { return this.#results; }

  setResult(key, value) { this.#results[key] = value; }
  writeState(key, val) { this.#state.set(key, val); }
  readState(key) { return this.#state.get(key); }
}

const StepDecorator = {
  wrap(name, action) {
    return async (program) => {
      const timer = program.host.getTimer();
      const key = `step-${name}`;
      timer.mark(key);
      try {
        const result = await action(program);
        program.host.reportDiagnostic(
          DiagnosticMessages.METRIC_SUMMARY, 
          "Engine", name, timer.getDuration(key).toFixed(4)
        );
        return result;
      } catch (err) {
        throw err;
      }
    };
  }
};

class PhaseEngine {
  #pipeline = new Map([
    ['SETUP', []],
    ['ANALYZE', []],
    ['TRANSFORM', []],
    ['EMIT', []]
  ]);

  registerStep(phase, name, action) {
    if (!this.#pipeline.has(phase)) throw new Error(`Invalid Phase: ${phase}`);
    this.#pipeline.get(phase).push({
      name,
      action: StepDecorator.wrap(name, action)
    });
    return this;
  }

  async run(program) {
    for (const [phaseName, steps] of this.#pipeline) {
      program.host.reportDiagnostic(DiagnosticMessages.PHASE_ENTER, phaseName);
      for (const step of steps) {
        program.token.throwIfCancelled();
        try {
          const result = await step.action(program);
          program.setResult(step.name, result || true);
        } catch (error) {
          if (error.isCancellation) throw error;
          program.host.reportDiagnostic(
            DiagnosticMessages.PHASE_TRANSITION_ERROR, 
            phaseName, step.name, error.message
          );
          throw error;
        }
      }
    }
    return program.results;
  }
}

class NexusCore {
  #host;
  #engine;
  #token;
  #status = 'IDLE';

  constructor(config = {}) {
    this.#host = new Host(config);
    this.#engine = new PhaseEngine();
    this.#token = new CancellationToken();
    this.#initializePipeline();
  }

  #initializePipeline() {
    this.#engine
      .registerStep('SETUP', 'AUDIT_CONFIG', (prog) => {
        const version = prog.host.getEnv('version');
        if (!version) throw new Error("version");
        prog.host.reportDiagnostic(DiagnosticMessages.BOOTSTRAP_START);
      })
      .registerStep('SETUP', 'RESOLVE_ENVIRONMENT', (prog) => {
        prog.writeState('cwd', prog.host.getCurrentDirectory());
      })
      .registerStep('EMIT', 'FINAL_SIGNAL', (prog) => {
        this.#status = 'READY';
        prog.host.reportDiagnostic(
          DiagnosticMessages.SYSTEM_READY, 
          prog.host.getEnv('version'),
          prog.readState('cwd')
        );
      });
  }

  async start() {
    if (this.#status !== 'IDLE') return;
    this.#status = 'RUNNING';
    const program = new NexusProgram(this.#host, this.#token);
    try {
      const output = await this.#engine.run(program);
      this.#status = 'SUCCESS';
      return output;
    } catch (err) {
      this.#status = err.isCancellation ? 'CANCELLED' : 'FAULT';
      throw err;
    }
  }

  abort() { this.#token.cancel(); }

  get snapshot() {
    return {
      status: this.#status,
      diagnostics: this.#host.diagnostics.length,
      cancelled: this.#token.isCancellationRequested
    };
  }
}

export default NexusCore;