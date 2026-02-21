# CORE:
# ...[TRUNCATED]
H)
    
    # Update manifest with integrity checks
    for definition in validated_manifest['schemaDefinitions']:
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
    validated_manifest = stableStringify(validated_manifest)
    
    # Write updated manifest to file
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(validated_manifest, f, indent=2)
    
    print(f"Successfully updated {MANIFEST_PATH}. Linked to commit: {current_commit}")
    
    # Validate runtime environment against SEM constraints
    try:
        from component.runtime_validation import validateRuntime
        constraints = load_sem_constraints()
        if not validateRuntime(constraints):
            raise NexusRuntimeError("Runtime environment failed constraint checks")
    except Exception as e:
        print(f"Error: Unexpected error - {e}")
        raise
    
    # Validate KMS operations against policies
    try:
        from component.cryptography.KMS_Policy_Engine import KMSPolicyEngine
        kms_policy_engine = KMSPolicyEngine()
        kms_policy_engine.validate(request)
    except PolicyValidationError as e:
        print(f"Error: Policy validation error - {e}")
        raise
    except Exception as e:
        print(f"Error: Unexpected error - {e}")
        raise

except NexusCompilationError as e:
    print(f"Error: Nexus compilation error - {e}")
    raise
except NexusLinkingError as e:
    print(f"Error: Nexus linking error - {e}")
    raise
except NexusVerificationError as e:
    print(f"Error: Nexus verification error - {e}")
    raise
except NexusRuntimeError as e:
    print(f"Error: Nexus runtime error - {e}")
    raise
except Exception as e:
    print(f"Error: Unexpected error - {e}")
    raise

# Nexus branch:
class NexusRuntimeError(NexusError):
    """Raised when Nexus runtime environment fails constraint checks."""
    pass

# ADD:
class NexusIntegrationError(NexusError):
    """Raised when Nexus integration fails."""
    pass

# ...[TRUNCATED]
```

```python
# Nexus branch:
class NexusError(Exception):
    """Base class for Nexus-related exceptions."""
    pass

# ADD:
import fs from 'fs';

/**
 * Validates the local host environment against the strict resource constraints
 * defined in the SEM configuration prior to sandbox initialization.
 * @param {object} constraints - ExecutionEnvironmentConstraints from SEM_config
 * @returns {boolean} True if environment meets constraints.
 */
export function validateRuntime(constraints) {
    // 1. Basic CPU/Memory Check (Placeholder: assumes basic resource checks are possible)
    const availableCores = require('os').cpus().length;
    if (availableCores < constraints.cpu_limit_cores) {
        console.error(`CPU check failed: Needs ${constraints.cpu_limit_cores}, found ${availableCores}.`);
        return false;
    }

    // 2. Accelerator Requirement Check
    const accReq = constraints.accelerator_requirements;
    if (accReq.type !== 'None' && accReq.count > 0) {
        // NOTE: In a real system, this involves querying kernel/hardware APIs (e.g., nvidia-smi).
        console.log(`Checking for ${accReq.count} ${accReq.type} devices...`);
        if (accReq.type === 'GPU' && !checkGPUDevices(accReq.count, accReq.driver_version_tag)) {
            return false;
        }
        // ... add logic for TPU/FPGA checks ...
    }

    console.log("Runtime environment passed constraint checks.");
    return true;
}

function checkGPUDevices(requiredCount, requiredVersion) {
    // --- Highly critical and platform-specific check required here ---
    // e.g., shelling out to check device availability and CUDA/driver version compliance.
    // Placeholder return for scaffolding:
    if (requiredCount > 0) {
        console.error(`ERROR: Placeholder GPU check failing for requirement: Count ${requiredCount}, Version ${requiredVersion}`);
        return false; // Fails unless concrete hardware check passes
    }
    return true;
}
```

```python
# Nexus branch:
class NexusIntegrationError(NexusError):
    """Raised when Nexus integration fails."""
    pass

# ADD:
import fs from 'fs';

/**
 * Validates the local host environment against the strict resource constraints
 * defined in the SEM configuration prior to sandbox initialization.
 * @param {object} constraints - ExecutionEnvironmentConstraints from SEM_config
 * @returns {boolean} True if environment meets constraints.
 */
export function validateRuntime(constraints) {
    // 1. Basic CPU/Memory Check (Placeholder: assumes basic resource checks are possible)
    const availableCores = require('os').cpus().length;
    if (availableCores < constraints.cpu_limit_cores) {
        console.error(`CPU check failed: Needs ${constraints.cpu_limit_cores}, found ${availableCores}.`);
        return false;
    }

    // 2. Accelerator Requirement Check
    const accReq = constraints.accelerator_requirements;
    if (accReq.type !== 'None' && accReq.count > 0) {
        // NOTE: In a real system, this involves querying kernel/hardware APIs (e.g., nvidia-smi).
        console.log(`Checking for ${accReq.count} ${accReq.type} devices...`);
        if (accReq.type === 'GPU' && !checkGPUDevices(accReq.count, accReq.driver_version_tag)) {
            return false;
        }
        // ... add logic for TPU/FPGA checks ...
    }

    console.log("Runtime environment passed constraint checks.");
    return true;
}

function checkGPUDevices(requiredCount, requiredVersion) {
    // --- Highly critical and platform-specific check required here ---
    // e.g., shelling out to check device availability and CUDA/driver version compliance.
    // Placeholder return for scaffolding:
    if (requiredCount > 0) {
        console.error(`ERROR: Placeholder GPU check failing for requirement: Count ${requiredCount}, Version ${requiredVersion}`);
        return false; // Fails unless concrete hardware check passes
    }
    return true;
}