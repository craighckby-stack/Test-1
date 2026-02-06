class HashingServiceError(Exception):
    """Base exception for all hashing service errors."""
    pass

class HashingInitializationError(HashingServiceError):
    """Raised when the specified hashing algorithm is unavailable or improperly configured."""
    pass

class ArtifactSerializationError(HashingServiceError):
    """Raised when an artifact cannot be canonically serialized (e.g., due to unsupported data types in the dictionary)."""
    pass