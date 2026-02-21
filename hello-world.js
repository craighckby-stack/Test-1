import collections

def calculate_nexus_branch_synthesis(hallucination_data: dict, weights: dict = None) -> float:
    """
    Calculates a "Nexus Branch Synthesis" score for a hallucination episode
    based on a structured schema.

    This function aggregates various properties, characteristics, context,
    impact, and history details of a hallucination into a single numerical score,
    representing its overall significance or potential severity.

    The score is determined by mapping categorical/ordinal inputs to numerical values
    and then applying weights. Higher numerical values and weights generally
    contribute to a higher synthesis score, indicating greater potential severity
    or clinical significance.

    Args:
        hallucination_data (dict): A dictionary structured according to the
                                   Hallucination Schema provided. Expected top-level keys
                                   are 'properties', 'characteristics', 'context',
                                   'impact', 'history'. Each sub-dictionary should
                                   contain specific details of the hallucination.
                                   Example structure:
                                   {
                                       "properties": {
                                           "type": "auditory",
                                           "intensity": "moderate",
                                           "frequency": "frequent",
                                           "duration": "prolonged",
                                           "trigger": "emotional state"
                                       },
                                       "characteristics": {
                                           "content": "whispering voices",
                                           "complexity": "complex",
                                           "emotional_valence": "negative",
                                           "cognitive_appraisal": "perceived threat"
                                       },
                                       "context": {
                                           "environmental_factors": ["noise"],
                                           "emotional_state": ["anxiety"],
                                           "sleep_patterns": "sleep deprivation",
                                           "medical_conditions": ["migraine"]
                                       },
                                       "impact": {
                                           "distress": "high",
                                           "disruption": "significant",
                                           "coping_mechanisms": ["distraction"]
                                       },
                                       "history": {
                                           "onset": "gradual",
                                           "duration": "chronic", # Note: this refers to 'Duration' under V. History
                                           "previous_episodes": {"frequency": "high", "severity": "moderate"}
                                       }
                                   }
        weights (dict, optional): A dictionary of custom weights to apply to
                                  different properties or categories. If None,
                                  default weights are used. The structure should
                                  mirror the main schema sections. E.g.,
                                  {"properties": {"intensity": 3.0}, "impact": {"distress": 4.0}}.
                                  Custom weights will override default weights.

    Returns:
        float: The calculated Nexus Branch Synthesis score.
    """

    # --- Default Mappings for Ordinal and Categorical Values ---
    # These mappings translate qualitative descriptions into numerical scores.
    # Higher numbers generally imply greater severity or significance.
    intensity_map = {"mild": 1, "moderate": 2, "severe": 3}
    frequency_map = {"occasional": 1, "frequent": 2, "continuous": 3}
    duration_properties_map = {"brief": 1, "prolonged": 2} # For I. Hallucination Properties -> Duration
    complexity_map = {"simple": 1, "complex": 2, "abstract": 3}
    emotional_valence_map = {"positive": -1, "neutral": 0, "negative": 1} # Negative valence increases score
    cognitive_appraisal_map = {"perceived reality": 2, "perceived threat": 3, "other": 1} # 'Other' is a fallback for unlisted
    distress_map = {"low": 1, "moderate": 2, "high": 3, "severe": 4}
    disruption_map = {"minor": 1, "moderate": 2, "significant": 3, "severe": 4}
    onset_map = {"sudden": 2, "gradual": 1}
    duration_history_map = {"acute": 1, "chronic": 2} # For V. Hallucination History -> Duration
    previous_episodes_frequency_map = {"none": 0, "low": 1, "moderate": 2, "high": 3}
    previous_episodes_severity_map = {"none": 0, "mild": 1, "moderate": 2, "severe": 3}

    # Contextual factors that simply indicate presence/absence or a state
    sleep_patterns_map = {"sleep deprivation": 1.5, "poor quality": 1.0, "normal": 0.0} # Assign higher score for more problematic sleep

    # --- Default Weights for each attribute ---
    # These weights determine how much each numerical value contributes to the total score.
    # Can be overridden by the 'weights' argument.
    default_weights = {
        "properties": {
            "type": 0.2, # Basic presence/type contributes a little
            "intensity": 2.5,
            "frequency": 1.8,
            "duration": 1.2, # Corresponds to duration_properties_map
            "trigger": 0.3, # Simple presence of a trigger
        },
        "characteristics": {
            "complexity": 1.0,
            "emotional_valence": 1.7,
            "cognitive_appraisal": 2.2,
            "content": 0.0 # Content is descriptive, not directly scored numerically without NLP or specific rules
        },
        "context": {
            "environmental_factors_count": 0.5, # Weight per factor present
            "emotional_state_count": 0.7,      # Weight per state present
            "sleep_patterns": 1.3,
            "medical_conditions_count": 1.8,   # Weight per condition present
        },
        "impact": {
            "distress": 3.0,
            "disruption": 2.5,
            "coping_mechanisms_count": -0.8, # Effective coping *reduces* the overall score
        },
        "history": {
            "onset": 0.8,
            "duration": 1.5, # Corresponds to duration_history_map (V. History -> Duration)
            "previous_episodes_frequency": 1.0,
            "previous_episodes_severity": 1.5,
        }
    }

    # Merge default weights with custom weights if provided
    current_weights = {}
    for section, section_weights in default_weights.items():
        if isinstance(section_weights, dict):
            current_weights[section] = section_weights.copy() # Deep copy for nested dicts
        else:
            current_weights[section] = section_weights # Copy scalar values

    if weights:
        for section, section_weights_override in weights.items():
            if section in current_weights and isinstance(current_weights[section], dict) and isinstance(section_weights_override, dict):
                current_weights[section].update(section_weights_override) # Update inner dict
            else:
                current_weights[section] = section_weights_override # Overwrite if not a dict or new section

    total_score = 0.0

    # --- I. Hallucination Properties ---
    props = hallucination_data.get("properties", {})
    # Type: simply add score for presence
    total_score += (1 if props.get("type") else 0) * current_weights["properties"].get("type", 0.0)
    total_score += intensity_map.get(props.get("intensity", "mild"), 0) * current_weights["properties"].get("intensity", 0.0)
    total_score += frequency_map.get(props.get("frequency", "occasional"), 0) * current_weights["properties"].get("frequency", 0.0)
    total_score += duration_properties_map.get(props.get("duration", "brief"), 0) * current_weights["properties"].get("duration", 0.0)
    # Trigger: simply add score for presence
    total_score += (1 if props.get("trigger") else 0) * current_weights["properties"].get("trigger", 0.0)

    # --- II. Hallucination Characteristics ---
    chars = hallucination_data.get("characteristics", {})
    total_score += complexity_map.get(chars.get("complexity", "simple"), 0) * current_weights["characteristics"].get("complexity", 0.0)
    total_score += emotional_valence_map.get(chars.get("emotional_valence", "neutral"), 0) * current_weights["characteristics"].get("emotional_valence", 0.0)
    total_score += cognitive_appraisal_map.get(chars.get("cognitive_appraisal", "other"), 0) * current_weights["characteristics"].get("cognitive_appraisal", 0.0)
    # Content is descriptive, not directly scored numerically here without NLP or specific rules
    # total_score += (1 if chars.get("content") else 0) * current_weights["characteristics"].get("content", 0.0)

    # --- III. Hallucination Context ---
    context = hallucination_data.get("context", {})
    total_score += len(context.get("environmental_factors", [])) * current_weights["context"].get("environmental_factors_count", 0.0)
    total_score += len(context.get("emotional_state", [])) * current_weights["context"].get("emotional_state_count", 0.0)
    total_score += sleep_patterns_map.get(context.get("sleep_patterns", "normal"), 0.0) * current_weights["context"].get("sleep_patterns", 0.0)
    total_score += len(context.get("medical_conditions", [])) * current_weights["context"].get("medical_conditions_count", 0.0)

    # --- IV. Hallucination Impact ---
    impact = hallucination_data.get("impact", {})
    total_score += distress_map.get(impact.get("distress", "low"), 0) * current_weights["impact"].get("distress", 0.0)
    total_score += disruption_map.get(impact.get("disruption", "minor"), 0) * current_weights["impact"].get("disruption", 0.0)
    # Coping mechanisms count as negative contribution if present (implying 'management' is happening)
    total_score += len(impact.get("coping_mechanisms", [])) * current_weights["impact"].get("coping_mechanisms_count", 0.0)

    # --- V. Hallucination History ---
    history = hallucination_data.get("history", {})
    total_score += onset_map.get(history.get("onset", "gradual"), 0) * current_weights["history"].get("onset", 0.0)
    # Note: 'duration' in history refers to V. History -> Duration
    total_score += duration_history_map.get(history.get("duration", "acute"), 0) * current_weights["history"].get("duration", 0.0)
    
    previous_episodes = history.get("previous_episodes", {})
    prev_freq = previous_episodes.get("frequency", "none")
    prev_sev = previous_episodes.get("severity", "none")
    total_score += previous_episodes_frequency_map.get(prev_freq, 0) * current_weights["history"].get("previous_episodes_frequency", 0.0)
    total_score += previous_episodes_severity_map.get(prev_sev, 0) * current_weights["history"].get("previous_episodes_severity", 0.0)

    return total_score