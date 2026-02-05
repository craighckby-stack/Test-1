import logging
from system.monitoring.IH_Sentinel import IHSentinel
from system.utility.RRP_manager import RRPManager
from system.config.gsep_config import GSEP_PHASES

# NOTE: Assume necessary agent interfaces and FSL instances are injected.

class GSEPOrchestrator:
    """Manages the mandatory, linear 15-stage Governance State Execution Pipeline (GSEP-C)."""
    
    def __init__(self, agent_interfaces, state_manager, flag_state_log):
        self.agents = agent_interfaces 
        self.state = state_manager
        self.fsl = flag_state_log
        self.ih_sentinel = IHSentinel()
        self.current_stage = 0 # Starting at S00

    def _enforce_stage_integrity(self, target_stage: int):
        """Mandatory, linear FSL check enforcement during sequential stage transition (e.g., S01 -> S02)."""
        while self.current_stage < target_stage:
            self.current_stage += 1
            stage_label = f"S{self.current_stage:02d}"
            
            if self.fsl.check_for_flags():
                # IH trigger immediately upon flag detection, violating linearity/integrity
                raise Exception(f"IH Flag detected during Stage {stage_label}. Triggering IH Protocol.")
        
        stage_label = f"S{self.current_stage:02d}"
        logging.debug(f"Stage {stage_label} reached. Executing associated task.")
        return stage_label

    def _execute_agent_task(self, target_stage: int, agent_key: str, method_name: str):
        """Executes the primary agent task associated with completing a phase (SXX)."""
        
        # 1. Enforcement (handles progression up to target_stage and pre-task FSL checks)
        stage_label = self._enforce_stage_integrity(target_stage)

        agent = self.agents.get(agent_key)
        if not agent:
             raise KeyError(f"Missing required Agent interface: {agent_key}")

        task_method = getattr(agent, method_name)
        
        task_method() # Execute agent task for the phase

        # 2. Post-execution integrity check
        if self.fsl.check_for_flags():
             raise Exception(f"Post-execution IH Flag detected at Stage {stage_label}. Triggering IH Protocol.")

    def enforce_pipeline(self):
        logging.info("S00: GSEP Initialization. State anchoring starts.")

        try:
            for phase in GSEP_PHASES:
                target = phase['target']
                agent = phase['agent']
                method = phase['method']
                
                if phase['type'] == 'ATOMIC_VALIDATION':
                    # P5: S11 Atomic Check (P-01 Calculus)
                    
                    # 1. Ensure stage S11 is reached with full integrity checks (Fixing Original Flaw)
                    self._enforce_stage_integrity(target) 
                    
                    logging.debug(f"S11: Running P-01 Axiomatic Calculus Check ({agent}.{method}).")
                    
                    if not self.agents[agent].execute_p01_calculus():
                        raise Exception("P-01 FAIL detected at S11: Axiomatic breach.")
                    
                    # 2. Post validation FSL check
                    if self.fsl.check_for_flags():
                        raise Exception(f"Post P-01 check IH Flag detected at S11. Triggering IH Protocol.")
                
                else:
                    # General execution phases (P1, P2, P3, P4, P6)
                    self._execute_agent_task(target, agent, method)


            logging.info("S14: GSEP Complete. STR generated. State Committed.")
            return True

        except Exception as e:
            fail_stage = self.current_stage if self.current_stage <= 14 else 0
            fail_label = f"S{fail_stage:02d}"

            logging.critical(f"GSEP Failure/Integrity Halt Initiated at {fail_label}: {e}")
            
            # Ensure IH-S is activated
            self.ih_sentinel.trigger_ih(fail_label, str(e))
            RRPManager.restore_state(self.state) 
            return False