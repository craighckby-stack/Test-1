# Copyright 2021 The Cirq Developers
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import random
import math
from typing import Any, Dict, Callable, Optional, Tuple

# A small tolerance for floating point comparisons to account for precision issues.
_EPSILON = 1e-9


class UncertainValue:
    """Represents a classical value in a 'superposition' of possible states,
    each with an associated probability.

    Inspired by quantum states, this value does not have a definite state
    until 'collapsed' (observed/measured). Operations can change the
    probabilities of its possible states. This class is designed to be a
    foundational component for modeling probabilistic aspects within the
    Tri-Model Nexus, aiding in the development of AGI components.

    By mimicking quantum superposition, it allows the AGI to:
    1.  **Explore multiple hypotheses simultaneously**: Rather than committing
        to a single interpretation or action, an AGI component can maintain
        a probability distribution over various possibilities.
    2.  **Model uncertainty**: Real-world data and predictions are rarely
        100% certain. This class provides a structured way to quantify
        and propagate that uncertainty.
    3.  **Facilitate "what-if" scenarios**: Operators can transform an
        UncertainValue, allowing the AGI to simulate potential outcomes
        of different actions or conditions without immediate commitment.
    4.  **Incorporate quantum-inspired reasoning**: The 'collapse' mechanism
        mirrors measurement, where an uncertain state resolves into a definite
        outcome, reflecting a decision point or an observation.

    An `UncertainValue` is immutable after creation. Operations that transform
    its state (like `apply_operator`) return a new `UncertainValue` instance.
    """

    # Internal storage for states and their normalized probabilities.
    # The dictionary keys are states (Any hashable type), and values are their probabilities.
    _states_probs: Dict[Any, float]

    def __init__(self, states_probs: Dict[Any, float]):
        """Initializes the UncertainValue with possible states and their probabilities.

        Args:
            states_probs: A dictionary where keys are the possible states (any hashable type)
                          and values are their probabilities. Probabilities must be non-negative.

        Raises:
            ValueError: If states_probs is empty or contains negative probabilities,
                        or if all probabilities sum to zero.
        """
        if not states_probs:
            raise ValueError("states_probs cannot be empty.")

        filtered_probs = {s: p for s, p in states_probs.items() if p > _EPSILON}
        if not filtered_probs:
            raise ValueError("All probabilities are zero or too small.")

        total_prob = sum(filtered_probs.values())
        if total_prob <= _EPSILON:
            raise ValueError("Sum of probabilities is zero or too small to normalize.")

        self._states_probs = {
            state: prob / total_prob for state, prob in filtered_probs.items()
        }

    def get_states_and_probabilities(self) -> Dict[Any, float]:
        """Returns a copy of the internal states and their normalized probabilities.

        Returns:
            A dictionary mapping states to their probabilities.
        """
        return self._states_probs.copy()

    def collapse(self) -> Any:
        """Simulates the 'measurement' or 'observation' of the UncertainValue,
        causing it to collapse into a single definite state based on its
        probability distribution.

        This function is crucial for an AGI to make concrete decisions or
        interpret observations from a probabilistic state.

        Returns:
            The chosen state from the distribution.
        """
        states, probabilities = zip(*self._states_probs.items())
        return random.choices(states, weights=probabilities, k=1)[0]

    def apply_operator(self, operator: Callable[[Any], Dict[Any, float]]) -> 'UncertainValue':
        """Applies an 'operator' to the UncertainValue, transforming its
        superposition of states into a new superposition.

        This models how an AGI might process information, evaluate potential
        actions, or propagate probabilistic changes. The operator itself can
        be a function simulating a decision-making process, a probabilistic
        transition, or a filtering mechanism.

        Args:
            operator: A callable that takes a single state (Any) and returns
                      a dictionary representing a new probability distribution
                      for that state's transformation. The probabilities in the
                      returned dictionary do not need to sum to 1, but they
                      must be non-negative.

                      Example: `operator(state_A)` might return `{state_X: 0.5, state_Y: 0.5}`.
                      This implies that if the system was in `state_A`, it now
                      transitions to `state_X` with 50% probability and `state_Y`
                      with 50% probability.

        Returns:
            A new `UncertainValue` instance representing the transformed superposition.
        """
        new_combined_probs: Dict[Any, float] = {}

        for initial_state, initial_prob in self._states_probs.items():
            if initial_prob <= _EPSILON:
                continue  # Skip states with negligible probability

            # Apply the operator to the initial state to get its potential outcomes
            transformed_distribution = operator(initial_state)

            for outcome_state, outcome_prob in transformed_distribution.items():
                if outcome_prob < -_EPSILON:
                    raise ValueError(f"Operator returned negative probability for state {outcome_state}: {outcome_prob}")
                if outcome_prob <= _EPSILON:
                    continue

                # The probability of reaching outcome_state via initial_state
                path_prob = initial_prob * outcome_prob

                # Accumulate probabilities for the same outcome_state
                new_combined_probs[outcome_state] = (
                    new_combined_probs.get(outcome_state, 0.0) + path_prob
                )

        if not new_combined_probs:
            # If all paths led to zero probability states, return a trivial uncertain value
            # or raise an error depending on desired behavior. For now, we'll make it
            # default to a "null" or "undefined" state with 100% probability.
            return UncertainValue({"Undefined": 1.0})

        # The constructor will normalize the new_combined_probs
        return UncertainValue(new_combined_probs)

    def __eq__(self, other: object) -> bool:
        """Compares two UncertainValue instances for equality.

        Two UncertainValue instances are considered equal if they have the same
        states with probabilities that are approximately equal (within _EPSILON).
        """
        if not isinstance(other, UncertainValue):
            return NotImplemented

        if len(self._states_probs) != len(other._states_probs):
            return False

        # Compare keys and values with tolerance
        for state, prob in self._states_probs.items():
            if state not in other._states_probs:
                return False
            if not math.isclose(prob, other._states_probs[state], abs_tol=_EPSILON):
                return False
        return True

    def __hash__(self) -> int:
        """Returns a hash value for the UncertainValue instance.

        This makes UncertainValue objects usable in sets or as dictionary keys.
        The hash is based on the sorted (state, probability) pairs to ensure
        consistency despite dictionary's arbitrary order. Due to floating
        point precision, probabilities are quantized for hashing purposes.
        """
        # Quantize probabilities for hashing to reduce issues with float precision.
        # This might lead to collisions if probabilities are very close but not equal
        # within _EPSILON, but is necessary for practical hashing of floats.
        quantization_factor = 1_000_000
        hashed_items = tuple(
            sorted(
                (state, round(prob * quantization_factor))
                for state, prob in self._states_probs.items()
            )
        )
        return hash(hashed_items)

    def __repr__(self) -> str:
        """Returns a string representation of the UncertainValue."""
        items = sorted(self._states_probs.items(), key=lambda item: str(item[0]))
        formatted_items = ", ".join(f"{state!r}: {prob:.4f}" for state, prob in items)
        return f"UncertainValue({{{formatted_items}}})"

