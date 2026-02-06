/**
 * SMC Transition Enforcer: Validates state changes against the smc_specification.json.
 * This component enforces governance and protocol checks prior to state execution.
 * It strictly adheres to the Principle of Least Transition (PoLT).
 */
class SMCTransitionEnforcer {
    constructor(spec) {
        if (!spec || !spec.protocol_map || !spec.authorization_model) {
            throw new Error("SMC Enforcer requires a valid specification object containing protocol_map and authorization_model.");
        }
        this.protocolMap = spec.protocol_map;
        this.authorization = spec.authorization_model;
    }

    /**
     * Executes a comprehensive validation suite for a potential state transition.
     * @param {object} request - Transition request data.
     * @param {string} request.current - The current operational state.
     * @param {string} [request.target] - The proposed next state (optional, for command-only actions).
     * @param {string} request.command - The command being executed.
     * @param {object} [request.credentials] - Authorization credentials/signatures (must include 'roles').
     * @returns {{valid: boolean, reason: string, code: string}} Validation result, including a machine-readable code.
     */
    validateTransition(request) {
        const { current, target, command, credentials } = request;

        // 1. Basic State Existence Check
        const currentSpec = this.protocolMap[current];
        if (!currentSpec) {
            return this._generateFailure('STATE_UNDEFINED', `Current state '${current}' is undefined in specification.`);
        }

        // 2. Command Allowance Check (Must precede state change evaluation)
        if (!currentSpec.allowed_commands.includes(command)) {
            return this._generateFailure('COMMAND_DISALLOWED', `Command '${command}' not allowed in state ${current}.`);
        }

        // 3. State Transition Validation (only if target state is defined)
        if (target) {
            if (!currentSpec.next_states.includes(target)) {
                return this._generateFailure('TRANSITION_INVALID', `Invalid transition path: ${current} -> ${target}.`);
            }
            
            // 4. Authorization Requirement Check
            const authCheck = this._validateAuthorization(current, target, credentials);
            if (!authCheck.valid) {
                return authCheck; 
            }
        }

        return { valid: true, reason: "Transition validated successfully.", code: "SUCCESS" };
    }

    /**
     * Determines if the specific state transition requires meeting the governance authorization threshold.
     * @param {string} current
     * @param {string} target
     * @returns {boolean}
     */
    _needsThresholdAuthorization(current, target) {
        const transitionIdentifier = `${current} -> ${target}`;
        return !this.authorization.exempt_transitions.includes(transitionIdentifier);
    }

    /**
     * Checks credentials against the required roles and threshold set in the specification.
     * @param {string} current
     * @param {string} target
     * @param {object} credentials
     * @returns {{valid: boolean, reason: string, code: string}}
     */
    _validateAuthorization(current, target, credentials) {
        if (!this._needsThresholdAuthorization(current, target)) {
            return { valid: true, reason: "Transition exempted from threshold checks.", code: "AUTH_EXEMPT" };
        }

        // --- Authorization Stub Logic ---
        const requiredRoles = new Set(this.authorization.required_roles);
        const providedRoles = new Set(credentials?.roles || []);
        
        let authenticatedRequiredRolesCount = 0;
        providedRoles.forEach(role => {
            if (requiredRoles.has(role)) {
                authenticatedRequiredRolesCount++;
            }
        });

        const minimumRequired = this.authorization.minimum_signature_threshold || 1; 

        if (authenticatedRequiredRolesCount < minimumRequired) {
            return this._generateFailure(
                'AUTH_INSUFFICIENT', 
                `Transition requires governance threshold (${minimumRequired} roles), but only ${authenticatedRequiredRolesCount} roles were matched.`
            );
        }
        // NOTE: A mature system would integrate a signature validation module here.
        // --------------------------------

        return { valid: true, reason: "Authorization threshold met.", code: "AUTH_MET" };
    }

    /**
     * Helper to generate standardized failure responses.
     * @param {string} code - Machine readable error code.
     * @param {string} reason - Human readable reason.
     * @returns {{valid: boolean, reason: string, code: string}}
     */
    _generateFailure(code, reason) {
        return { valid: false, reason: `SMC_FAIL (${code}): ${reason}`, code: code };
    }
}

module.exports = SMCTransitionEnforcer;
