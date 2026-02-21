def calculate_nexus_branch_synthesis(hallucination_data: dict) -> dict:
    """
    Synthesizes a "nexus" score and detailed report for a given hallucination
    based on its characteristics, content, impact, and associated factors,
    as described by the Hallucination Schema.

    This function quantifies qualitative descriptions into numerical scores
    to provide a consolidated view of the hallucination's severity and impact.

    Args:
        hallucination_data (dict): A dictionary structured according to the
                                   Hallucination Schema, containing details
                                   about a specific hallucination event.

    Returns:
        dict: A dictionary containing:
            - 'characteristics_score': Numerical score based on intensity, frequency, duration.
            - 'content_score': Numerical score based on content specificity and emotional tone.
            - 'impact_score': Numerical score based on disruption, distress, and interference.
            - 'overall_nexus_score': A weighted sum of the above scores, representing overall severity.
            - 'synthesis_report': A multi-line string summarizing the analysis and interpretation.
            - Extracted key data points from the input schema.
    """

    # Mapping dictionaries to convert descriptive strings to numerical values.
    # Higher values generally indicate greater severity, impact, or prominence.
    intensity_map = {"mild": 1, "moderate": 3, "severe": 5}
    frequency_map = {"occasional": 1, "frequent": 3, "constant": 5}
    duration_map = {"brief": 1, "prolonged": 4}  # Prolonged duration often implies greater impact
    specificity_map = {"vague": 1, "specific": 2, "detailed": 3} # Detailed content can be more vivid
    disruption_map = {"minimal": 1, "moderate": 3, "significant": 5}
    distress_map = {"mild": 1, "moderate": 3, "severe": 5}
    interference_map = {"minimal": 1, "moderate": 3, "significant": 5}

    # Initialize scores
    characteristics_score = 0
    content_score = 0
    impact_score = 0
    overall_nexus_score = 0
    synthesis_report_lines = []

    # --- Process Characteristics ---
    characteristics = hallucination_data.get("Characteristics", {})
    characteristics_score += intensity_map.get(characteristics.get("Intensity", "").lower(), 0)
    characteristics_score += frequency_map.get(characteristics.get("Frequency", "").lower(), 0)
    characteristics_score += duration_map.get(characteristics.get("Duration", "").lower(), 0)
    # Add a minor score for simply having a sensory modality mentioned, implying a concrete experience
    if characteristics.get("Sensory modality"):
        characteristics_score += 1

    # --- Process Content ---
    content = hallucination_data.get("Content", {})
    content_score += specificity_map.get(content.get("Specificity", "").lower(), 0)
    
    # Adjust content score based on emotional tone
    emotional_tone = content.get("Emotional tone", "").lower()
    if emotional_tone == "negative":
        content_score += 2  # Negative tone often increases perceived severity/distress
    elif emotional_tone == "positive":
        content_score -= 1  # Positive tone might reduce overall distress, hence lower score
    # Neutral tone adds no specific points

    # --- Process Impact ---
    impact = hallucination_data.get("Impact", {})
    impact_score += disruption_map.get(impact.get("Disruption", "").lower(), 0)
    impact_score += distress_map.get(impact.get("Distress", "").lower(), 0)
    impact_score += interference_map.get(impact.get("Interference", "").lower(), 0)

    # --- Calculate Overall Nexus Score ---
    # Assign weights to different branches of the schema.
    # Impact on daily life is often the most critical factor, hence higher weight.
    # Characteristics describe the experience itself, and Content describes its nature.
    overall_nexus_score = (characteristics_score * 0.3) + (content_score * 0.2) + (impact_score * 0.5)

    # --- Generate Synthesis Report ---
    synthesis_report_lines.append(f"Hallucination Category: {hallucination_data.get('Category', 'N/A')}")
    synthesis_report_lines.append(f"Subcategory: {hallucination_data.get('Subcategory', 'N/A')}")
    synthesis_report_lines.append(f"Content Type: {content.get('Type', 'N/A')} (Specificity: {content.get('Specificity', 'N/A')}, Tone: {content.get('Emotional tone', 'N/A')})")
    synthesis_report_lines.append(f"Calculated Characteristics Score: {characteristics_score:.2f}")
    synthesis_report_lines.append(f"Calculated Content Score: {content_score:.2f}")
    synthesis_report_lines.append(f"Calculated Impact Score: {impact_score:.2f}")
    synthesis_report_lines.append(f"Overall Nexus Synthesis Score: {overall_nexus_score:.2f}")

    # Provide a qualitative interpretation based on the overall score.
    # Thresholds are illustrative and would ideally be derived from clinical data.
    if overall_nexus_score >= 10:
        synthesis_report_lines.append("Interpretation: This hallucination indicates a HIGH level of distress and significant life impact. Urgent attention may be warranted.")
    elif overall_nexus_score >= 6:
        synthesis_report_lines.append("Interpretation: This hallucination indicates a MODERATE level of distress and notable impact on daily life.")
    else:
        synthesis_report_lines.append("Interpretation: This hallucination appears to have a LOW to minimal impact on daily life and distress level.")

    # Include associated factors if available and not 'N/A' or empty
    associated_factors = hallucination_data.get("Associated factors", {})
    triggers = associated_factors.get("Triggers", "N/A")
    conditions = associated_factors.get("Underlying conditions", "N/A")
    coping = associated_factors.get("Coping mechanisms", "N/A")

    if triggers and triggers.lower() != "n/a":
        synthesis_report_lines.append(f"Potential Triggers: {triggers}")
    if conditions and conditions.lower() != "n/a":
        synthesis_report_lines.append(f"Associated Conditions: {conditions}")
    if coping and coping.lower() != "n/a":
        synthesis_report_lines.append(f"Coping Mechanisms: {coping}")

    return {
        "characteristics_score": characteristics_score,
        "content_score": content_score,
        "impact_score": impact_score,
        "overall_nexus_score": overall_nexus_score,
        "synthesis_report": "\n".join(synthesis_report_lines),
        "category": hallucination_data.get("Category", "N/A"),
        "subcategory": hallucination_data.get("Subcategory", "N/A"),
        "content_type": content.get("Type", "N/A"),
        "emotional_tone": emotional_tone,
        "associated_triggers": triggers,
        "associated_conditions": conditions,
        "associated_coping_mechanisms": coping,
    }