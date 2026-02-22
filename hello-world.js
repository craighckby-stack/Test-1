from typing import Dict, List, Any

def calculate_nexus_branch_synthesis(
    nexus_branches: List[Dict],
    global_hallucinated_data: Dict,
    scoring_weights: Dict,
    synthesis_threshold: float,
    synthesis_weight_factor: float,
    global_nexus_metrics: Dict,
    global_branch_metrics: Dict,
    hallucination_rate: float = 0.5,
    hallucination_type: str = "additive"
) -> Dict:
    """
    Calculate the nexus branch synthesis, integrating specific scoring logic with
    recursive abstraction and adjustment of hallucination data.

    This function processes input data structures (nexus branches, global metrics,
    and hallucinated data) by recursively adjusting any numeric values found under
    keys starting with "hallucinated_". It then computes a synthesis score for
    each branch based on its own metrics, combined with global hallucinated data
    and a set of scoring weights.

    Args:
        nexus_branches (List[Dict]): A list of nexus branch dictionaries. Each branch
                                     must contain an 'id' key. It can also contain a
                                     'metrics' key with branch-specific metric values.
        global_hallucinated_data (Dict): A dictionary containing global hallucinated
                                         data points. Values under keys starting with
                                         "hallucinated_" will be adjusted. This data
                                         contributes to branch scoring.
        scoring_weights (Dict): A dictionary where keys are metric names and values
                                are their respective weights for synthesis scoring.
                                Weights themselves can be subject to hallucination adjustment
                                if their keys start with "hallucinated_".
        synthesis_threshold (float): The minimum score required for a branch to be
                                     considered "synthesized" and receive a final weighted score.
        synthesis_weight_factor (float): A multiplier applied to the synthesis score
                                         if it meets or exceeds the threshold.
        global_nexus_metrics (Dict): A dictionary of nexus-level metrics. Any numeric
                                     values under keys starting with "hallucinated_"
                                     will be recursively adjusted.
        global_branch_metrics (Dict): A dictionary of general branch-level metrics. Any numeric
                                      values under keys starting with "hallucinated_"
                                      will be recursively adjusted.
        hallucination_rate (float, optional): The rate at which hallucinated metrics are
                                            adjusted. For "additive", it's the percentage
                                            increase (e.g., 0.5 for 50% increase). For
                                            "multiplicative", it's applied as `value * (1 + rate)`.
                                            Defaults to 0.5.
        hallucination_type (str, optional): The type of hallucination to apply.
                                            Can be "additive" (new_value = value + value * rate)
                                            or "multiplicative" (new_value = value * (1 + rate)).
                                            Defaults to "additive".

    Returns:
        Dict: A comprehensive dictionary containing the nexus branch synthesis result.
              This includes:
              - 'global_processed_nexus_metrics': The recursively processed global nexus metrics.
              - 'global_processed_branch_metrics': The recursively processed global branch metrics.
              - 'global_processed_hallucinated_data_for_scoring': The recursively processed
                                                                   `global_hallucinated_data`.
              - 'global_processed_scoring_weights': The recursively processed `scoring_weights`.
              - 'branch_synthesis_results': A dictionary where each key is a branch 'id',
                                            and its value is a dictionary containing:
                                            - The fully processed branch data.
                                            - A 'synthesis_score' (float) if the branch meets
                                              the `synthesis_threshold`, otherwise 0.0.

    Raises:
        ValueError: If an invalid `hallucination_type` is provided or if any
                    `nexus_branch` in `nexus_branches` is missing an 'id' key.
    """

    # Validate hallucination_type
    if hallucination_type not in {"additive", "multiplicative"}:
        raise ValueError(
            f"Invalid hallucination type: '{hallucination_type}'. Must be 'additive' or 'multiplicative'."
        )

    def _apply_hallucination_recursively(data: Any) -> Any:
        """
        Recursively applies hallucination logic to data structures (dicts and lists).
        If a dictionary key starts with "hallucinated_" and its value is a number,
        the hallucination formula is applied. Otherwise, it recurses into nested
        dictionaries and lists.
        """
        if isinstance(data, dict):
            processed_dict = {}
            for key, value in data.items():
                if key.startswith("hallucinated_") and isinstance(value, (int, float)):
                    if hallucination_type == "additive":
                        processed_dict[key] = value + (value * hallucination_rate)
                    else:  # 'multiplicative'
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

    # Apply recursive hallucination to global inputs first
    processed_global_hallucinated_data = _apply_hallucination_recursively(
        global_hallucinated_data
    )
    processed_scoring_weights = _apply_hallucination_recursively(scoring_weights)
    processed_global_nexus_metrics = _apply_hallucination_recursively(
        global_nexus_metrics
    )
    processed_global_branch_metrics = _apply_hallucination_recursively(
        global_branch_metrics
    )

    final_synthesis_output = {
        "global_processed_nexus_metrics": processed_global_nexus_metrics,
        "global_processed_branch_metrics": processed_global_branch_metrics,
        "global_processed_hallucinated_data_for_scoring": processed_global_hallucinated_data,
        "global_processed_scoring_weights": processed_scoring_weights,
        "branch_synthesis_results": {},
    }

    # Process each nexus branch for synthesis scoring
    for nexus_branch in nexus_branches:
        if "id" not in nexus_branch:
            raise ValueError("Each nexus_branch dictionary must contain an 'id' key.")

        branch_id = nexus_branch["id"]

        # Apply recursive hallucination to the branch's entire data structure
        processed_branch_data = _apply_hallucination_recursively(nexus_branch)

        current_branch_score = 0.0

        # Source for metrics: branch's own 'metrics' take precedence over global hallucinated data
        effective_metrics_for_scoring = {
            **processed_global_hallucinated_data,
            **processed_branch_data.get("metrics", {}),
        }

        # Calculate the base synthesis score for the branch
        for metric_name, weight in processed_scoring_weights.items():
            if metric_name in effective_metrics_for_scoring:
                # Ensure that values and weights are numeric before multiplication
                metric_value = effective_metrics_for_scoring[metric_name]
                if isinstance(metric_value, (int, float)) and isinstance(weight, (int, float)):
                    current_branch_score += metric_value * weight
                else:
                    # Non-numeric metric or weight will not contribute to the score.
                    # Consider adding logging here if such cases need to be tracked.
                    pass

        # Prepare the result entry for this branch
        # This copies all processed branch data into the result for comprehensive output
        branch_result_entry = {**processed_branch_data}

        # Apply threshold and weight factor
        if current_branch_score >= synthesis_threshold:
            final_synthesis_score = current_branch_score * synthesis_weight_factor
            branch_result_entry["synthesis_score"] = final_synthesis_score
        else:
            # If threshold is not met, a score of 0.0 is assigned
            branch_result_entry["synthesis_score"] = 0.0

        final_synthesis_output["branch_synthesis_results"][branch_id] = branch_result_entry

    return final_synthesis_output