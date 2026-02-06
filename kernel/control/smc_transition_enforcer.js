/**
 * Sovereign AGI v94.1 | SMC Transition Enforcer
 * Validates state changes against the smc_specification.json.
 * This component enforces governance and protocol checks prior to state execution,
 * adhering strictly to the Principle of Least Transition (PoLT).
 */
class SMCTransitionEnforcer {

    /**
     * Standardized machine-readable status codes.
     */
    static StatusCodes = {
        SUCCESS: 'SUCCESS',
        STATE_UNDEFINED: 'STATE_UNDEFINED',
        COMMAND_DISALLOWED: 'COMMAND_DISALLOWED',
        TRANSITION_INVALID: 'TRANSITION_INVALID',
        AUTH_EXEMPT: 'AUTH_EXEMPT',
        AUTH_INSUFFICIENT: 'AUTH_INSUFFICIENT',
        AUTH_MET: 'AUTH_MET',
        AUTH_ERROR: 'AUTH_ERROR' // For structural credential issues
    };

    /**
     * Initializes the enforcer, pre-processing the specification into efficient Set structures.
     * @param {object} spec - The State Machine Contract specification.
     */
    constructor(spec) {
        if (!spec || !spec.protocol_map || !spec.authorization_model) {
            throw new Error("SMC Enforcer requires a valid specification object containing protocol_map and authorization_model.");
        }
        // Pre-process maps for O(1) lookups
        this.protocolMap = this._processProtocolMap(spec.protocol_map);
        this.authorization = this._processAuthorizationModel(spec.authorization_model);
    }

    /**
     * Converts raw map entries (arrays) into Sets for efficient validation.
     * @param {object} rawMap
     * @returns {object}
     */
    _processProtocolMap(rawMap) {
        const processedMap = {};
        for (const state in rawMap) {
            processedMap[state] = {
                allowed_commands: new Set(rawMap[state].allowed_commands || []),
                next_states: new Set(rawMap[state].next_states || [])
            };
        }
        return processedMap;
    }

    /**
     * Converts authorization arrays into Sets.
     * @param {object} authModel
     * @returns {object}
     */
    _processAuthorizationModel(authModel) {
        return {
            ...authModel,
            required_roles: new Set(authModel.required_roles || []),
            exempt_transitions: new Set(authModel.exempt_transitions || [])
        };
    }

    /**
     * Executes a comprehensive validation suite for a potential state transition/command execution.
     * @param {object} request - Transition request data.
     * @param {string} request.current - The current operational state.
     * @param {string} [request.target] - The proposed next state.
     * @param {string} request.command - The command being executed.
     * @param {object} [request.credentials] - Authorization credentials/signatures (must include 'roles').
     * @returns {{valid: boolean, reason: string, code: string}} Validation result.
     */
    validateTransition(request) {
        const { current, target, command, credentials } = request;
        const { StatusCodes } = SMCTransitionEnforcer;

        // 1. State Existence Check
        const currentSpec = this.protocolMap[current];
        if (!currentSpec) {
            return this._generateFailure(StatusCodes.STATE_UNDEFINED, `Current state '${current}' is undefined in specification.`);
        }

        // 2. Command Allowance Check (O(1))
        if (!currentSpec.allowed_commands.has(command)) {
            return this._generateFailure(StatusCodes.COMMAND_DISALLOWED, `Command '${command}' not allowed in state ${current}.`);
        }

        // 3. State Transition Validation (Only required if target state is defined)
        if (target) {
            if (!currentSpec.next_states.has(target)) { // O(1) lookup
                return this._generateFailure(StatusCodes.TRANSITION_INVALID, `Invalid transition path: ${current} -> ${target}.`);
            }
            
            // 4. Authorization Requirement Check (Only for state transitions)
            const authCheck = this._validateAuthorization(current, target, credentials);
            if (!authCheck.valid) {
                return authCheck; 
            }
        }

        return this._generateSuccess(StatusCodes.SUCCESS, "Transition validated successfully.");
    }

    /**
     * Determines if the specific state transition is exempted from the governance authorization threshold.
     * @param {string} current
     * @param {string} target
     * @returns {boolean}
     */
    _needsThresholdAuthorization(current, target) {
        const transitionIdentifier = `${current} -> ${target}`;
        return !this.authorization.exempt_transitions.has(transitionIdentifier); // O(1) lookup
    }

    /**
     * Checks credentials against the required roles and threshold set in the specification.
     * NOTE: This currently implements role counting. Future systems should use a SignatureValidationService.
     * @param {string} current
     * @param {string} target
     * @param {object} credentials
     * @returns {{valid: boolean, reason: string, code: string}}
     */
    _validateAuthorization(current, target, credentials) {
        const { StatusCodes } = SMCTransitionEnforcer;

        if (!this._needsThresholdAuthorization(current, target)) {
            return this._generateSuccess(StatusCodes.AUTH_EXEMPT, "Transition exempted from threshold checks.");
        }

        if (!credentials || !Array.isArray(credentials.roles)) {
             return this._generateFailure(StatusCodes.AUTH_ERROR, "Credentials structure missing required 'roles' array for threshold transition.");
        }

        const requiredRoles = this.authorization.required_roles;
        const providedRoles = credentials.roles;
        
        let authenticatedRequiredRolesCount = 0;
        
        for (const role of providedRoles) {
            if (requiredRoles.has(role)) {
                authenticatedRequiredRolesCount++;
            }
        }

        const minimumRequired = this.authorization.minimum_signature_threshold || 1; 

        if (authenticatedRequiredRolesCount < minimumRequired) {
            return this._generateFailure(
                StatusCodes.AUTH_INSUFFICIENT, 
                `Transition requires governance threshold (${minimumRequired} roles), but only ${authenticatedRequiredRolesCount} roles were matched.`
            );
        }

        // In a real system, cryptographically verify signatures here.

        return this._generateSuccess(StatusCodes.AUTH_MET, "Authorization threshold met.");
    }

    /**
     * Helper to generate standardized success responses.
     * @param {string} code
     * @param {string} reason
     * @returns {{valid: boolean, reason: string, code: string}}
     */
    _generateSuccess(code, reason) {
        return { valid: true, reason: reason, code: code };
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
