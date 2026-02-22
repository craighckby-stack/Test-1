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
                          States with probabilities less than or equal to `_EPSILON`
                          will be excluded. The remaining probabilities will be normalized
                          to sum to 1.0.

        Raises:
            ValueError: If `states_probs` is empty, or if all provided probabilities are
                        zero or negligibly small after filtering.
        """
        self._states_probs = self._normalize_probabilities(states_probs)

    @staticmethod
    def _normalize_probabilities(states_probs: Dict[Any, float]) -> Dict[Any, float]:
        """Internal helper to filter out negligible probabilities and normalize the rest."""
        # Filter out states with non-positive or negligibly small probabilities
        filtered_states_probs = {
            state: prob for state, prob in states_probs.items() if prob > _EPSILON
        }

        if not filtered_states_probs:
            raise ValueError(
                "Initial 'states_probs' must contain at least one state with a positive "
                "probability (greater than _EPSILON)."
            )

        # Use math.fsum for accurate summation of floats
        total_prob = math.fsum(filtered_states_probs.values())

        if total_prob <= _EPSILON:  # All remaining probabilities effectively sum to zero
            raise ValueError(
                "Sum of probabilities for initial states is zero or negligibly small "
                "after filtering, indicating no valid states."
            )

        # Normalize the probabilities
        normalized_states_probs = {
            state: prob / total_prob for state, prob in filtered_states_probs.items()
        }
        return normalized_states_probs

    @property
    def states_with_probabilities(self) -> Dict[Any, float]:
        """Returns a copy of the internal states and their normalized probabilities.

        Returns:
            A dictionary mapping states to their probabilities. The returned dictionary
            is a copy, so modifying it will not affect the `UncertainValue` instance.
        """
        return self._states_probs.copy()

    def collapse(self) -> Any:
        """Simulates observation by collapsing the UncertainValue into one definite state.

        The chosen state is selected probabilistically based on the current
        distribution of states.

        Returns:
            The chosen state, which is one of the possible states of this
            `UncertainValue`.
        """
        states = list(self._states_probs.keys())
        probabilities = list(self._states_probs.values())
        # random.choices returns a list, so we take the first element
        return random.choices(states, weights=probabilities, k=1)[0]

    def apply_operator(self, operator: Callable[[Any], Dict[Any, float]]) -> 'UncertainValue':
        """Applies a probabilistic operator to the UncertainValue.

        The operator transforms each current state into a new set of states with
        associated *conditional* probabilities. The probabilities of the resulting
        new states are calculated by summing up the products of the original state's
        probability and the conditional probability from the operator.

        Example:
            If `uv = UncertainValue({'A': 0.6, 'B': 0.4})`
            And `operator(state)` returns:
                `{'A': {'X': 0.7, 'Y': 0.3}}`
                `{'B': {'X': 0.2, 'Z': 0.8}}`
            Then the new state 'X' would have probability `0.6 * 0.7 + 0.4 * 0.2`.
            The new state 'Y' would have probability `0.6 * 0.3`.
            The new state 'Z' would have probability `0.4 * 0.8`.

        Args:
            operator: A callable that takes a single current state (Any) and returns
                      a dictionary mapping new states to their conditional probabilities.
                      For example, `operator(old_state) -> {new_state1: prob1, new_state2: prob2, ...}`.
                      The probabilities returned by the operator for a given `old_state`
                      are treated as conditional and will be normalized internally if they
                      do not sum to 1.0 (or contain non-positive values).

        Returns:
            A new `UncertainValue` instance representing the transformed state distribution.
            This method is non-mutating.
        """
        new_raw_states_probs: Dict[Any, float] = {}

        for current_state, current_prob in self._states_probs.items():
            # Apply the operator to get conditional probabilities for new states
            conditional_probs_from_operator = operator(current_state)

            # Filter and normalize the conditional probabilities, as the operator might
            # not return perfectly normalized or filtered values.
            filtered_cond_probs = {
                s: p for s, p in conditional_probs_from_operator.items() if p > _EPSILON
            }
            total_cond_prob_sum = math.fsum(filtered_cond_probs.values())

            if total_cond_prob_sum <= _EPSILON:
                # If an operator yields no new states or only zero probabilities from a
                # particular `current_state`, that branch effectively terminates.
                continue

            normalized_cond_probs = {
                s: p / total_cond_prob_sum for s, p in filtered_cond_probs.items()
            }

            for new_state, cond_prob in normalized_cond_probs.items():
                # The probability of reaching `new_state` via `current_state` is
                # `current_prob * cond_prob`.
                # We sum probabilities if multiple paths lead to the same `new_state`.
                new_raw_states_probs[new_state] = (
                    new_raw_states_probs.get(new_state, 0.0) + current_prob * cond_prob
                )

        # The constructor's `_normalize_probabilities` will perform a final
        # normalization and filtering, handling any precision errors or ensuring
        # the robustness of the resulting `UncertainValue`.
        return UncertainValue(new_raw_states_probs)

    def get_expected_value(self, value_extractor: Optional[Callable[[Any], float]] = None) -> float:
        """Calculates the expected value of the UncertainValue.

        If `value_extractor` is provided, it's used to convert each state to a numerical value.
        Otherwise, it assumes the states themselves are numerical (int or float).

        Args:
            value_extractor: An optional callable that takes a state (Any) and returns
                             its numerical value (float). If `None`, the states are
                             assumed to be numerical themselves.

        Returns:
            The expected value, calculated as the sum of (state_value * state_probability)
            over all possible states.

        Raises:
            TypeError: If states are not numerical and no `value_extractor` is provided.
        """
        expected_val = 0.0
        for state, prob in self._states_probs.items():
            value: float
            if value_extractor:
                value = value_extractor(state)
            else:
                if not isinstance(state, (int, float)):
                    raise TypeError(
                        f"State '{state}' (type: {type(state)}) is not numerical. "
                        "Provide a 'value_extractor' callable to convert states to numbers, "
                        "or ensure all states are int or float."
                    )
                value = float(state)
            expected_val += value * prob
        return expected_val

    def __repr__(self) -> str:
        """Returns a machine-readable string representation of the UncertainValue."""
        # Sort states for consistent representation, useful for testing and debugging.
        # Uses string representation of state for sorting key, as states can be Any.
        sorted_states = sorted(self._states_probs.items(), key=lambda item: str(item[0]))
        probs_str = ", ".join([f"{repr(s)}: {p:.6f}" for s, p in sorted_states])
        return f"UncertainValue({{{probs_str}}})"

    def __str__(self) -> str:
        """Returns a user-friendly string representation of the UncertainValue."""
        # For UncertainValue, __repr__ is often sufficiently user-friendly.
        return self.__repr__()

    def __eq__(self, other: Any) -> bool:
        """Compares two UncertainValue instances for approximate equality.

        Two UncertainValue instances are considered equal if they have the same
        set of states and their corresponding probabilities are approximately
        equal within `_EPSILON`.
        """
        if not isinstance(other, UncertainValue):
            return NotImplemented

        # Check if the sets of states are identical
        if set(self._states_probs.keys()) != set(other._states_probs.keys()):
            return False

        # Check if probabilities for each state are approximately equal
        for state, prob_self in self._states_probs.items():
            prob_other = other._states_probs.get(state, 0.0)
            if abs(prob_self - prob_other) > _EPSILON:
                return False
        return True

    def __hash__(self) -> int:
        """Returns a hash value for the UncertainValue.

        The hash is computed based on a canonical representation of the
        states and their rounded probabilities to ensure consistency with `__eq__`.
        """
        # Create a sorted tuple of (state, rounded_probability) pairs.
        # Probabilities are rounded to a fixed precision to ensure that
        # `abs(p1 - p2) <= _EPSILON` implies `round(p1, N) == round(p2, N)`.
        # A rounding precision of 8-10 decimal places is usually sufficient
        # given `_EPSILON` of 1e-9.
        hashable_representation: Tuple[Tuple[Any, float], ...] = tuple(
            sorted(
                ((state, round(prob, 8)) for state, prob in self._states_probs.items()),
                key=lambda item: str(item[0])  # Use string representation for consistent sorting
            )
        )
        return hash(hashable_representation)