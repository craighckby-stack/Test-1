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
        self.current_stage = 0 # Starting at S00

    def _handle_integrity_halt(self, failure_reason: str) -> bool:
        """Centralized function for handling GSEP failures, logging, IH trigger, and state restoration."""
        # self.current_stage reflects the stage *at* or *approaching* the failure point.
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
        """
        while self.current_stage < target_stage:
            self.current_stage += 1
            stage_label = f"S{self.current_stage:02d}"
            
            # Check for violation between stages (linear integrity check)
            if self.fsl.check_for_flags():
                raise GSEPIntegrityBreach(f"IH Flag detected during Stage transition to {stage_label}.")
            
            logging.debug(f"Stage {stage_label} reached. Ready for execution.")
            
        return f"S{self.current_stage:02d}"

    def _execute_agent_task(self, target_stage: int, agent_key: str, method_name: str, phase_type: str):
        """Handles standard phase execution, enforcing pre-task progression and post-task FSL checks."""
        
        # 1. Progression Enforcement (Pre-task FSL checks handled internally)
        stage_label = self._progress_to_stage(target_stage)

        agent = self.agents.get(agent_key)
        if not agent:
             raise GSEPConfigurationError(f"Missing required Agent interface: {agent_key}")

        try:
            task_method = getattr(agent, method_name)
        except AttributeError:
            raise GSEPConfigurationError(f"Agent '{agent_key}' missing required method: {method_name}")

        logging.info(f"{stage_label} ({phase_type}): Executing {agent_key}.{method_name}")

        task_method() # Execute agent task

        # 2. Post-execution integrity check
        if self.fsl.check_for_flags():
             raise GSEPIntegrityBreach(f"Post-execution IH Flag detected at {stage_label} after {method_name}.")

    def _handle_atomic_validation(self, target_stage: int, agent_key: str, method_name: str):
        """Handles the critical S11 P-01 Atomic Validation phase."""
        # 1. Progression Enforcement
        stage_label = self._progress_to_stage(target_stage) 
        
        agent = self.agents.get(agent_key)
        if not agent:
             raise GSEPConfigurationError(f"Missing required Agent interface for S11 validation: {agent_key}")

        try:
            validation_method = getattr(agent, method_name)
        except AttributeError:
            raise GSEPConfigurationError(f"Agent '{agent_key}' missing required method: {method_name}")

        logging.info(f"{stage_label} (ATOMIC_VALIDATION): Running P-01 Axiomatic Calculus Check.")

        if not validation_method():
            # If validation fails, raise specific exception
            raise GSEPValidationFailure("P-01 FAIL detected: Axiomatic breach identified during calculus.")
        
        # 2. Post validation FSL check
        if self.fsl.check_for_flags():
            raise GSEPIntegrityBreach(f"Post P-01 validation IH Flag detected at {stage_label}.")

    def enforce_pipeline(self):
        logging.info("S00: GSEP Initialization. State anchoring starts.")

        try:
            for phase in GSEP_PHASES:
                target = phase['target']
                agent = phase['agent']
                method = phase['method']
                
                if phase['type'] == 'ATOMIC_VALIDATION':
                    self._handle_atomic_validation(target, agent, method)
                
                else:
                    self._execute_agent_task(target, agent, method, phase['type'])

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