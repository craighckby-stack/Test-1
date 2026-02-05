import logging
from system.monitoring.IH_Sentinel import IHSentinel
from system.utility.RRP_manager import RRPManager

# NOTE: Assume necessary agent interfaces and FSL instances are injected.

class GSEPOrchestrator:
    """Manages the mandatory, linear 15-stage Governance State Execution Pipeline (GSEP-C)."""
    def __init__(self, agent_interfaces, state_manager, flag_state_log):
        self.agents = agent_interfaces 
        self.state = state_manager
        self.fsl = flag_state_log
        self.ih_sentinel = IHSentinel()
        self.current_stage = 0 # Starting at S00

    def transition(self, target_stage, function_call):
        # Enforces S stage progression and checks FSL continuously for premature deviations
        while self.current_stage < target_stage:
            self.current_stage += 1
            if self.fsl.check_for_flags():
                 # IH trigger immediately upon flag detection, violating linearity/integrity
                 raise Exception(f"IH Flag detected during Stage S{self.current_stage}. Triggering IH Protocol.")
        
        logging.debug(f"Executing agent task for Phase up to S{target_stage}")
        function_call() # Execute agent task for the phase

        # Post-execution integrity check
        if self.fsl.check_for_flags():
             raise Exception(f"Post-execution IH Flag detected at Stage S{target_stage}. Triggering IH Protocol.")

    def enforce_pipeline(self):
        logging.info("S00: GSEP Initialization. State anchoring starts.")

        try:
            # P1: ANCHORING (S00-S01)
            self.transition(1, self.agents['CRoT'].lock_csr)

            # P2: VETTING (S02-S04)
            self.transition(4, self.agents['GAX'].run_acvd_vetting)

            # P3: EXECUTION (S05-S07)
            self.transition(7, self.agents['SGS'].execute_state_mutation)

            # P4: EVALUATION (S08-S10)
            self.transition(10, self.agents['GAX'].run_audit_comparison)

            # P5: FINALITY (S11) - Atomic P-01 Check
            self.current_stage = 11
            if not self.agents['GAX'].execute_p01_calculus():
                raise Exception("P-01 FAIL detected at S11: Axiomatic breach.")

            # P6: COMMITMENT (S12-S14)
            self.transition(14, self.agents['CRoT'].finalize_commitment_and_str_generation)

            logging.info("S14: DSE Complete. STR generated. State Committed.")
            return True

        except Exception as e:
            logging.critical(f"GSEP Failure/Integrity Halt Initiated: {e}")
            # Ensure IH-S is activated, utilizing current stage and FSL reading
            self.ih_sentinel.trigger_ih(self.current_stage, self.fsl.read_last_flag())
            RRPManager.restore_state(self.state) 
            return False
