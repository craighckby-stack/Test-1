# P01_CALCULUS_ENGINE.PY

from typing import Dict, Any, Union

# NOTE: ACVD_THRESHOLD represents the minimum TEMM required, derived from ACVD (UFRM + CFTM)

def evaluate_p01_finality(
    temm: float,
    acvd_threshold: float,
    ecvm: bool,
    pvlm: bool,
    mpam: bool,
    adtm: bool
) -> Dict[str, Union[bool, str]]:
    """Calculates the P-01 PASS/FAIL atomic decision based on input metrics and flags.
       Also determines if an Integrity Halt (IH) is triggered based on input flags.
    """

    # Axiom I (UMA): Utility Maximization Attestation
    axiom_i_pass = temm >= acvd_threshold
    
    # Axiom II (CA): Context Attestation
    axiom_ii_pass = ecvm
    
    # Axiom III (AI): Axiomatic Integrity Validation
    axiom_iii_pass = not (pvlm or mpam or adtm)

    # P-01 Finalization Calculation (S11)
    p01_pass = axiom_i_pass and axiom_ii_pass and axiom_iii_pass
    
    # Integrity Halt Check (Immediate Failure Response)
    integrity_halt = (not ecvm) or pvlm or mpam or adtm or (not p01_pass)
    
    # Determine halt reason if applicable
    halt_reason = "NONE"
    if integrity_halt:
        if pvlm: halt_reason = "PVLM: Pre-Validation Logic Miss"
        elif not ecvm: halt_reason = "ECVM: Execution Context Verification Metric (False)"
        elif mpam: halt_reason = "MPAM: Manifest Policy Axiom Miss"
        elif adtm: halt_reason = "ADTM: Axiomatic Deviation Threshold Miss"
        elif not p01_pass: halt_reason = "P-01 Axiom Failure (Post-Evaluation)"
        
    return {
        "P01_PASS": p01_pass,
        "Axiom_I_UMA": axiom_i_pass,
        "Axiom_II_CA": axiom_ii_pass,
        "Axiom_III_AI": axiom_iii_pass,
        "INTEGRITY_HALT": integrity_halt,
        "HALT_REASON": halt_reason
    }

# Example Usage:
# result = evaluate_p01_finality(temm=95.5, acvd_threshold=90.0, ecvm=True, pvlm=False, mpam=False, adtm=False)
# print(result)
