import enum
from typing import Dict, List, Any, Union

# Define Enums for structured data, mapping directly to schema concepts for consistency and validation.
class HallucinationType(enum.Enum):
    """Enumeration for the types of hallucinations."""
    VISUAL = "Visual Hallucinations"
    AUDITORY = "Auditory Hallucinations"
    TACTILE = "Tactile Hallucinations"
    OLFACTORY = "Olfactory Hallucinations"
    GUSTATORY = "Gustatory Hallucinations"

class FrequencyLevel(enum.Enum):
    """Enumeration for the frequency of hallucinations."""
    RARE = "Rare"
    OCCASIONAL = "Occasional"
    FREQUENT = "Frequent"
    CONSTANT = "Constant"

class DurationLevel(enum.Enum):
    """Enumeration for the duration of hallucinations."""
    SECONDS = "Seconds"
    MINUTES = "Minutes"
    HOURS = "Hours"
    PROLONGED = "Prolonged" # Added for potentially long-lasting or indeterminate durations

class CognitiveState(enum.Enum):
    """Enumeration for the cognitive state during hallucinations."""
    CLEAR = "Clear"
    MILDLY_IMPAIRED = "Mildly Impaired"
    IMPAIRED_ATTENTION = "Impaired attention, difficulty concentrating"
    DISORIENTED = "Disoriented"

# Scoring weights: These can be adjusted to fine-tune the 'synthesis_score'
# based on the relative importance of each factor for a comprehensive assessment.
FREQUENCY_WEIGHTS = {
    FrequencyLevel.RARE: 0.5,
    FrequencyLevel.OCCASIONAL: 1.5,
    FrequencyLevel.FREQUENT: 3.0,
    FrequencyLevel.CONSTANT: 5.0,
}

DURATION_WEIGHTS = {
    DurationLevel.SECONDS: 0.5,
    DurationLevel.MINUTES: 1.5,
    DurationLevel.HOURS: 3.0,
    DurationLevel.PROLONGED: 5.0,
}

# Negative emotional states generally contribute more to the synthesis score.
# Values for emotions not listed will default to 0.0 impact.
EMOTIONAL_IMPACT_WEIGHTS = {
    "Anxious": 1.5, "Scared": 2.0, "Distressed": 1.8, "Panicked": 2.5, "Agitated": 1.5,
    "Irritable": 1.0, "Frustrated": 0.8, "Confused": 1.2, "Fear": 2.2,
    "Calm": 0.0, "Neutral": 0.0, "Curious": 0.2, # Neutral/positive states have minimal impact
}

COGNITIVE_IMPACT_WEIGHTS = {
    CognitiveState.CLEAR: 0.0,
    CognitiveState.MILDLY_IMPAIRED: 1.0,
    CognitiveState.IMPAIRED_ATTENTION: 2.5,
    CognitiveState.DISORIENTED: 4.0,
}

MOTOR_SYMPTOM_WEIGHT = 0.75 # Each identified motor symptom adds this much to the score.
TRIGGER_FACTOR_WEIGHT = 1.0 # Each identified trigger factor (environmental, medical, psychological) adds this much.

