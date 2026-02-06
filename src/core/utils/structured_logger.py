import logging
import json
import datetime
from typing import Any, Dict

class JsonFormatter(logging.Formatter):
    """Formats log records as structured JSON strings."""
    def format(self, record: logging.LogRecord) -> str:
        log_record: Dict[str, Any] = {
            "timestamp": datetime.datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "service": record.name,
            "message": record.getMessage(),
            "context": getattr(record, 'extra', {})
        }
        
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        
        # Optional: Add module/line info for debugging critical components
        if record.levelno >= logging.ERROR:
             log_record["location"] = f"{record.module}:{record.lineno}"

        return json.dumps(log_record)


def get_structured_logger(name: str, level=logging.INFO) -> logging.Logger:
    """Initializes and returns a structured JSON logger for a module/service.
    Used for mandatory pre-G0 and core operational logging.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.propagate = False # Prevent double logging if root logger is also configured
    
    # Only add handlers if none exist (to prevent configuration duplication)
    if not logger.handlers:
        # Console/Stream Handler
        ch = logging.StreamHandler()
        ch.setFormatter(JsonFormatter())
        logger.addHandler(ch)
        
    return logger

# NOTE: Components (like integrity_initializer.py) should use:
# logger = get_structured_logger(__name__)
# or rely on standard python logging setup if a central configuration is handled at startup.
