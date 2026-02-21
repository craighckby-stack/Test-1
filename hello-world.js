from typing import Dict, List, Any

def _apply_hallucination_recursively(data: Any, hallucination_rate: float, hallucination_type: str) -> Any:
    """
    Recursively applies hallucination logic to data structures (dicts and lists).

    If a dictionary key starts with "hallucinated_" and its value is a number,
    the hallucination formula is applied. Otherwise, it recurses into nested
    dictionaries and lists.

    Args:
        data (Any): The data structure (dict, list, or scalar) to process.
        hallucination_rate (float): The rate at which hallucinated metrics are modified.
        hallucination_type (str): The type of hallucination ("additive" or "multiplicative").

    Returns:
        Any: The processed data structure with hallucinated metrics adjusted.
    """
    if isinstance(data, dict):
        processed_dict = {}
        for key, value in data.items():
            if key.startswith("hallucinated_") and isinstance(value, (int, float)):
                if hallucination_type == "additive":
                    processed_dict[key] = value + (value * hallucination_rate)
                elif hallucination_type == "multiplicative":
                    processed_dict[key] = value * (1 + hallucination_rate)
                else:
                    raise ValueError(f"Invalid hallucination type: {hallucination_type}. Must be 'additive' or 'multiplicative'.")
            elif isinstance(value, (dict, list)):
                processed_dict[key] = _apply_hallucination_recursively(value, hallucination_rate, hallucination_type)
            else:
                processed_dict[key] = value
        return processed_dict
    elif isinstance(data, list):
        processed_list = []
        for item in data:
            processed_list.append(_apply_hallucination_recursively(item, hallucination_rate, hallucination_type))
        return processed_list
    else:
        return data

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

    Args:
        nexus_branches (List[Dict]): A list of nexus branch dictionaries. Each branch
                                     must contain an 'id' key.
        nexus_metrics (Dict): A dictionary of nexus-level metrics, potentially containing
                              hallucinated data.
        branch_metrics (Dict): A dictionary of general branch-level metrics, potentially
                               containing hallucinated data.
        hallucination_rate (float, optional): The rate at which hallucinated metrics are
                                            adjusted. Defaults to 0.5.
        hallucination_type (str, optional): The type of hallucination to apply.
                                            Can be "additive" or "multiplicative".
                                            Defaults to "additive".

    Returns:
        Dict: A dictionary containing the nexus branch synthesis, with hallucinated
              metrics recursively processed.
    
    Raises:
        ValueError: If an invalid `hallucination_type` is provided or if any
                    `nexus_branch` is missing an 'id' key.
    """

    nexus_branch_synthesis = {}

    for nexus_branch in nexus_branches:
        if "id" not in nexus_branch:
            raise ValueError("Each nexus_branch dictionary must contain an 'id' key.")

        branch_id = nexus_branch["id"]
        
        # Create a copy of the branch data, excluding the 'id' itself from hallucination processing.
        # The 'id' is used as a key in the output, not a metric to be adjusted.
        branch_data_to_process = {k: v for k, v in nexus_branch.items() if k != "id"}

        # Apply recursive hallucination to the branch-specific metrics
        processed_branch_data = _apply_hallucination_recursively(
            branch_data_to_process,
            hallucination_rate,
            hallucination_type
        )
        
        nexus_branch_synthesis[branch_id] = processed_branch_data

    # Apply recursive hallucination to the global nexus metrics
    nexus_branch_synthesis["nexus_metrics"] = _apply_hallucination_recursively(
        nexus_metrics,
        hallucination_rate,
        hallucination_type
    )

    # Apply recursive hallucination to the global branch metrics
    nexus_branch_synthesis["branch_metrics"] = _apply_hallucination_recursively(
        branch_metrics,
        hallucination_rate,
        hallucination_type
    )

    return nexus_branch_synthesis