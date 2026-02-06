from typing import Dict, Any, Optional
import os
import json

class SecureLogRepository:
    """Abstracts and provides secure, append-only persistence for sealed forensic logs.
       This repository is designed to be highly resistant to corruption and write failures during critical IH events.
    """
    def __init__(self, storage_path: str = "./forensic_logs/sealed_data.jsonl"):
        self.storage_path = storage_path
        os.makedirs(os.path.dirname(storage_path), exist_ok=True)

    def store_log(self, sealed_log_entry: Dict[str, Any]) -> None:
        """Atomically appends a new, sealed log entry to the log file (JSONL format)."""
        try:
            # Use 'a' mode for append, mandatory for log stream integrity
            with open(self.storage_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(sealed_log_entry) + '\n')
            # NOTE: For true resilience, this operation should be synchronized and disk-flushed.
        except IOError as e:
            raise IOError(f"[CRITICAL] Failed to atomically write forensic log to disk: {e}")

    def retrieve_log(self, ih_event_id: str) -> Optional[Dict[str, Any]]:
        """Linearly searches the repository for a specific IH event ID (Slow, intended for audit/retrieval only)."""
        try:
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                for line in f:
                    entry = json.loads(line)
                    if entry.get('event_id') == ih_event_id:
                        return entry
        except FileNotFoundError:
            return None
        except json.JSONDecodeError as e:
            print(f"Warning: Corruption detected in log file at line: {e}")
            # System should trigger integrity check on log file
            return None
        return None

    def retrieve_all(self) -> list[Dict[str, Any]]:
        """Retrieves all sealed logs for full system audit."""
        logs = []
        try:
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                for line in f:
                    logs.append(json.loads(line))
        except FileNotFoundError:
            pass
        return logs