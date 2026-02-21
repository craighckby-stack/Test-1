# CORE:
# ...[TRUNCATED]

class PCLDError(Exception):
    """Base exception for all PCLD related errors."""
    pass

class PCLDSafetyError(PCLDError):
    """Raised when PCLD safety checks fail during compilation."""
    pass

class PCLResourceError(PCLDError):
    """Raised when PCLD resource checks fail during compilation."""
    pass

class PCLIRGenerationError(PCLDError):
    """Raised when PCLD IR generation fails during compilation."""
    pass

class PCLAttestationError(PCLDError):
    """Raised when PCLD attestation fails during compilation."""
    pass

# ...[TRUNCATED]

# PCLD-CV Compilation Stage 1: Source Code Parsing
try:
    # Parse PCLD source code into an Abstract Syntax Tree (AST)
    ast = parse_pcl_source()
except PCLDError as e:
    print(f"Error: PCLD parsing error - {e}")
    return

# ...[TRUNCATED]

# PCLD-CV Compilation Stage 2: Static Analysis
try:
    # Perform deep static analysis to guarantee strong safety and determinism
    ast = validate_pcl_ast(ast)
except PCLDSafetyError as e:
    print(f"Error: PCLD safety error - {e}")
    return

# ...[TRUNCATED]

# PCLD-CV Compilation Stage 3: Resource Cost Modeling & Bounding
try:
    # Calculate the worst-case execution time (WCET) modeled in PEK clock cycles
    wcet = calculate_wcet(ast)
    # Calculate the maximum allowed stack depth and guaranteed peak memory allocation
    stack_depth, memory_allocation = calculate_resource_bounds(ast)
    # Embed resource bounding data within the PCLD-IR structure
    ir_metadata = embed_resource_bounds(ast, wcet, stack_depth, memory_allocation)
except PCLResourceError as e:
    print(f"Error: PCLD resource error - {e}")
    return

# ...[TRUNCATED]

# PCLD-CV Compilation Stage 4: Intermediate Representation Artifact (PCLD-IR)
try:
    # Generate a fully packaged PCLD-IR artifact, utilizing minimized Axiomatic Bytecode (ABX)
    ir_artifact = generate_pcl_ir(ast, ir_metadata)
except PCLIRGenerationError as e:
    print(f"Error: PCLD IR generation error - {e}")
    return

# ...[TRUNCATED]

# PCLD-CV Compilation Stage 5: Attestation and Integrity
try:
    # Generate a holistic integrity hash (SHA-512) spanning the entire packaged PCLD-IR artifact (Code + Metadata)
    integrity_hash = generate_integrity_hash(ir_artifact)
    # Queue the artifact and its integrity hash for attestation registration with the Secure Governance System (SGS)
    register_artifact(integrity_hash)
except PCLAttestationError as e:
    print(f"Error: PCLD attestation error - {e}")
    return

# ...[TRUNCATED]

# ...[TRUNCATED]

for definition in manifest['schemaDefinitions']:
    relative_path = definition['relativePath']
    # Assuming relativePath is consistent with file system location
    schema_path = relative_path.lstrip('/')

    if os.path.exists(schema_path):
        checksum = compute_hash(schema_path)
        definition['integrityCheck']['hash'] = checksum
        definition['integrityCheck']['lastValidatedGitCommit'] = current_commit
    else:
        print(f"Warning: Schema file not found: {schema_path}")
        definition['integrityCheck']['hash'] = 'FILE_NOT_FOUND'
        
# Sort keys in manifest to ensure deterministic stringification
manifest = stableStringify(manifest)
    
with open(MANIFEST_PATH, 'w') as f:
    json.dump(manifest, f, indent=2)
    
print(f"Successfully updated {MANIFEST_PATH}. Linked to commit: {current_commit}")

if __name__ == '__main__':
    generate_manifest()
```

```python
# ADD:
class ADEPError(Exception):
    """Base exception for all ADEP related errors."""
    pass

class ADEPValidationFailure(ADEPError):
    """Raised when data payload fails schema validation during DSE Handoff."""
    pass

class ADEPSynchronizationError(ADEPError):
    """Raised when a required lock acquisition or synchronization primitive fails, indicating a contention or storage infrastructure fault."""
    pass

class PCLDError(Exception):
    """Base exception for all PCLD related errors."""
    pass

class PCLDSafetyError(PCLDError):
    """Raised when PCLD safety checks fail during compilation."""
    pass

class PCLResourceError(PCLDError):
    """Raised when PCLD resource checks fail during compilation."""
    pass

class PCLIRGenerationError(PCLDError):
    """Raised when PCLD IR generation fails during compilation."""
    pass

class PCLAttestationError(PCLDError):
    """Raised when PCLD attestation fails during compilation."""
    pass
```

```python
# Nexus branch:
class NexusError(Exception):
    """Base exception for all Nexus related errors."""
    pass

class NexusCompilationError(NexusError):
    """Raised when Nexus compilation fails."""
    pass

class NexusLinkingError(NexusError):
    """Raised when Nexus linking fails."""
    pass

class NexusVerificationError(NexusError):
    """Raised when Nexus verification fails."""
    pass