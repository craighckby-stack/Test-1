import json

def canonicalize_json(data: dict) -> bytes:
    """Generates a deterministic, canonical representation of a JSON object (JCS compliant logic).

    Ensures cryptographic integrity across signing agents by enforcing:
    1. Consistent key ordering (alphabetical).
    2. Minimal white-space.
    3. Consistent Unicode encoding.

    Args:
        data: The dictionary representation of the JSON payload.

    Returns:
        Bytes object containing the canonicalized UTF-8 JSON string.
    """
    # Use Python's standard library features simulating JCS requirements:
    # separators=(',', ':') removes whitespace.
    # sort_keys=True enforces alphabetical ordering.
    canonical_string = json.dumps(
        data,
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=False  # Required for UTF-8 stability
    )
    return canonical_string.encode('utf-8')

if __name__ == '__main__':
    # Example usage
    test_payload = {
        "timestamp": "2024-10-27T12:00:00Z",
        "payload_hashes": {"CFTM_hash": "...", "PVLM_hash": "..."},
        "mandate_id": "AGI-APM-20241027-001"
    }
    canonical = canonicalize_json(test_payload)
    print(f"Original: {json.dumps(test_payload)}")
    print(f"Canonical: {canonical.decode('utf-8')}")
