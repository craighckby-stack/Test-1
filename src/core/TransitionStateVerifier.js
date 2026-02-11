/** 
 * Requires a ShallowObjectDiffUtility instance provided during construction.
 */
class TransitionStateVerifier {
    constructor(schema, diffUtility) {
        this.schema = schema;
        this.diffUtility = diffUtility; // Dependency Injection
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

        const abstraction = this.getAbstraction(diff, from); 
        
        return this.isAbstractionValid(abstraction, to);
    }

    /**
     * Identifies keys in 'state' that differ from the definition of the 'from' schema state,
     * utilizing the injected diff utility.
     */
    getDiff(state, from) {
        const fromSchema = this.schema.states[from];
        // Uses the injected utility
        return this.diffUtility.getDiff(state, fromSchema);
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