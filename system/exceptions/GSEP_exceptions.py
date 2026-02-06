class GSEPException(Exception):
    """Base exception for all GSEP errors."""
    pass

class GSEPIntegrityBreach(GSEPException):
    """Raised when the Flag State Log (FSL) detects a critical flag during stage transition or execution."""
    pass

class GSEPValidationFailure(GSEPIntegrityBreach):
    """Raised specifically when critical, irreversible calculations (e.g., P-01 Calculus) fail."""
    pass

class GSEPConfigurationError(GSEPException):
    """Raised when required agents, interfaces, or methods are missing or misconfigured in GSEP_PHASES."""
    pass
