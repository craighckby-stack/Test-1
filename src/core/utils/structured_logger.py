import logging
import json
import datetime
from typing import Any, Dict, Set, Optional
import sys

# Standard Python LogRecord keys, used to differentiate custom 'extra' data.
STANDARD_LOG_KEYS: Set[str] = {
    'name', 'levelno', 'levelname', 'pathname', 'filename',
    'module', 'lineno', 'funcName', 'created', 'asctime',
    'msecs', 'relativeCreated', 'thread', 'threadName',
    'process', 'processName', 'message', 'msg', 'args',
    'exc_info', 'exc_text', 'stack_info', 'extra', 'v_info',
    'sinfo', 'taskName', 
    # Internal Python logging fields to ignore
    'level'
}

class JsonFormatter(logging.Formatter):
    """ 
    Formats log records as structured JSON strings. 
    Intelligently extracts standard fields and captures all other attributes 
    passed via 'extra' into a dedicated 'context' field.
    """
    def format(self, record: logging.LogRecord) -> str:
        
        # 1. Base structured data
        log_data: Dict[str, Any] = {
            "timestamp": datetime.datetime.fromtimestamp(record.created).isoformat(timespec='milliseconds'),
            "level": record.levelname,
            "service": record.name,
            "message": record.getMessage(),
            "severity_code": record.levelno,
        }
        
        # Add source location
        log_data["source"] = f"{record.module}.{record.funcName}:{record.lineno}"
        
        # 2. Capture tracebacks/exceptions
        if record.exc_info:
            log_data["exception_details"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else "Unknown",
                # Ensure the full traceback is captured
                "stack_trace": self.formatException(record.exc_info).strip()
            }
        elif record.exc_text:
             log_data["exception_details"] = {"stack_trace": record.exc_text.strip()}

        # 3. Capture remaining context (attributes passed via `extra`)
        context_data = {}
        for key, value in record.__dict__.items():
            # Filter standard keys, internal keys, and None values
            if key not in STANDARD_LOG_KEYS and not key.startswith('_') and value is not None:
                # Robust serialization check
                try:
                    json.dumps(value)
                    context_data[key] = value
                except TypeError:
                    # Fallback for non-JSON serializable objects
                    context_data[key] = repr(value)

        if context_data:
            log_data["context"] = context_data

        # 4. Final serialization
        try:
            return json.dumps(log_data)
        except TypeError as e:
            # Emergency fallback if structured log data itself cannot be serialized
            fallback_msg = f"LOG_SERIALIZATION_FAILURE: {record.levelname} in {record.name}. Data was non-serializable."
            print(f"{fallback_msg} Error: {e}", file=sys.stderr)
            return json.dumps({"level": "CRITICAL", "message": fallback_msg, "original_log_name": record.name})


def get_structured_logger(name: str, level: int = logging.INFO, handler: Optional[logging.Handler] = None) -> logging.Logger:
    """
    Initializes and returns a structured JSON logger for a module/service.

    Args:
        name: The name of the logger (usually __name__). 
        level: The minimum logging level to report. 
        handler: Optional custom handler (e.g., FileHandler). Defaults to StreamHandler.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Prevent logs propagating to and duplicating setup in the root logger
    logger.propagate = False 

    # Only configure handlers if the logger has not been configured before
    if not logger.handlers:
        # Default to streaming standard output if no specific handler provided
        ch = handler if handler else logging.StreamHandler(sys.stdout)
        
        # Apply the structured JSON format
        ch.setFormatter(JsonFormatter())
        logger.addHandler(ch)
        
    return logger

# NOTE: Usage in other components: 
# from src.core.utils.structured_logger import get_structured_logger
# logger = get_structured_logger(__name__, level=logging.DEBUG)
# logger.info("Operation initiated", job_id=123, component="Core")
