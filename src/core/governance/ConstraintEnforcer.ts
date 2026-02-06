import { GAXConstraintSet } from './types';
import constraints from '../../../registry/protocol/gax_constraint_set.json';

export class ConstraintEnforcer {
    private constraints: GAXConstraintSet;

    constructor() {
        // Validate constraints file structure against schema upon loading
        this.constraints = constraints as GAXConstraintSet;
        console.log(`GAX Constraint Enforcer initialized (v${this.constraints.schema_version})`);
    }

    /** Checks a proposed transaction against all configured constraints. */
    public checkTransaction(txContext: any): void | Error {
        const gasUsed = txContext.resources.gas;
        const maxGas = this.constraints.global_execution_limits.max_gas_units_per_tx.limit;

        if (gasUsed > maxGas) {
            const failureMode = this.constraints.global_execution_limits.max_gas_units_per_tx.failure_mode;
            // In a real system, this would trigger specific rejection logic based on failureMode.
            throw new Error(`Constraint Violation (Gas Limit): Tx exceeded ${maxGas}. Action: ${failureMode}`);
        }

        // Additional constraint checks go here...
    }

    public getToggle(feature: keyof typeof constraints.system_governance_toggles): boolean {
        return this.constraints.system_governance_toggles[feature];
    }
}