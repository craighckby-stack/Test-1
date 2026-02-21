# ...[TRUNCATED]
import json
import os
import hashlib
import subprocess

def stableStringify(obj):
    """
    Recursively traverses and sorts keys within objects to ensure deterministic stringification.
    """
    if isinstance(obj, dict):
        return {k: stableStringify(v) for k, v in sorted(obj.items())}
    elif isinstance(obj, list):
        return [stableStringify(item) for item in obj]
    else:
        return obj

def compute_hash(file_path):
    hasher = hashlib.sha256()
    with open(file_path, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def generate_manifest():
    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)
    
    current_commit = get_git_commit()

    # Update policy_id and schema_version
    manifest['policy_id'] = 'SBCM-941B'
    manifest['schema_version'] = 'v5.0.0-AGI'

    # Update metadata
    manifest['metadata'] = {
        'policy_name': 'Sovereign AGI Baseline Modeling Policy',
        'description': 'Establishes integrity, dependency validation, and strict resource governance for core autonomous evolution cycles.',
        'owner_entity': 'Sovereign Core Registry v94.1',
        'status': 'ACTIVE_ENFORCED',
        'revision_date': '2024-05-15T10:00:00Z'
    }

    # Update baseline_integrity
    manifest['baseline_integrity'] = {
        'artifact_name': 'Certified Evolution Execution Protocol (CEEP)',
        'verification_settings': {
            'algorithm': 'SHA-512',
            'expected_hash': 'd8c4e0b5f6a9c2b1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c61234567890abcdefedcba9876543210fedcba9876543210',
            'attestation_requirement': 'TRUST_ROOT_CERTIFIED'
        }
    }

    # Update trusted_dependencies
    manifest['trusted_dependencies'] = [
        {
            'module_id': 'ModelSynthesizer_v2.1',
            'version_lock': '~2.1.0',
            'scope': 'runtime',
            'mandatory': True,
            'integrity_check': {
                'algorithm': 'SHA-384',
                'value': '678e90f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d7e8f9a0b1c2d3e4f5a6b7c8d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5'
            }
        }
    ]

    # Update operational_assurance
    manifest['operational_assurance'] = {
        'core_metrics': [
            {
                'metric_name': 'ModelConfidenceScore',
                'target_threshold': 0.9999,
                'deviation_tolerance': 0.00001
            },
            {
                'metric_name': 'EvolutionCycleLatency_ms',
                'target_threshold': 500,
                'deviation_tolerance': 'MAX_ABS_50'
            }
        ],
        'enforcement_action': {
            'level': 'CRITICAL',
            'action': 'HALT_EXECUTION_AND_ISOLATE',
            'report_channel': 'SBCM_CRITICAL_ALERT'
        }
    }

    # Update modeling_governance
    manifest['modeling_governance'] = {
        'data_source_policy_id': 'DTEM-74A',
        'runtime_governance': {
            'mode': 'ephemeral_sandboxed',
            'resource_limits': {
                'max_cpu_ms': 1500,
                'max_memory_mb': 512,
                'execution_timeout_s': 30
            },
            'environment_context': {
                'isolation_level': 'L4_SEALED',
                'processor_unit_id': 'PU-941A-Core-01'
            }
        }
    }

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

Note that I've added the `stableStringify` function to recursively sort keys within objects, ensuring deterministic stringification. This is crucial for cryptographic signing/hashing where key order must be preserved and standardized.