# Example usage (for internal testing and demonstration within the AGI context):
if __name__ == '__main__':
    print("--- Demonstrating UncertainValue for AGI Component Modeling ---")

    # Scenario 1: Initial AGI hypothesis generation
    print("\n1. Initial Hypothesis Generation:")
    initial_hypotheses = UncertainValue({
        "Hypothesis_A": 0.6,
        "Hypothesis_B": 0.3,
        "Hypothesis_C": 0.1
    })
    print(f"Initial AGI Hypotheses: {initial_hypotheses}")

    # Scenario 2: Processing new sensory input (applying an operator)
    print("\n2. Processing Sensory Input (Operator Application):")

    def sensory_input_processor(hypothesis: str) -> Dict[str, float]:
        """Simulates how sensory input might refine or transform an AGI's hypothesis."""
        if hypothesis == "Hypothesis_A":
            return {"Refined_A1": 0.8, "Challenged_A2": 0.2}
        elif hypothesis == "Hypothesis_B":
            return {"Supported_B": 0.7, "Discarded_B": 0.3}
        elif hypothesis == "Hypothesis_C":
            # Very unlikely, but could lead to a breakthrough
            return {"Breakthrough_C": 0.05, "Reinforced_A1": 0.95} # Cross-pollination
        return {hypothesis: 1.0} # Default if no specific rule

    refined_hypotheses = initial_hypotheses.apply_operator(sensory_input_processor)
    print(f"Refined Hypotheses after Sensory Input: {refined_hypotheses}")

    # Scenario 3: AGI makes a decision (collapsing the state)
    print("\n3. AGI Decision Making (Collapse):")
    for i in range(5):
        decision = refined_hypotheses.collapse()
        print(f"  AGI Decision {i+1}: {decision}")

    # Scenario 4: Modeling uncertain environmental factors
    print("\n4. Modeling Uncertain Environmental Factors:")
    weather_forecast = UncertainValue({
        "Sunny": 0.7,
        "Cloudy": 0.2,
        "Rainy": 0.1
    })
    print(f"Weather Forecast: {weather_forecast}")

    def impact_on_travel_plan(weather: str) -> Dict[str, float]:
        """Operator for how weather impacts a travel plan."""
        if weather == "Sunny":
            return {"Go_Hiking": 0.9, "Stay_Home": 0.1}
        elif weather == "Cloudy":
            return {"Go_Hiking": 0.4, "Visit_Museum": 0.5, "Stay_Home": 0.1}
        elif weather == "Rainy":
            return {"Visit_Museum": 0.7, "Stay_Home": 0.3}
        return {"Uncertain_Plan": 1.0}

    travel_plan = weather_forecast.apply_operator(impact_on_travel_plan)
    print(f"Probabilistic Travel Plan: {travel_plan}")
    print(f"Decided Travel Activity: {travel_plan.collapse()}")


    # Scenario 5: Equality and Hashing
    print("\n5. Equality and Hashing:")
    uv1 = UncertainValue({"A": 0.5, "B": 0.5})
    uv2 = UncertainValue({"B": 0.5, "A": 0.5}) # Same states, different order
    uv3 = UncertainValue({"A": 0.4999999999, "B": 0.5000000001}) # Close values
    uv4 = UncertainValue({"A": 0.6, "B": 0.4})
    uv5 = UncertainValue({"A": 1.0})

    print(f"uv1: {uv1}")
    print(f"uv2: {uv2}")
    print(f"uv3: {uv3}")
    print(f"uv4: {uv4}")
    print(f"uv5: {uv5}")

    print(f"uv1 == uv2: {uv1 == uv2}") # Should be True
    print(f"uv1 == uv3: {uv1 == uv3}") # Should be True due to _EPSILON
    print(f"uv1 == uv4: {uv1 == uv4}") # Should be False
    print(f"uv1 == uv5: {uv1 == uv5}") # Should be False

    s = {uv1, uv2, uv3, uv4, uv5}
    print(f"Set of UncertainValues (should only contain 3 unique, due to equality): {s}")
    assert len(s) == 3 # uv1, uv4, uv5 (uv2 and uv3 are equal to uv1)
    print("Assertion passed: Set length is 3.")

    # Error handling
    print("\n6. Error Handling:")
    try:
        UncertainValue({})
    except ValueError as e:
        print(f"  Caught expected error for empty states_probs: {e}")

    try:
        UncertainValue({"A": -0.1, "B": 1.1})
    except ValueError as e:
        print(f"  Caught expected error for negative/invalid states_probs: {e}")

    try:
        uv_zero_prob = UncertainValue({"A": 0.00000000001, "B": 0.000000000005})
        print(f"  UncertainValue with very small probabilities, normalized: {uv_zero_prob}")
        # This will be normalized if sum > _EPSILON, otherwise it will error out in init
        _ = UncertainValue({"A": 1e-12, "B": 1e-13})
    except ValueError as e:
        print(f"  Caught expected error for sum of probabilities too small: {e}")


    print("\n--- UncertainValue demonstration complete. ---")
    print("This class provides a quantum-inspired mechanism for the Tri-Model Nexus")
    print("to manage and transform probabilistic states, moving towards AGI by allowing")
    print("more nuanced and flexible reasoning under uncertainty.")