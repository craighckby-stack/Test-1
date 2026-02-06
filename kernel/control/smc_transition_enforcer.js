/**
 * SMC Transition Enforcer: Validates state changes against the smc_specification.json.
 * This component enforces governance protocols prior to state execution.
 */
class SMCTransitionEnforcer {
    constructor(spec) {
        this.spec = spec;
        this.protocolMap = spec.protocol_map;
        this.authorization = spec.authorization_model;
    }

    /**
     * Checks if the transition request is valid based on the current state, target state,
     * command invoked, and required authorization credentials.
     */
    validateTransition(currentState, targetState, command, credentials) {
        const currentSpec = this.protocolMap[currentState];

        if (!currentSpec) {
            return { valid: false, reason: `SMC_ERR: Current state '${currentState}' is undefined in specification.` };
        }

        // 1. Check if the target state is allowed (if transitioning)
        if (targetState && !currentSpec.next_states.includes(targetState)) {
            return { valid: false, reason: `Invalid transition from ${currentState} to ${targetState}.` };
        }

        // 2. Check if the command is allowed
        if (!currentSpec.allowed_commands.includes(command)) {
            return { valid: false, reason: `Command '${command}' not allowed in state ${currentState}.` };
        }

        // 3. Check Authorization Requirements
        if (targetState && this.needsThresholdAuthorization(currentState, targetState)) {
             if (!this.checkAuthorizationThreshold(credentials)) {
                 return { valid: false, reason: "Transition requires governance threshold authorization." };
             }
        }

        // Further checks (e.g., resource availability, module dependencies) would be integrated here.

        return { valid: true, reason: "Transition validated successfully." };
    }

    needsThresholdAuthorization(currentState, targetState) {
        const transition = `${currentState} -> ${targetState}`;
        return !this.authorization.exempt_transitions.includes(transition);
    }

    checkAuthorizationThreshold(credentials) {
        // Placeholder: Actual implementation would verify signatures against the threshold and required_roles.
        const requiredRoles = new Set(this.authorization.required_roles);
        const credentialRoles = new Set(credentials?.roles || []);
        
        let roleOverlap = 0;
        credentialRoles.forEach(role => {
            if (requiredRoles.has(role)) {
                roleOverlap++;
            }
        });
        // For simplicity, requiring at least one required role is sufficient for this stub.
        return roleOverlap > 0; 
    }
}

module.exports = SMCTransitionEnforcer;