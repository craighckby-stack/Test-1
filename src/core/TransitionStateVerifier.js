/** 
 * Assumes ShallowObjectDiffUtility is available in scope, providing getDiff(objA, objB).
 */

class TransitionStateVerifier {
    constructor(schema) {
        this.schema = schema;
    }

    verify(state, transition) {
        const { from, to } = transition;
        
        if (!this.schema.states[from] || !this.schema.states[to]) {
            return false;
        }

        const diff = this.getDiff(state, from);
        
        if (diff.length === 0) {
            return true;
        }

        // Fix: 'from' state identifier is now passed, resolving undefined variable error.
        const abstraction = this.getAbstraction(diff, from); 
        
        return this.isAbstractionValid(abstraction, to);
    }

    /**
     * Identifies keys in 'state' that differ from the definition of the 'from' schema state.
     * Utilizes the ShallowObjectDiffUtility plugin.
     */
    getDiff(state, from) {
        const fromSchema = this.schema.states[from];
        
        // Use the plugin if available
        if (typeof ShallowObjectDiffUtility !== 'undefined' && typeof ShallowObjectDiffUtility.getDiff === 'function') {
            return ShallowObjectDiffUtility.getDiff(state, fromSchema);
        }

        // Manual fallback implementation
        const diff = [];
        Object.keys(state).forEach(key => {
            if (state[key] !== fromSchema[key]) {
                diff.push(key);
            }
        });
        return diff;
    }

    /**
     * Derives a partial object (abstraction) containing the expected previous values 
     * (from the 'from' schema definition) for all keys that were found to be different.
     */
    getAbstraction(diff, from) {
        const abstraction = {};
        const fromSchema = this.schema.states[from];

        diff.forEach(key => {
            abstraction[key] = fromSchema[key];
        });
        return abstraction;
    }

    /**
     * Checks if the abstraction values (old values of changed fields) match 
     * the definition of the target state ('to').
     * FIX: Corrected iteration logic to allow early exit (fixing original functional flaw).
     */
    isAbstractionValid(abstraction, to) {
        const toState = this.schema.states[to];
        
        const keys = Object.keys(abstraction);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (abstraction[key] !== toState[key]) {
                return false;
            }
        }
        return true;
    }
}