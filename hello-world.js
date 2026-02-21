from typing import Dict, List, Any

def calculate_nexus_branch_synthesis(
    nexus_branches: List[Dict],
    nexus_metrics: Dict,
    branch_metrics: Dict,
    hallucination_rate: float = 0.5,
    hallucination_type: str = "additive"
) -> Dict:
    """
    Calculate the nexus branch synthesis by integrating hallucinated metrics,
    supporting recursive abstraction of hallucination data within branch metrics
    and top-level nexus/branch metrics.

    This function processes input data structures (nexus branches, global nexus metrics,
    and global branch metrics) and recursively applies a hallucination adjustment
    to any numeric values found under keys starting with "hallucinated_".

    Args:
        nexus_branches (List[Dict]): A list of nexus branch dictionaries. Each branch
                                     must contain an 'id' key to identify the branch
                                     in the output synthesis.
        nexus_metrics (Dict): A dictionary of nexus-level metrics, potentially containing
                              hallucinated data. These metrics are processed and included
                              under the "nexus_metrics" key in the output.
        branch_metrics (Dict): A dictionary of general branch-level metrics, potentially
                               containing hallucinated data. These metrics are processed
                               and included under the "branch_metrics" key in the output.
        hallucination_rate (float, optional): The rate at which hallucinated metrics are
                                            adjusted. For "additive", it's the percentage
                                            increase. For "multiplicative", it's applied
                                            as `value * (1 + rate)`. Defaults to 0.5.
        hallucination_type (str, optional): The type of hallucination to apply.
                                            Can be "additive" (value + value * rate)
                                            or "multiplicative" (value * (1 + rate)).
                                            Defaults to "additive".

    Returns:
        Dict: A dictionary containing the nexus branch synthesis. This includes:
              - Processed individual nexus branches, keyed by their 'id'.
              - Processed global 'nexus_metrics'.
              - Processed global 'branch_metrics'.
              All "hallucinated_" values within these structures will have been adjusted.

    Raises:
        ValueError: If an invalid `hallucination_type` is provided or if any
                    `nexus_branch` in `nexus_branches` is missing an 'id' key.
    """

    # Validate hallucination_type once at the beginning
    if hallucination_type not in {"additive", "multiplicative"}:
        raise ValueError(f"Invalid hallucination type: '{hallucination_type}'. Must be 'additive' or 'multiplicative'.")

    def _apply_hallucination_recursively(data: Any) -> Any:
        """
        Recursively applies hallucination logic to data structures (dicts and lists).
        This nested helper function captures `hallucination_rate` and `hallucination_type`
        from the enclosing `calculate_nexus_branch_synthesis` function's scope.

        If a dictionary key starts with "hallucinated_" and its value is a number,
        the hallucination formula is applied. Otherwise, it recurses into nested
        dictionaries and lists.

        Args:
            data (Any): The data structure (dict, list, or scalar) to process.

        Returns:
            Any: The processed data structure with hallucinated metrics adjusted.
        """
        if isinstance(data, dict):
            processed_dict = {}
            for key, value in data.items():
                if key.startswith("hallucinated_") and isinstance(value, (int, float)):
                    if hallucination_type == "additive":
                        processed_dict[key] = value + (value * hallucination_rate)
                    else:  # 'multiplicative' - already validated by outer function
                        processed_dict[key] = value * (1 + hallucination_rate)
                elif isinstance(value, (dict, list)):
                    processed_dict[key] = _apply_hallucination_recursively(value)
                else:
                    processed_dict[key] = value
            return processed_dict
        elif isinstance(data, list):
            processed_list = []
            for item in data:
                processed_list.append(_apply_hallucination_recursively(item))
            return processed_list
        else:
            return data

    nexus_branch_synthesis = {}

    for nexus_branch in nexus_branches:
        if "id" not in nexus_branch:
            raise ValueError("Each nexus_branch dictionary must contain an 'id' key.")

        branch_id = nexus_branch["id"]

        # Create a copy of the branch data, excluding the 'id' itself from hallucination processing.
        # The 'id' is used as a key in the output, not a metric to be adjusted.
        branch_data_to_process = {k: v for k, v in nexus_branch.items() if k != "id"}

        # Apply recursive hallucination to the branch-specific metrics
        processed_branch_data = _apply_hallucination_recursively(branch_data_to_process)

        nexus_branch_synthesis[branch_id] = processed_branch_data

    # Apply recursive hallucination to the global nexus metrics
    nexus_branch_synthesis["nexus_metrics"] = _apply_hallucination_recursively(nexus_metrics)

    # Apply recursive hallucination to the global branch metrics
    nexus_branch_synthesis["branch_metrics"] = _apply_hallucination_recursively(branch_metrics)

    return nexus_branch_synthesis