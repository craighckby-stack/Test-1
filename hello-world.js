def calculate_nexus_branch_synthesis(input_data):
    """
    Calculates the nexus branch synthesis by processing input data,
    including recursive resolution and merging of 'hallucinated_' keys,
    and then extracting specific integrity profile attributes.

    'hallucinated_' keys in the input data are resolved by merging their content
    into the corresponding non-hallucinated key. If a key 'X' and 'hallucinated_X'
    both exist, 'hallucinated_X' data augments or overrides 'X' data:
    - If both are dictionaries, they are deep-merged.
    - If both are lists, the 'hallucinated_' list elements are extended into the base list.
    - For other types, the 'hallucinated_' value overwrites the base value.

    Args:
        input_data (dict): A dictionary containing the input data, potentially
                           with 'hallucinated_' keys.

    Returns:
        dict: A dictionary containing the calculated nexus branch synthesis,
              with all hallucinated data resolved and specific fields extracted.
    """

    # Helper function for recursively merging dictionaries
    def _deep_merge(target, source):
        """
        Recursively merges source dictionary into target dictionary.
        List values are extended (non-unique). Other types are overwritten
        by the source.
        """
        for key, value in source.items():
            if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                target[key] = _deep_merge(target[key], value)
            elif key in target and isinstance(target[key], list) and isinstance(value, list):
                # Extend lists. For unique elements, use `target[key].extend(x for x in value if x not in target[key])`
                target[key].extend(value)
            else:
                target[key] = value
        return target

    # Helper function to recursively resolve 'hallucinated_' keys
    def _resolve_hallucinations(data_chunk):
        """
        Processes a dictionary to resolve and merge 'hallucinated_' keys.
        'hallucinated_X' will be merged into 'X', with hallucinated data taking
        precedence or augmenting existing data.
        """
        if not isinstance(data_chunk, dict):
            return data_chunk

        resolved_data = {}
        hallucinations_to_merge = {}

        # First pass: Recursively process non-hallucinated keys
        for k, v in data_chunk.items():
            if not k.startswith('hallucinated_'):
                resolved_data[k] = _resolve_hallucinations(v)

        # Second pass: Recursively process 'hallucinated_' keys and collect them for merging
        for k, v in data_chunk.items():
            if k.startswith('hallucinated_'):
                base_k = k[len('hallucinated_'):]
                hallucinations_to_merge[base_k] = _resolve_hallucinations(v)
        
        # Merge collected hallucinations into the resolved data.
        # This effectively means hallucinated data augments/overrides non-hallucinated data.
        return _deep_merge(resolved_data, hallucinations_to_merge)

    # Step 1: Resolve all 'hallucinated_' keys in the entire input_data
    processed_input_data = _resolve_hallucinations(input_data)

    nexus_branch_synthesis = {}

    # Safely get integrity_profiles, defaulting to an empty dict if not present
    integrity_profiles = processed_input_data.get("integrity_profiles", {})

    # Iterate over each integrity profile in the processed data
    for profile_name, profile_data in integrity_profiles.items():
        profile_synthesis = {}

        # Extract monitoring_slo_id if present
        if "monitoring_slo_id" in profile_data:
            profile_synthesis["monitoring_slo_id"] = profile_data["monitoring_slo_id"]

        # Safely get constraints, defaulting to an empty dict
        constraints = profile_data.get("constraints", {})

        # Extract resource_limits if present
        resource_limits = constraints.get("resource_limits", {})
        if resource_limits: # Check if the dictionary is not empty
            profile_synthesis["resource_limits"] = resource_limits

        # Extract security_policy details
        security_policy = constraints.get("security_policy", {})
        if security_policy: # Only proceed if security_policy dict is not empty
            security_policy_synthesis = {}

            # Syscalls allowed
            if "syscalls_allowed" in security_policy:
                security_policy_synthesis["syscalls_allowed"] = security_policy["syscalls_allowed"]
            
            # Network ports disallowed
            if "network_ports_disallowed" in security_policy:
                security_policy_synthesis["network_ports_disallowed"] = security_policy["network_ports_disallowed"]
            
            # Immutable paths
            if "paths_immutable" in security_policy:
                security_policy_synthesis["paths_immutable"] = security_policy["paths_immutable"]
            
            # Configuration hash mandate
            if "configuration_hash_mandate" in security_policy:
                security_policy_synthesis["configuration_hash_mandate"] = security_policy["configuration_hash_mandate"]

            # Add security_policy_synthesis to profile_synthesis only if it contains extracted fields
            if security_policy_synthesis:
                profile_synthesis["security_policy"] = security_policy_synthesis
            
            # Network mode (special case: extracted to profile root level)
            if "network_mode" in security_policy:
                profile_synthesis["network_mode"] = security_policy["network_mode"]

        # Add the profile synthesis to the overall nexus branch synthesis
        # only if the profile_synthesis itself contains any data
        if profile_synthesis:
            nexus_branch_synthesis[profile_name] = profile_synthesis

    return nexus_branch_synthesis