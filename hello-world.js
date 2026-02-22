from typing import Dict, Any, List, Union

def calculate_nexus_branch_synthesis(draft_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculates the nexus branch synthesis based on the provided draft input,
    including a recursive "hallucination" logic.

    Args:
        draft_input (dict): The input dictionary containing the integrity profiles.

    Returns:
        dict: The calculated nexus branch synthesis with applied recursive logic.
    """

    def _apply_hallucination_recursively(data_to_process: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recursively applies the 'hallucination' logic by re-wrapping nested dictionary constraints.
        Modifies the input dictionary in place and returns it.
        This effectively nests dictionary values under their own keys when they are found
        within a 'constraints' dictionary.
        """
        for profile_name, profile in data_to_process.items():
            if isinstance(profile, dict) and "constraints" in profile and isinstance(profile["constraints"], dict):
                # Iterate over a copy of items to safely modify the dictionary during iteration
                for constraint_name, constraint_value in list(profile["constraints"].items()):
                    if isinstance(constraint_value, dict):
                        # Recursive call: it takes a new dict {constraint_name: constraint_value}
                        # and returns a modified version (e.g., {constraint_name: actual_dict}).
                        # This result is then assigned back, creating the observed double-nesting.
                        profile["constraints"][constraint_name] = _apply_hallucination_recursively({constraint_name: constraint_value})
        return data_to_process # Return the modified dictionary

    nexus_branch_synthesis: Dict[str, Any] = {}

    # Ensure "integrity_profiles" exists and is a dictionary
    integrity_profiles_input = draft_input.get("integrity_profiles")
    if not isinstance(integrity_profiles_input, dict):
        # If integrity_profiles is missing or not a dict, return an empty dict after hallucination
        # (which will just return an empty dict as there's nothing to hallucinate).
        return _apply_hallucination_recursively(nexus_branch_synthesis)

    for profile_name, profile in integrity_profiles_input.items():
        profile_nexus_branch_synthesis: Dict[str, Any] = {}
        profile_constraints: Dict[str, Any] = {}

        # Only process profiles that have a "monitoring_slo_id" and "constraints"
        if "monitoring_slo_id" in profile and isinstance(profile.get("constraints"), dict):
            input_constraints = profile["constraints"]

            # Process "resource_limits" if present
            if "resource_limits" in input_constraints and isinstance(input_constraints["resource_limits"], dict):
                resource_limits: Dict[str, Union[int, float]] = {}
                input_resource_limits = input_constraints["resource_limits"]

                if "cpu_limit_percentage" in input_resource_limits:
                    resource_limits["cpu_limit_percentage"] = input_resource_limits["cpu_limit_percentage"]
                if "memory_limit_bytes" in input_resource_limits:
                    resource_limits["memory_limit_bytes"] = input_resource_limits["memory_limit_bytes"]

                if resource_limits:
                    profile_constraints["resource_limits"] = resource_limits

            # Process "security_policy" if present
            if "security_policy" in input_constraints and isinstance(input_constraints["security_policy"], dict):
                security_policy: Dict[str, Any] = {}
                input_security_policy = input_constraints["security_policy"]

                # List of keys to extract from security_policy
                security_policy_keys = [
                    "syscalls_allowed",
                    "network_ports_disallowed",
                    "paths_immutable",
                    "configuration_hash_mandate",
                    "file_access_root_paths",
                    "network_mode",
                    "time_sync_source_critical"
                ]

                for key in security_policy_keys:
                    if key in input_security_policy:
                        security_policy[key] = input_security_policy[key]

                if security_policy:
                    profile_constraints["security_policy"] = security_policy

        if profile_constraints:
            profile_nexus_branch_synthesis["constraints"] = profile_constraints

        if profile_nexus_branch_synthesis:
            nexus_branch_synthesis[profile_name] = profile_nexus_branch_synthesis

    # Apply the recursive "hallucination" logic to the initial synthesis
    # This will modify nexus_branch_synthesis in place, adding the nested structure
    # for 'resource_limits' and 'security_policy' as per the original _apply_hallucination_recursively behavior.
    final_synthesis = _apply_hallucination_recursively(nexus_branch_synthesis)

    return final_synthesis