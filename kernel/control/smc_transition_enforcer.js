/**
 * Sovereign AGI v94.1 | SMC Transition Enforcer
 * Enforces state changes and command execution against the defined State Machine Contract (SMC).
 * Adheres strictly to the Principle of Least Transition (PoLT) and Governance Thresholds.
 */

// Assuming RoleThresholdScorer plugin is globally available after initialization
declare const RoleThresholdScorer: {
    execute: (args: {
        requiredRolesSet: Set<string>;
        providedRoles: string[];
        requiredThreshold: number;
    }) => {
        score: number;
        required: number;
        met: boolean;
        error?: string;
    };
};

class SMCTransitionEnforcer {

    private _protocolSpecs: Record<string, { allowed_commands: Set<string>, next_states: Set<string> }>;
    private _authSpecs: { required_roles: Set<string>, exempt_transitions: Set<string>, required_threshold: number };

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
        AUTH_ERROR: 'AUTH_ERROR'
    };

    /**
     * Initializes the enforcer, pre-processing the specification into efficient Set structures (O(1) lookups).
     * @param {object} spec - The State Machine Contract specification (must contain protocol_map and authorization_model).
     */
    constructor(spec: any) {
        if (!spec || !spec.protocol_map || !spec.authorization_model) {
            throw new Error("SMC Enforcer requires a valid specification object containing protocol_map and authorization_model.");
        }
        
        this._protocolSpecs = this._processProtocolMap(spec.protocol_map);
        this._authSpecs = this._processAuthorizationModel(spec.authorization_model);
    }

    /**
     * Converts raw map entries (arrays) into Sets for efficient O(1) validation.
     * @param {object} rawMap
     * @returns {object}
     */
    private _processProtocolMap(rawMap: any): Record<string, { allowed_commands: Set<string>, next_states: Set<string> }> {
        const processedMap: Record<string, { allowed_commands: Set<string>, next_states: Set<string> }> = {};
        for (const state in rawMap) {
            processedMap[state] = {
                allowed_commands: new Set(rawMap[state].allowed_commands || []),
                next_states: new Set(rawMap[state].next_states || [])
            };
        }
        return processedMap;
    }

    /**
     * Converts authorization arrays into Sets and extracts the minimum threshold.
     * @param {object} authModel
     * @returns {object}
     */
    private _processAuthorizationModel(authModel: any): {
        required_roles: Set<string>;
        exempt_transitions: Set<string>;
        required_threshold: number;
    } {
        return {
            required_roles: new Set(authModel.required_roles || []),
            exempt_transitions: new Set(authModel.exempt_transitions || []),
            required_threshold: authModel.minimum_signature_threshold || 1
        };
    }

    /**
     * Executes a comprehensive validation suite for a potential state transition/command execution.
     * 
     * If 'target' is absent, only Command allowance is checked (in-state execution).
     * If 'target' is present, transition validity and authorization threshold are checked.
     * 
     * @param {object} request - Transition request data.
     * @param {string} request.current - The current operational state.
     * @param {string} [request.target] - The proposed next state (optional).
     * @param {string} request.command - The command being executed.
     * @param {object} [request.credentials] - Authorization credentials/signatures (must include 'roles' array).
     * @returns {{valid: boolean, reason: string, code: string}} Validation result.
     */
    validateTransition(request: { current: string, target?: string, command: string, credentials?: any }): { valid: boolean, reason: string, code: string } {
        const { current, target, command, credentials } = request;
        const { StatusCodes } = SMCTransitionEnforcer;

        // 1. State Existence Check
        const currentSpec = this._protocolSpecs[current];
        if (!currentSpec) {
            return this._fail(StatusCodes.STATE_UNDEFINED, `Current state '${current}' is undefined in specification.`);
        }

        // 2. Command Allowance Check (O(1))
        if (!currentSpec.allowed_commands.has(command)) {
            return this._fail(StatusCodes.COMMAND_DISALLOWED, `Command '${command}' not allowed in state ${current}.`);
        }

        // If no target is provided, we only validate command execution and stop.
        if (!target) {
            return this._success(StatusCodes.SUCCESS, "Command execution validated (no state transition requested).");
        }
        
        // 3. State Transition Validity Check (PoLT Enforcement)
        if (!currentSpec.next_states.has(target)) { // O(1) lookup
            return this._fail(StatusCodes.TRANSITION_INVALID, `Invalid transition path requested: ${current} -> ${target}.`);
        }
        
        // 4. Authorization Requirement Check
        const authCheck = this._validateAuthorization(current, target, credentials);
        if (!authCheck.valid) {
            return authCheck; 
        }

        return this._success(StatusCodes.SUCCESS, "Transition and command execution validated successfully.");
    }

    /**
     * Checks credentials against the required roles and governance threshold set in the specification.
     * This method now delegates the threshold counting logic to the RoleThresholdScorer plugin.
     * @param {string} current
     * @param {string} target
     * @param {object} credentials
     * @returns {{valid: boolean, reason: string, code: string}} Result of authorization check.
     */
    private _validateAuthorization(current: string, target: string, credentials: any): { valid: boolean, reason: string, code: string } {
        const { StatusCodes } = SMCTransitionEnforcer;
        const { required_roles, exempt_transitions, required_threshold } = this._authSpecs;

        const transitionIdentifier = `${current} -> ${target}`;
        
        // 4a. Check for Exemption
        if (exempt_transitions.has(transitionIdentifier)) { 
            return this._success(StatusCodes.AUTH_EXEMPT, "Transition exempted from governance threshold checks.");
        }

        // 4b. Credentials Format Check
        if (!credentials || !Array.isArray(credentials.roles)) {
             return this._fail(StatusCodes.AUTH_ERROR, "Required credentials ('roles' array) missing for threshold transition.");
        }
        
        // 4c. Threshold Enforcement using the external RoleThresholdScorer plugin (O(N) iteration over provided roles)
        const scoringResult = RoleThresholdScorer.execute({
            requiredRolesSet: required_roles,
            providedRoles: credentials.roles,
            requiredThreshold: required_threshold
        });

        if (scoringResult.error) {
             return this._fail(StatusCodes.AUTH_ERROR, `Scoring Error: ${scoringResult.error}`);
        }

        if (!scoringResult.met) {
            return this._fail(
                StatusCodes.AUTH_INSUFFICIENT, 
                `Governance threshold failed: Requires ${scoringResult.required} roles, only ${scoringResult.score} were matched.`
            );
        }

        // Note: Actual cryptographic signature verification is delegated to a higher security component.
        return this._success(StatusCodes.AUTH_MET, "Authorization threshold met.");
    }

    /**
     * Helper to generate standardized success responses.
     * @param {string} code
     * @param {string} reason
     * @returns {{valid: boolean, reason: string, code: string}}
     */
    private _success(code: string, reason: string): { valid: boolean, reason: string, code: string } {
        return { valid: true, reason: reason, code: code };
    }

    /**
     * Helper to generate standardized failure responses.
     * @param {string} code - Machine readable error code.
     * @param {string} reason - Human readable reason.
     * @returns {{valid: boolean, reason: string, code: string}}
     */
    private _fail(code: string, reason: string): { valid: boolean, reason: string, code: string } {
        return { valid: false, reason: `SMC_FAIL (${code}): ${reason}`, code: code };
    }
}

module.exports = SMCTransitionEnforcer;