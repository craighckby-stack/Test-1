/**
 * HysteresisTimerManager.js
 * Manages the temporal tracking required for phase transitions based on continuous conditions.
 * Ensures transitions only happen if a condition holds true for a specified duration (hysteresis).
 * Depends on the HysteresisDurationTracker for core timing logic.
 */

class HysteresisTimerManager {
    /** @type {any} */
    private tracker; 
    private logger; 

    /**
     * @param {any} tracker - Instance of the core duration tracker (HysteresisDurationTracker).
     * @param {Console} [logger=console]
     */
    constructor(tracker, logger = console) {
        if (!tracker || typeof tracker.check !== 'function') {
            // Runtime check ensures the dependency contract is met
            throw new Error("HysteresisTimerManager requires a valid HysteresisDurationTracker instance with a 'check' method.");
        }
        this.logger = logger;
        this.tracker = tracker;
    }

    /**
     * Checks if a condition has been continuously met for the required duration.
     * If the condition is new, starts the timer. If it's running, checks expiration.
     * 
     * @param {string} id - Unique identifier for the condition/transition.
     * @param {number} requiredDurationMs - The minimum time (in milliseconds) the condition must hold.
     * @returns {boolean} True if the timer has expired (condition met).
     */
    checkAndStartTimer(id, requiredDurationMs) {
        if (requiredDurationMs <= 0) {
            return true; // Immediate transition
        }
        
        const timerWasRunning = this.tracker.hasTimer(id);

        // Delegate core logic to the plugin
        const conditionMet = this.tracker.check(id, requiredDurationMs);

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
    resetTimer(id) {
        const wasReset = this.tracker.reset(id);
        if (wasReset) {
            this.logger.debug(`[Timer: ${id}] Condition failed, resetting countdown.`);
        }
    }

    /**
     * Resets all running timers (typically upon a successful phase transition).
     */
    resetAll() {
        const count = this.tracker.getTimerCount();
        this.tracker.resetAll();
        
        if (count > 0) {
             this.logger.debug(`[Timer Manager] Resetting ${count} timers due to phase context change.`);
        }
    }
}

module.exports = HysteresisTimerManager;