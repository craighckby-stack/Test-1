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
from typing import Any, Dict, Callable, Set

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
    """

    def __init__(self, states_probs: Dict[Any, float]):
        """Initializes the UncertainValue with possible states and their probabilities.

        Args:
            states_probs: A dictionary where keys are the possible states (any hashable type)
                          and values are their probabilities. Probabilities must be non-negative
                          and will be normalized if they don't sum to 1.0. States with
                          probabilities less than or equal to zero will be excluded.

        Raises:
            ValueError: If states_probs is empty, or if all provided probabilities are zero,
                        or if any probability is negative and not filtered out.
            RuntimeError: If an internal error prevents proper probability normalization.
        """
        if not states_probs:
            raise ValueError(
                "states_probs cannot be empty; an UncertainValue must have at least one possible state."
            )

        # Filter out states with zero or negative probability to keep the representation
        # clean and efficient, as these states do not contribute to outcomes.
        filtered_states_probs = {
            state: prob for state, prob in states_probs.items() if prob > 0
        }

        if not filtered_states_probs:
            raise ValueError(
                "All provided probabilities are zero or non-positive, resulting in no valid states."
            )

        total_prob = sum(filtered_states_probs.values())

        if total_prob <= 0:
            # This case should be mostly covered by the filter and previous check,
            # but serves as a final safeguard against pathological inputs or float errors.
            raise ValueError(
                "Sum of probabilities is zero or negative, cannot normalize."
            )

        # Normalize probabilities if they don't sum to 1.0 within the tolerance.
        normalized_states_probs = {}
        if not math.isclose(total_prob, 1.0, rel_tol=_EPSILON, abs_tol=_EPSILON):
            for state, prob in filtered_states_probs.items():
                normalized_states_probs[state] = prob / total_prob
            self._states_probs = normalized_states_probs
        else:
            self._states_probs = filtered_states_probs  # Already normalized and valid

        # Final check to ensure probabilities sum to 1 after initialization.
        if not math.isclose(
            sum(self._states_probs.values()), 1.0, rel_tol=_EPSILON, abs_tol=_EPSILON
        ):
            # This indicates a severe internal error in probability handling.
            raise RuntimeError("Internal error: probabilities did not normalize correctly.")

    @property
    def states_probs(self) -> Dict[Any, float]:
        """Returns a copy of the dictionary of states and their probabilities.
        Returning a copy prevents external modification of the internal state.
        """
        return self._states_probs.copy()

    @property
    def possible_states(self) -> Set[Any]:
        """Returns a set of all possible states with non-zero probability."""
        return set(self._states_probs.keys())

    @property
    def is_definite(self) -> bool:
        """Returns True if the value is in a definite state (only one possible state with probability 1.0)."""
        return len(self._states_probs) == 1 and math.isclose(
            list(self._states_probs.values())[0], 1.0, rel_tol=_EPSILON, abs_tol=_EPSILON
        )

    def collapse(self) -> Any:
        """Simulates the 'measurement' of the UncertainValue, collapsing it to a
        single definite state based on the associated probabilities. This is
        analogous to observing a quantum state.

        Returns:
            The chosen state, sampled according to its probability.
        """
        states = list(self._states_probs.keys())
        probabilities = list(self._states_probs.values())
        # random.choices is suitable for weighted random selection.
        return random.choices(states, weights=probabilities, k=1)[0]

    def map_states(self, func: Callable[[Any], Any]) -> 'UncertainValue':
        """Applies a deterministic function to each possible state, creating a new
        UncertainValue. If multiple original states map to the same new state,
        their probabilities are summed. This operation transforms the possible
        outcomes while preserving the overall probability distribution.

        Args:
            func: A callable that takes a state (Any) and returns a new state (Any).

        Returns:
            A new UncertainValue instance representing the transformed states.
        """
        new_states_probs: Dict[Any, float] = {}
        for state, prob in self._states_probs.items():
            new_state = func(state)
            new_states_probs[new_state] = new_states_probs.get(new_state, 0.0) + prob
        # The constructor will re-normalize if needed and handle any states with zero prob.
        return UncertainValue(new_states_probs)

    def combine(self, other: 'UncertainValue', combine_func: Callable[[Any, Any], Any]) -> 'UncertainValue':
        """Combines this UncertainValue with another, assuming the two are independent.

        Each possible state of the new UncertainValue is a combination of a state
        from `self` and a state from `other`. The probability of a combined state
        is the product of their individual probabilities. This method is crucial
        for modeling systems where multiple uncertain components interact.

        Args:
            other: Another UncertainValue instance to combine with.
            combine_func: A callable that takes two states (one from `self`, one from `other`)
                          and returns their combined state.

        Returns:
            A new UncertainValue instance representing the combined states.
        """
        new_states_probs: Dict[Any, float] = {}
        for s1, p1 in self._states_probs.items():
            for s2, p2 in other._states_probs.items():
                combined_state = combine_func(s1, s2)
                combined_prob = p1 * p2
                new_states_probs[combined_state] = new_states_probs.get(combined_state, 0.0) + combined_prob
        # The constructor will normalize the probabilities.
        return UncertainValue(new_states_probs)

    def get_probability(self, state: Any) -> float:
        """Returns the probability of a specific state. Returns 0.0 if the state
        is not among the possible states of this UncertainValue.
        """
        return self._states_probs.get(state, 0.0)

    def __str__(self) -> str:
        """Returns a user-friendly string representation of the UncertainValue.
        Probabilities are formatted for readability.
        """
        # Sort items for consistent string representation
        sorted_items = sorted(self._states_probs.items(), key=lambda item: str(item[0]))
        formatted_probs = {f"{k}": f"{v:.4f}" for k, v in sorted_items}
        return f"UncertainValue({formatted_probs})"

    def __repr__(self) -> str:
        """Returns an unambiguous string representation of the UncertainValue,
        suitable for debugging and recreation.
        """
        # Use direct internal dictionary representation for full detail.
        return f"UncertainValue({self._states_probs})"

    def __eq__(self, other: Any) -> bool:
        """Checks for equality with another UncertainValue instance.

        Two UncertainValue instances are considered equal if they have the same
        set of possible states and their corresponding probabilities are
        approximately equal, accounting for floating-point inaccuracies.
        """
        if not isinstance(other, UncertainValue):
            return NotImplemented

        # First, compare the sets of possible states (keys).
        if self.possible_states != other.possible_states:
            return False

        # Then, compare the probabilities for each common state with tolerance.
        for state in self.possible_states:
            if not math.isclose(
                self._states_probs.get(state, 0.0),
                other._states_probs.get(state, 0.0),
                rel_tol=_EPSILON,
                abs_tol=_EPSILON,
            ):
                return False
        return True

    def __hash__(self) -> int:
        """Returns a hash for the UncertainValue.

        Hashing floating-point numbers directly can be problematic due to precision.
        This implementation sorts the states and their rounded probabilities to a
        fixed precision, ensuring a consistent hash for numerically equivalent
        UncertainValue instances. The rounding precision is derived from _EPSILON.
        """
        # Calculate rounding precision based on _EPSILON.
        # e.g., if _EPSILON = 1e-9, round to 9 decimal places.
        rounding_precision = int(-math.log10(_EPSILON)) if _EPSILON > 0 else 15 # Default for very small/zero epsilon

        # Sort items by state (keys) to ensure a consistent order for hashing.
        # Round probabilities to a fixed precision to handle floating point inaccuracies.
        items_for_hash = tuple(
            (state, round(prob, rounding_precision))
            for state, prob in sorted(self._states_probs.items(), key=lambda item: str(item[0]))
        )
        return hash(items_for_hash)