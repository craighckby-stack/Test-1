import logging
from system.monitoring.IH_Sentinel import IHSentinel
from system.utility.RRP_manager import RRPManager
from system.config.gsep_config import GSEP_PHASES
from system.exceptions.GSEP_exceptions import GSEPIntegrityBreach, GSEPConfigurationError, GSEPValidationFailure

# NOTE: Assume necessary agent interfaces and FSL instances are injected.

class GSEPOrchestrator:
    """Manages the mandatory, linear 15-stage Governance State Execution Pipeline (GSEP-C)."""
    
    def __init__(self, agent_interfaces, state_manager, flag_state_log):
        self.agents = agent_interfaces 
        self.state = state_manager
        self.fsl = flag_state_log
        self.ih_sentinel = IHSentinel()
        # S00 is the initial state before execution starts.
        self.current_stage = 0 

    def _handle_integrity_halt(self, failure_reason: str) -> bool:
        """Centralized function for handling GSEP failures, logging, IH trigger, and state restoration."""
        fail_label = f"S{self.current_stage:02d}"

        logging.critical(f"GSEP Integrity Halt initiated at {fail_label}. Reason: {failure_reason}")

        # Activation protocols
        self.ih_sentinel.trigger_ih(fail_label, failure_reason)
        RRPManager.restore_state(self.state) 
        
        return False

    def _progress_to_stage(self, target_stage: int) -> str:
        """
        Linearly increments the current stage to the target stage.
        Checks FSL integrity *during* every intermediate step.
        Returns the stage label (e.g., 'S05').
        """
        while self.current_stage < target_stage:
            self.current_stage += 1
            stage_label = f"S{self.current_stage:02d}"
            
            # Critical Check: FSL violation between stages
            if self.fsl.check_for_flags():
                raise GSEPIntegrityBreach(f"IH Flag detected during Stage transition to {stage_label}.")
            
            logging.debug(f"Stage {stage_label} reached. Ready for execution.")
            
        return f"S{self.current_stage:02d}"

    def _get_agent_method(self, agent_key: str, method_name: str):
        """Utility to retrieve agent method or raise configuration errors."""
        agent = self.agents.get(agent_key)
        if not agent:
             raise GSEPConfigurationError(f"Missing required Agent interface: {agent_key}")

        try:
            return getattr(agent, method_name)
        except AttributeError:
            raise GSEPConfigurationError(f"Agent '{agent_key}' missing required method: {method_name}")

    def _run_gsep_phase(self, phase: dict):
        """Handles standardized progression, execution, validation, and post-task FSL checks for any GSEP phase."""
        target_stage = phase['target']
        agent_key = phase['agent']
        method_name = phase['method']
        phase_type = phase['type']
        
        # 1. Progression Enforcement (includes inter-stage integrity check)
        stage_label = self._progress_to_stage(target_stage)
        
        task_method = self._get_agent_method(agent_key, method_name)

        logging.info(f"{stage_label} ({phase_type}): Executing {agent_key}.{method_name}")

        # 2. Execution
        result = task_method()

        # 3. Specific validation check (P-01 Axiomatic Calculus only)
        if phase_type == 'ATOMIC_VALIDATION':
            if not isinstance(result, bool) or not result:
                # This specific failure mode results in a validation exception
                raise GSEPValidationFailure("P-01 FAIL detected: Axiomatic breach identified during calculus.")
        
        # 4. Post-execution integrity check
        if self.fsl.check_for_flags():
             raise GSEPIntegrityBreach(f"Post-execution IH Flag detected at {stage_label} after {method_name}.")

    def enforce_pipeline(self) -> bool:
        logging.info("S00: GSEP Initialization. State anchoring starts.")

        try:
            for phase in GSEP_PHASES:
                # Key check robustness is handled by the scaffolded validator
                self._run_gsep_phase(phase)

            # S15 represents final commit state after S14 execution
            self.current_stage = 15 
            logging.info("S15: GSEP Complete. STR generated. State Committed.")
            return True

        except (GSEPIntegrityBreach, GSEPConfigurationError, GSEPValidationFailure, KeyError) as e:
            # Catch specific, anticipated exceptions and route them through the centralized halt handler
            return self._handle_integrity_halt(str(e))
        except Exception as e:
            # Catch unexpected runtime exceptions
            logging.error(f"Unexpected critical error during GSEP execution: {e}", exc_info=True)
            return self._handle_integrity_halt(f"Unexpected Runtime Error: {e}")