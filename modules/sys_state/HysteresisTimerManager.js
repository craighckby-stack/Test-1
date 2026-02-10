/**
 * HysteresisTimerManager.js
 * Manages the temporal tracking required for phase transitions based on continuous conditions.
 * Ensures transitions only happen if a condition holds true for a specified duration (hysteresis).
 * Leverages the HysteresisDurationTracker plugin for core timing logic.
 */

class HysteresisTimerManager {
    private tracker: any; // HysteresisDurationTracker instance
    private logger: Console;

    constructor(logger: Console = console) {
        this.logger = logger;

        // --- Dependency Initialization (Simulated Plugin Instance) ---
        // In a real AGI-KERNEL environment, this would be injected or loaded from a central registry.
        const HysteresisDurationTrackerFactory = (function() {
            class HysteresisDurationTracker {
                constructor() { this.timers = new Map(); }
                check(id, requiredDurationMs, now = Date.now()) {
                    if (requiredDurationMs === 0) return true;
                    let timer = this.timers.get(id);
                    if (!timer) {
                        this.timers.set(id, { startTime: now, requiredDuration: requiredDurationMs });
                        return false; 
                    }
                    if (now - timer.startTime >= requiredDurationMs) return true; 
                    return false;
                }
                reset(id) { return this.timers.delete(id); }
                resetAll() {
                    const count = this.timers.size;
                    this.timers.clear();
                    return count;
                }
                hasTimer(id) { return this.timers.has(id); }
                getTimerCount() { return this.timers.size; }
            }
            return new HysteresisDurationTracker();
        })();
        this.tracker = HysteresisDurationTrackerFactory;
        // ------------------------------------------------------------
    }

    /**
     * Checks if a condition has been continuously met for the required duration.
     * If the condition is new, starts the timer. If it's running, checks expiration.
     * 
     * @param {string} id - Unique identifier for the condition/transition.
     * @param {number} requiredDurationMs - The minimum time (in milliseconds) the condition must hold.
     * @returns {boolean} True if the timer has expired (condition met).
     */
    checkAndStartTimer(id: string, requiredDurationMs: number): boolean {
        const timerWasRunning = this.tracker.hasTimer(id);

        // Delegate core logic to the plugin
        const conditionMet = this.tracker.check(id, requiredDurationMs);

        if (requiredDurationMs <= 0) {
            return true; // Immediate transition
        }

        if (!timerWasRunning && !conditionMet) {
            // Timer was just started by the check function
            this.logger.debug(`[Timer: ${id}] Started Hysteresis (Target: ${requiredDurationMs}ms)`);
        }
        
        return conditionMet;
    }

    /**
     * Resets a specific timer, effectively canceling a pending transition.
     * @param {string} id - The ID of the timer to reset.
     */
    resetTimer(id: string): void {
        const wasReset = this.tracker.reset(id);
        if (wasReset) {
            this.logger.debug(`[Timer: ${id}] Condition failed, resetting countdown.`);
        }
    }

    /**
     * Resets all running timers (typically upon a successful phase transition).
     */
    resetAll(): void {
        const count = this.tracker.getTimerCount();
        this.tracker.resetAll();
        
        if (count > 0) {
             this.logger.debug(`[Timer Manager] Resetting ${count} timers due to phase context change.`);
        }
    }
}

module.exports = HysteresisTimerManager;