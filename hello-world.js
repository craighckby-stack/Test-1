import enum
from typing import Dict, List, Any, Union, Optional

class HallucinationType(enum.Enum):
    """Enumeration for different types of hallucinations."""
    VISUAL = "visual"
    AUDITORY = "auditory"
    TACTILE = "tactile"
    OLFACTORY = "olfactory"
    GUSTATORY = "gustatory"

class HallucinationFrequency(enum.Enum):
    """Enumeration for the frequency of hallucinations."""
    RARE = "rare"
    OCCASIONAL = "occasional"
    FREQUENT = "frequent"
    CONSTANT = "constant"

class HallucinationDuration(enum.Enum):
    """Enumeration for a qualitative description of hallucination duration."""
    SHORT = "short"  # e.g., seconds
    MEDIUM = "medium" # e.g., minutes
    LONG = "long"    # e.g., extended periods

def calculate_nexus_branch_synthesis(
    hallucination_data: Dict[str, Any]
) -> Dict[str, Union[float, str]]:
    """
    Calculates a synthesized analysis score and a summary based on structured
    hallucination data. This function processes various aspects of a hallucination
    to derive a "Distress Severity Score" and a textual summary.

    The scoring is heuristic and designed for demonstration purposes,
    assigning weights to different characteristics.

    Args:
        hallucination_data: A dictionary representing the structured hallucination
                            schema, as described below:

            {
                "hallucination_type": str (e.g., "visual", "auditory"),
                "hallucination_characteristics": {
                    "intensity": int,          # 1-10 scale (1=low, 10=high)
                    "duration": str,           # "short", "medium", "long"
                    "frequency": str,          # "rare", "occasional", "frequent", "constant"
                    "trigger": List[str]       # e.g., ["stress", "sleep deprivation"]
                },
                "emotional_and_cognitive_aspects": {
                    "emotional_response": List[str], # e.g., ["fear", "anxiety", "joy"]
                    "cognitive_appraisal": str,      # User's interpretation
                    "distress": int                  # 1-10 scale (1=low, 10=high)
                },
                "context_and_environment": {
                    "setting": str,
                    "social_context": str
                },
                "impact_and_consequences": {
                    "impact_on_daily_life": List[str], # e.g., ["sleep disturbance", "difficulty concentrating"]
                    "consequences": List[str]          # e.g., ["increased anxiety levels"]
                }
            }

    Returns:
        A dictionary containing:
            "distress_severity_score": A float representing the calculated
                                       distress severity. Higher values indicate
                                       greater distress.
            "synthesis_summary": A string providing a brief textual summary
                                 of the hallucination's characteristics and impact.
    """

    distress_score: float = 0.0
    summary_parts: List[str] = []

    # --- 1. Process Hallucination Characteristics ---
    characteristics = hallucination_data.get("hallucination_characteristics", {})

    # Intensity (direct correlation)
    intensity = characteristics.get("intensity", 0)
    distress_score += intensity * 0.8
    if intensity > 7:
        summary_parts.append(f"a highly intense {hallucination_data.get('hallucination_type', 'unknown')} hallucination")
    elif intensity > 4:
        summary_parts.append(f"a moderately intense {hallucination_data.get('hallucination_type', 'unknown')} hallucination")
    else:
        summary_parts.append(f"a low intensity {hallucination_data.get('hallucination_type', 'unknown')} hallucination")

    # Duration
    duration_str = characteristics.get("duration", HallucinationDuration.MEDIUM.value)
    if duration_str == HallucinationDuration.SHORT.value:
        distress_score += 1.0
        summary_parts.append("of short duration")
    elif duration_str == HallucinationDuration.MEDIUM.value:
        distress_score += 3.0
        summary_parts.append("of medium duration")
    elif duration_str == HallucinationDuration.LONG.value:
        distress_score += 5.0
        summary_parts.append("of long duration")

    # Frequency
    frequency_str = characteristics.get("frequency", HallucinationFrequency.OCCASIONAL.value)
    if frequency_str == HallucinationFrequency.RARE.value:
        distress_score += 1.0
        summary_parts.append("occurring rarely")
    elif frequency_str == HallucinationFrequency.OCCASIONAL.value:
        distress_score += 3.0
        summary_parts.append("occurring occasionally")
    elif frequency_str == HallucinationFrequency.FREQUENT.value:
        distress_score += 6.0
        summary_parts.append("occurring frequently")
    elif frequency_str == HallucinationFrequency.CONSTANT.value:
        distress_score += 10.0
        summary_parts.append("which is constant")

    # Triggers
    triggers = characteristics.get("trigger", [])
    if triggers:
        summary_parts.append(f"triggered by {', '.join(triggers)}")

    # --- 2. Process Emotional and Cognitive Aspects ---
    emotions_cognition = hallucination_data.get("emotional_and_cognitive_aspects", {})

    # Emotional Response
    emotional_responses = emotions_cognition.get("emotional_response", [])
    negative_emotions_count = 0
    positive_emotions_count = 0
    for emotion in emotional_responses:
        lower_emotion = emotion.lower()
        if lower_emotion in ["fear", "anxiety", "distress", "panic", "anger", "sadness"]:
            distress_score += 2.5
            negative_emotions_count += 1
        elif lower_emotion in ["joy", "calm", "curiosity", "neutral"]:
            distress_score -= 1.0 # Reduce score for positive/neutral emotions
            positive_emotions_count += 1
    if negative_emotions_count > 0:
        summary_parts.append(f"eliciting negative emotions such as {', '.join(emotional_responses)}")
    elif positive_emotions_count > 0:
        summary_parts.append(f"eliciting {', '.join(emotional_responses)} and causing less distress")

    # Distress (self-reported)
    self_reported_distress = emotions_cognition.get("distress", 0)
    distress_score += self_reported_distress * 1.2 # Higher weight for direct distress
    if self_reported_distress > 7:
        summary_parts.append("causing significant self-reported distress")
    elif self_reported_distress > 4:
        summary_parts.append("causing moderate self-reported distress")

    # --- 3. Process Impact and Consequences ---
    impact_consequences = hallucination_data.get("impact_and_consequences", {})

    # Impact on Daily Life
    daily_impacts = impact_consequences.get("impact_on_daily_life", [])
    if daily_impacts:
        summary_parts.append(f"with impacts on daily life including {', '.join(daily_impacts)}")
        for impact in daily_impacts:
            lower_impact = impact.lower()
            if "sleep disturbance" in lower_impact:
                distress_score += 3.0
            if "difficulty concentrating" in lower_impact or "work/academic impairment" in lower_impact:
                distress_score += 4.0
            if "impaired relationships" in lower_impact or "social withdrawal" in lower_impact:
                distress_score += 5.0
            # Generic impact
            distress_score += 1.0

    # Consequences
    consequences = impact_consequences.get("consequences", [])
    if consequences:
        summary_parts.append(f"leading to consequences like {', '.join(consequences)}")
        for consequence in consequences:
            lower_consequence = consequence.lower()
            if "increased anxiety levels" in lower_consequence or "depression" in lower_consequence:
                distress_score += 3.5
            if "physical symptoms" in lower_consequence:
                distress_score += 2.5
            if "seeking professional help" in lower_consequence:
                distress_score += 1.0 # Indicates distress but also active coping

    # --- Final Score Adjustment and Clamping ---
    # Max theoretical score can be very high, let's normalize it a bit or cap it
    max_possible_distress = (10 * 0.8) + 5 + 10 + (2.5 * 6) + (10 * 1.2) + (5 * 4) + (3.5 * 3) # Roughly ~100+
    distress_score = max(0.0, distress_score) # Ensure score is not negative
    distress_score = min(distress_score, max_possible_distress) # Cap at theoretical max if desired

    # Scale the score to a more manageable range, e.g., 0-100
    scaled_distress_severity = (distress_score / max_possible_distress) * 100.0 if max_possible_distress > 0 else 0.0

    # --- Generate Summary ---
    final_summary = "This is " + " and ".join(summary_parts) + "."
    final_summary = final_summary.replace("This is  and ", "This is ") # Clean up if first element is empty

    return {
        "distress_severity_score": round(scaled_distress_severity, 2),
        "synthesis_summary": final_summary
    }