def calculate_nexus_branch_synthesis(hallucination_data: Dict[str, Any]) -> Dict[str, Union[float, str]]:
    """
    Calculates a 'nexus branch synthesis' score and categorization for a given hallucination
    based on the provided Hallucination Schema.

    This function processes the detailed attributes of a hallucination to yield a quantitative
    score and a qualitative summary, reflecting its complexity, impact, and associated factors.

    Args:
        hallucination_data (Dict[str, Any]): A dictionary containing comprehensive details of
                                             a hallucination, structured according to the Hallucination Schema.
                                             Expected top-level keys:
                                             - 'type': str (e.g., "Visual Hallucinations")
                                             - 'characteristics': Dict (intensity, frequency, duration, location, content)
                                             - 'associated_symptoms': Dict (emotional_state, cognitive_state, motor_symptoms)
                                             - 'context_and_triggers': Dict (environmental_factors, medical_history, psychological_factors)

    Returns:
        Dict[str, Union[float, str]]: A dictionary containing:
                                      - 'synthesis_score': A numerical score representing the overall complexity/severity.
                                      - 'assessment_category': A categorical label (e.g., "Mild", "Severe").
                                      - 'qualitative_summary': A detailed textual summary of the hallucination's analysis.
    """
    synthesis_score = 0.0
    qualitative_assessment = []

    # --- I. Type of Hallucination ---
    hallucination_type_str = hallucination_data.get("type", "Unknown Hallucinations")
    try:
        hallucination_type = HallucinationType(hallucination_type_str)
        qualitative_assessment.append(f"Type: {hallucination_type.value}")
        # Note: Hallucination type itself doesn't directly add to the score by default,
        # but could be assigned a base weight if different types imply different baseline severity.
    except ValueError:
        qualitative_assessment.append(f"Type: Invalid or unknown hallucination type ('{hallucination_type_str}').")
        synthesis_score += 1.0 # Small penalty for unclear or invalid data.

    # --- II. Characteristics of the Hallucination ---
    characteristics = hallucination_data.get("characteristics", {})
    intensity = characteristics.get("intensity", 0) # Expected: int, typically on a scale like 1-10
    frequency_str = characteristics.get("frequency", "")
    duration_str = characteristics.get("duration", "")
    location = characteristics.get("location", "Undetermined")
    content = characteristics.get("content", "No specific content described.")

    # Intensity directly contributes to the score.
    synthesis_score += intensity
    qualitative_assessment.append(f"Intensity: {intensity}/10 (score add: {intensity:.1f})")

    # Frequency contributes based on predefined weights.
    try:
        frequency = FrequencyLevel(frequency_str)
        freq_score = FREQUENCY_WEIGHTS.get(frequency, 0.0)
        synthesis_score += freq_score
        qualitative_assessment.append(f"Frequency: {frequency.value} (score add: {freq_score:.1f})")
    except ValueError:
        qualitative_assessment.append(f"Frequency: Invalid level '{frequency_str}'.")

    # Duration contributes based on predefined weights.
    try:
        duration = DurationLevel(duration_str)
        duration_score = DURATION_WEIGHTS.get(duration, 0.0)
        synthesis_score += duration_score
        qualitative_assessment.append(f"Duration: {duration.value} (score add: {duration_score:.1f})")
    except ValueError:
        qualitative_assessment.append(f"Duration: Invalid level '{duration_str}'.")

    if location and location != "Undetermined":
        qualitative_assessment.append(f"Location: {location}")
    if content and content != "No specific content described.":
        # Truncate long content for summary readability.
        qualitative_assessment.append(f"Content Summary: {content[:100]}{'...' if len(content) > 100 else ''}")

    # --- III. Associated Symptoms ---
    associated_symptoms = hallucination_data.get("associated_symptoms", {})
    emotional_state_list = associated_symptoms.get("emotional_state", [])
    cognitive_state_str = associated_symptoms.get("cognitive_state", "")
    motor_symptoms_list = associated_symptoms.get("motor_symptoms", [])

    # Emotional State impact calculation.
    emotional_impact_score = 0.0
    detected_emotions_for_summary = []
    if emotional_state_list:
        for emotion in emotional_state_list:
            score_for_emotion = EMOTIONAL_IMPACT_WEIGHTS.get(emotion, 0.0)
            emotional_impact_score += score_for_emotion
            if score_for_emotion > 0.0: # Only list emotions that contributed positively to the score.
                detected_emotions_for_summary.append(f"{emotion} ({score_for_emotion:.1f})")
        synthesis_score += emotional_impact_score
        if detected_emotions_for_summary:
            qualitative_assessment.append(f"Emotional Impact: {', '.join(detected_emotions_for_summary)} (total score add: {emotional_impact_score:.1f})")

    # Cognitive State impact calculation.
    try:
        cognitive_state = CognitiveState(cognitive_state_str)
        cognitive_score = COGNITIVE_IMPACT_WEIGHTS.get(cognitive_state, 0.0)
        synthesis_score += cognitive_score
        if cognitive_state != CognitiveState.CLEAR:
            qualitative_assessment.append(f"Cognitive State: {cognitive_state.value} (score add: {cognitive_score:.1f})")
    except ValueError:
        qualitative_assessment.append(f"Cognitive State: Invalid level '{cognitive_state_str}'.")

    # Motor Symptoms impact calculation.
    if motor_symptoms_list:
        motor_score = len(motor_symptoms_list) * MOTOR_SYMPTOM_WEIGHT
        synthesis_score += motor_score
        qualitative_assessment.append(f"Motor Symptoms: {', '.join(motor_symptoms_list)} (score add: {motor_score:.1f})")

    # --- IV. Context and Triggers ---
    context_and_triggers = hallucination_data.get("context_and_triggers", {})
    environmental_factors = context_and_triggers.get("environmental_factors", [])
    medical_history = context_and_triggers.get("medical_history", [])
    psychological_factors = context_and_triggers.get("psychological_factors", [])

    trigger_count = 0
    trigger_details = []
    if environmental_factors:
        trigger_count += len(environmental_factors)
        trigger_details.append(f"Environmental: {', '.join(environmental_factors)}")
    if medical_history:
        trigger_count += len(medical_history)
        trigger_details.append(f"Medical: {', '.join(medical_history)}")
    if psychological_factors:
        trigger_count += len(psychological_factors)
        trigger_details.append(f"Psychological: {', '.join(psychological_factors)}")

    trigger_score = trigger_count * TRIGGER_FACTOR_WEIGHT
    synthesis_score += trigger_score
    if trigger_details:
        qualitative_assessment.append("\nContext & Triggers:")
        qualitative_assessment.extend([f"  - {detail}" for detail in trigger_details])
        qualitative_assessment.append(f"Total Identified Trigger Factors: {trigger_count} (score add: {trigger_score:.1f})")

    # --- Final Categorization based on synthesis score ---
    # These thresholds are illustrative and can be adjusted based on desired granularity
    # and the range of expected scores from the weighting system.
    category = "Undefined Manifestation"
    if synthesis_score < 5.0:
        category = "Mild/Isolated Manifestation"
    elif synthesis_score < 15.0:
        category = "Moderate/Contextualized Occurrence"
    elif synthesis_score < 25.0:
        category = "Significant/Impactful Presentation"
    else: # synthesis_score >= 25.0
        category = "Severe/Complex Manifestation"

    qualitative_assessment.append(f"\nOverall Synthesis Score: {synthesis_score:.2f}")
    qualitative_assessment.append(f"Assessment Category: {category}")

    return {
        "synthesis_score": round(synthesis_score, 2),
        "assessment_category": category,
        "qualitative_summary": "\n".join(qualitative_assessment)
    }