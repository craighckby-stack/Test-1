**MUTATED CODE:**

class LaneManagerFactory {
  static getFlags() {
    return [
      0b0000000000000000000000000000000,
      0b0000000000000000000000000000001,
      0b0000000000000000000000000000010,
      0b0000000000000000000000000000100,
      0b0000000011111111111111111111000,
      0b0100000000000000000000000000000,
    ];
  }

  static getHighestPriorityLane(lanes) {
    const flags = this.getFlags();
    let index = 0;
    for (let i = 0; i < 6; i++) {
      if ((flags[i] & lanes) !== 0) {
        index = i;
      }
    }
    return index >>> 0;
  }
}

class Emitter {
  #observers = new Map();

  addObserver(observer, callback) {
    this.#observers.set(observer, callback);
  }

  removeObserver(observer) {
    this.#observers.delete(observer);
  }
}

class DiagnosticEmitter extends Subject {
  #prefix;

  async emit(category, diagnostic, ...args) {
    let formatted = diagnostic.message;
    args.forEach((arg, i) => formatted = formatted.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg)));

    const payload = {
      timestamp: performance.now(),
      code: diagnostic.code,
      category: category,
      message: formatted,
      id: Math.random().toString(36).substr(2, 9),
      args: args.reduce((acc, val, i) => ({ ...acc, [`arg${i}`]: val }), {}),
    };
    await this.notifyListeners(category, payload);
  }

  constructor(prefix = '') {
    super();
    this.#prefix = prefix;
  }
}

class Subject {
  #listeners = new Map();

  addListener(category, fn) {
    if (!this.#listeners.has(category)) {
      this.#listeners.set(category, new Set());
    }
    this.#listeners.get(category).add(fn);
  }

  removeListener(category, fn) {
    if (this.#listeners.has(category)) {
      this.#listeners.get(category).delete(fn);
    }
  }

  notifyListeners(category, payload) {
    if (this.#listeners.has(category)) {
      this.#listeners.get(category).forEach(listener => {
        try {
          listener(payload);
        } catch (e) {}
      });
    }
  }
}

class Worker {
  #diagnosticEmitter;
  #laneManagerFactory;
  #taskQueue;
  #retryQueue;
  #isPerformingWork;
  #isHostCallbackScheduled;
  #config = {
    maxRetries: 3,
  };

  constructor(config = {}) {
    this.#config = { ...this.#config, ...config };
    this.#taskQueue = [];
    this.#retryQueue = [];
    this.#isPerformingWork = false;
    this.#isHostCallbackScheduled = false;
    this.#diagnosticEmitter = new DiagnosticEmitter();
    this.#laneManagerFactory = new LaneManagerFactory();
  }

  async scheduleTask(task) {
    await this.#taskQueue.push(task);

    if (!this.#isHostCallbackScheduled && !this.#isPerformingWork) {
      this.#isHostCallbackScheduled = true;
      this.#requestHostCallback();
    }
  }

  async #requestHostCallback() {
    if (this.#retryQueue.length > 0) {
      this.#taskQueue.push(this.#retryQueue.shift());
    }
    setTimeout(() => this.#workLoop(), 0);
  }

  async #workLoop() {
    this.#isPerformingWork = true;
    this.#isHostCallbackScheduled = false;

    while (this.#taskQueue.length > 0 || this.#retryQueue.length > 0) {
      let task;
      if (this.#retryQueue.length > 0) {
        task = this.#retryQueue.shift();
      } else {
        task = this.#taskQueue.shift();
      }

      if (task) {
        const didUserCallbackTimeout = task.expirationTime <= performance.now();
        const continuation = task.callback(didUserCallbackTimeout);

        if (typeof continuation === 'function') {
          task.callback = continuation;
        } else if (task.retryCount < this.#config.maxRetries) {
          this.#retryQueue.push(task);
          this.#retryQueue[0].retryCount++;
          this.#requestHostCallback();
        } else {
          const diagnostics = [
            { code: 0, message: 'Maximum retries reached' },
          ];
          diagnostics.forEach((diagnostic) => this.#diagnosticEmitter.emit('retryFailed', diagnostic));
        }
      }
    }

    if (this.#taskQueue.length > 0 && !this.#isHostCallbackScheduled) {
      this.#isHostCallbackScheduled = true;
      this.#requestHostCallback();
    }
  }
}

class LaneObserver {
  #lane;
  #name;

  constructor(lane, name) {
    this.#lane = lane;
    this.#name = name;
  }

  async notify(payload) {
    console.log(`LaneObserver: ${this.#name} - Lane: ${this.#lane}, Payload: ${JSON.stringify(payload)}`);
  }
}