if __name__ == '__main__':
    # Example 1: High distress hallucination
    example_hallucination_high_distress = {
        "hallucination_type": HallucinationType.AUDITORY.value,
        "hallucination_characteristics": {
            "intensity": 9,
            "duration": HallucinationDuration.LONG.value,
            "frequency": HallucinationFrequency.CONSTANT.value,
            "trigger": ["stress", "lack of sleep"]
        },
        "emotional_and_cognitive_aspects": {
            "emotional_response": ["fear", "anxiety", "panic"],
            "cognitive_appraisal": "These voices are real and threatening me.",
            "distress": 10
        },
        "context_and_environment": {
            "setting": "Anywhere, but worse at home",
            "social_context": "Alone, but sometimes in public too"
        },
        "impact_and_consequences": {
            "impact_on_daily_life": ["sleep disturbance", "difficulty concentrating", "social withdrawal", "work/academic impairment"],
            "consequences": ["increased anxiety levels", "paranoid thoughts", "seeking professional help"]
        }
    }

    # Example 2: Low distress hallucination
    example_hallucination_low_distress = {
        "hallucination_type": HallucinationType.VISUAL.value,
        "hallucination_characteristics": {
            "intensity": 2,
            "duration": HallucinationDuration.SHORT.value,
            "frequency": HallucinationFrequency.RARE.value,
            "trigger": ["medication side effect"]
        },
        "emotional_and_cognitive_aspects": {
            "emotional_response": ["curiosity", "neutral"],
            "cognitive_appraisal": "Just a fleeting image, probably the medication.",
            "distress": 1
        },
        "context_and_environment": {
            "setting": "Reading a book",
            "social_context": "Alone"
        },
        "impact_and_consequences": {
            "impact_on_daily_life": [],
            "consequences": []
        }
    }

    # Example 3: Mixed distress hallucination (tactile)
    example_hallucination_mixed_distress = {
        "hallucination_type": HallucinationType.TACTILE.value,
        "hallucination_characteristics": {
            "intensity": 6,
            "duration": HallucinationDuration.MEDIUM.value,
            "frequency": HallucinationFrequency.OCCASIONAL.value,
            "trigger": ["fatigue"]
        },
        "emotional_and_cognitive_aspects": {
            "emotional_response": ["unease", "frustration"],
            "cognitive_appraisal": "This sensation is annoying, but I know it's not real.",
            "distress": 6
        },
        "context_and_environment": {
            "setting": "Working at a desk",
            "social_context": "Family around, but they don't notice"
        },
        "impact_and_consequences": {
            "impact_on_daily_life": ["difficulty concentrating"],
            "consequences": ["mild increased anxiety"]
        }
    }

    print("--- High Distress Hallucination Analysis ---")
    result_high = calculate_nexus_branch_synthesis(example_hallucination_high_distress)
    print(f"Distress Severity Score: {result_high['distress_severity_score']:.2f}")
    print(f"Summary: {result_high['synthesis_summary']}\n")

    print("--- Low Distress Hallucination Analysis ---")
    result_low = calculate_nexus_branch_synthesis(example_hallucination_low_distress)
    print(f"Distress Severity Score: {result_low['distress_severity_score']:.2f}")
    print(f"Summary: {result_low['synthesis_summary']}\n")

    print("--- Mixed Distress Hallucination Analysis ---")
    result_mixed = calculate_nexus_branch_synthesis(example_hallucination_mixed_distress)
    print(f"Distress Severity Score: {result_mixed['distress_severity_score']:.2f}")
    print(f"Summary: {result_mixed['synthesis_summary']}\n")