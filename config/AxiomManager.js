class AxiomManager {
    /**
     * Initializes the manager with a set of base axioms.
     * Axiom structure is assumed to be { id: number, value: number }
     */
    constructor(rawAxioms) {
        // Ensure axioms is an array, providing basic data integrity.
        this.axioms = Array.isArray(rawAxioms) ? rawAxioms : [];
        
        this.lastResult = null;
        // Performance improvement: Track if calculation has been completed successfully.
        this.processed = false;
    }

    /**
     * Executes the abstracted and optimized computational process 
     * by delegating the complex, recursive calculation to the specialized kernel invoker.
     * Implements memoization to prevent redundant, expensive computations.
     * 
     * (Requires AxiomKernelInvoker to be available in scope)
     * @param {boolean} forceRecalculation Skips the memoization check if true.
     * @returns {object} The optimized and abstracted result set, or a cached result wrapper.
     */
    processRecursively(forceRecalculation = false) {
        if (this.processed && !forceRecalculation) {
            console.log(`[AxiomManager]: Returning cached result.`);
            // Return a wrapper indicating cache usage, protecting the original result object.
            return { 
                cached: true, 
                optimizedResults: this.lastResult 
            };
        }

        // Defensive check for external dependency
        if (typeof AxiomKernelInvoker?.calculate !== 'function') {
             throw new Error("AxiomKernelInvoker is required and must expose a 'calculate' method.");
        }

        const result = AxiomKernelInvoker.calculate(this.axioms);

        console.log(`[AxiomManager]: Abstraction complete. Level: ${result.abstractionLevel}`);
        this.lastResult = result.optimizedResults;
        this.processed = true;
        return result;
    }

    getLastResult() {
        return this.lastResult;
    }

    /**
     * Resets the internal state, forcing a recalculation on the next call to processRecursively.
     */
    resetState() {
        this.processed = false;
        this.lastResult = null;
    }
}