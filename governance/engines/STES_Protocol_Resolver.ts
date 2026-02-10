import { STESSpecification } from '../protocols/STES_specification.json';
import { ResolverHooks } from './ResolverHooks';

// Assuming SpecificationStateTransitionResolver is available in the execution environment.
// We use a mock interface declaration for type checking purposes.
declare const SpecificationStateTransitionResolver: {
    execute(args: {
        spec: any;
        hooks: any;
        currentState: string;
        trigger: string;
        payload: any;
    }): string;
};

/**
 * STES_Protocol_Resolver
 * Reads the STES specification and enforces governance protocols at runtime.
 */
export class STES_Protocol_Resolver {
    private spec: typeof STESSpecification;

    constructor(spec: typeof STESSpecification) {
        this.spec = spec;
    }

    /** Verifies incoming request compliance based on protocol constraints. */
    public validateRequest(request: any): boolean {
        const constraints = this.spec.constraints.runtime_validation;
        // Check required keys and trust score
        for (const key of constraints.required_keys) {
            if (!request[key]) {
                throw new Error(`Missing mandatory key: ${key}`);
            }
        }
        if (request.trustScore < constraints.minimum_trust_score) {
            throw new Error(`Trust score (${request.trustScore}) below minimum threshold (${constraints.minimum_trust_score}).`);
        }
        return true;
    }

    /** Determines and executes the state transition based on the current state and trigger. */
    public executeTransition(currentState: string, trigger: string, payload: any): string {
        // Delegate complex transition lookup and hook execution to the specialized tool
        
        if (typeof SpecificationStateTransitionResolver === 'undefined') {
            throw new Error("SpecificationStateTransitionResolver tool not available.");
        }

        return SpecificationStateTransitionResolver.execute({
            spec: this.spec,
            hooks: ResolverHooks,
            currentState: currentState,
            trigger: trigger,
            payload: payload
        });
    }
}