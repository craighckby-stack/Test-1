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
from typing import Any, Dict, List, Tuple

# A small tolerance for floating point comparisons
_EPSILON = 1e-9


class UncertainValue:
    """Represents a classical value in a 'superposition' of possible states,
    each with an associated probability.

    Inspired by quantum states, this value does not have a definite state
    until 'collapsed' (observed/measured). Operations can change the
    probabilities of its possible states.
    """

    def __init__(self, states_probs: Dict[Any, float]):
        """Initializes the UncertainValue with possible states and their probabilities.

        Args:
            states_probs: A dictionary where keys are the possible states (any hashable type)
                          and values are their probabilities. Probabilities must be non-negative
                          and will be normalized if they don't sum to 1.0.

        Raises:
            ValueError: If probabilities are negative, if no states are provided,
                        or if the sum of probabilities is zero.
        """
        if not states_probs:
            raise ValueError("UncertainValue must be initialized with at least one state.")

        for state, prob in states_probs.items():
            if not isinstance(prob, (int, float)) or prob < 0:
                raise ValueError(
                    f"Probability for state '{state}' must be a non-negative number, got {prob}."
                )

        total_prob = sum(states_probs.values())
        if total_prob < _EPSILON:  # Sum is effectively zero
            raise ValueError("Sum of probabilities cannot be zero.")

        # Normalize probabilities to ensure they sum to 1.0
        self._states_probs: Dict[Any, float] = {
            state: prob / total_prob for state, prob in states_probs.items()
        }
        self._current_value: Any = None  # Stores the definite value once collapsed

    @property
    def possible_states(self) -> Dict[Any, float]:
        """Returns a copy of the current state probabilities.

        If the value has been collapsed, this will still reflect the state
        probabilities *before* collapse, or the post-collapse distribution
        if it was subsequently re-initialized or transformed from a collapsed state
        (though current design prevents operations on collapsed states).
        """
        return self._states_probs.copy()

    @property
    def is_collapsed(self) -> bool:
        """Returns True if the value has been collapsed to a single, definite state."""
        return self._current_value is not None

    def collapse(self) -> Any:
        """Simulates 'measuring' the value, forcing it into a single definite state.

        Once collapsed, subsequent calls to `collapse()` will return the same value.
        The underlying probabilities effectively reduce to 1.0 for the collapsed
        state and 0.0 for all others, but the `_states_probs` property remains
        the distribution *prior* to this specific measurement.

        Returns:
            The definite state that the value collapsed into.
        """
        if self._current_value is None:
            states = list(self._states_probs.keys())
            probabilities = list(self._states_probs.values())
            # Use random.choices to select a state based on weights (probabilities)
            self._current_value = random.choices(states, weights=probabilities, k=1)[0]
        return self._current_value

    def apply_stochastic_operation(
        self, transition_matrix: Dict[Any, Dict[Any, float]]
    ) -> None:
        """Applies a stochastic operation (like a classical channel or filter)
        to the uncertain value, updating its probabilities.

        This models an operation that transforms probabilities from one state
        to another. The operation can only be applied if the value has not
        yet been collapsed.

        Args:
            transition_matrix: A dictionary where:
                - Keys are 'from' states (must be present in the `UncertainValue`'s
                  current possible states, or lead to a 0 probability path).
                - Values are dictionaries mapping 'to' states to probabilities.
                - For each 'from' state, the 'to' state probabilities must sum to 1.0.
                  (e.g., `{'HIGH': {'HIGH': 0.7, 'LOW': 0.3}, 'LOW': {'HIGH': 0.2, 'LOW': 0.8}}`)

        Raises:
            ValueError: If the value has already been collapsed, or if the
                        transition matrix is invalid (e.g., negative probabilities,
                        probabilities not summing to 1 for a 'from' state).
            RuntimeError: If the operation unexpectedly results in no possible states.
        """
        if self.is_collapsed:
            raise ValueError("Cannot apply operation to an already collapsed value.")

        new_states_probs: Dict[Any, float] = {}
        all_possible_output_states = set()

        # Validate transition matrix and gather all possible output states
        for from_state, to_probs_map in transition_matrix.items():
            if not to_probs_map:
                raise ValueError(f"Transition map for 'from' state '{from_state}' cannot be empty.")
            total_to_prob = 0.0
            for to_state, prob in to_probs_map.items():
                if not isinstance(prob, (int, float)) or prob < 0:
                    raise ValueError(
                        f"Transition probability for '{from_state}' -> '{to_state}' "
                        f"must be non-negative, got {prob}."
                    )
                total_to_prob += prob
                all_possible_output_states.add(to_state)
            if abs(total_to_prob - 1.0) > _EPSILON:
                raise ValueError(
                    f"Transition probabilities for 'from' state '{from_state}' "
                    f"do not sum to 1.0 (sum: {total_to_prob:.3f})."
                )

        # Calculate new probabilities using the law of total probability
        # P(to_state) = sum(P(to_state | from_state) * P(from_state))
        for to_state in all_possible_output_states:
            new_prob = 0.0
            for from_state, current_prob in self._states_probs.items():
                if from_state in transition_matrix:
                    new_prob += current_prob * transition_matrix[from_state].get(to_state, 0.0)
            if new_prob > _EPSILON:  # Only add if probability is significant
                new_states_probs[to_state] = new_prob

        # Update internal state, re-normalize in case of tiny floating point errors
        if not new_states_probs:
            raise RuntimeError(
                "Operation resulted in no possible states with non-zero probability. "
                "This indicates an issue with the transition matrix or initial state."
            )

        total_new_prob = sum(new_states_probs.values())
        if total_new_prob < _EPSILON:
            raise RuntimeError("Sum of new probabilities is zero after operation. This should not happen.")
        
        self._states_probs = {s: p / total_new_prob for s, p in new_states_probs.items()}

    def __repr__(self) -> str:
        if self.is_collapsed:
            return f"UncertainValue(Collapsed={self._current_value!r})"
        return f"UncertainValue({self._states_probs!r})"

    def __str__(self) -> str:
        if self.is_collapsed:
            return f"Collapsed to: {self._current_value}"
        return (
            "Possible states: "
            + ", ".join(f"{s!r} ({p:.2f})" for s, p in self._states_probs.items())
        )


class QuantumInspiredSystem:
    """A simple system to manage and operate on multiple UncertainValue instances.

    This class serves as a conceptual "quantum-inspired circuit" or "simulator"
    for classical uncertain variables, allowing users to define, transform,
    and "measure" (collapse) them.
    """

    def __init__(self, name: str = "QuantumInspiredSystem"):
        """Initializes the QuantumInspiredSystem.

        Args:
            name: An optional name for the system.
        """
        self.name = name
        self._registers: Dict[str, UncertainValue] = {}
        self._history: List[str] = []

    def add_register(self, name: str, initial_states_probs: Dict[Any, float]) -> UncertainValue:
        """Adds a new UncertainValue register to the system.

        Args:
            name: The unique name for the new register.
            initial_states_probs: A dictionary defining the initial possible
                                  states and their probabilities for this register.

        Returns:
            The newly created and added UncertainValue instance.

        Raises:
            ValueError: If a register with the given name already exists.
        """
        if name in self._registers:
            raise ValueError(f"Register '{name}' already exists.")
        register = UncertainValue(initial_states_probs)
        self._registers[name] = register
        self._history.append(f"Added register '{name}': {register}")
        return register

    def get_register(self, name: str) -> UncertainValue:
        """Retrieves an UncertainValue register by name.

        Args:
            name: The name of the register to retrieve.

        Returns:
            The UncertainValue instance associated with the given name.

        Raises:
            ValueError: If the register with the given name is not found.
        """
        if name not in self._registers:
            raise ValueError(f"Register '{name}' not found.")
        return self._registers[name]

    def apply_operation_to_register(
        self,
        register_name: str,
        transition_matrix: Dict[Any, Dict[Any, float]],
        op_name: str = "stochastic_op",
    ) -> None:
        """Applies a stochastic operation to a specified register.

        Args:
            register_name: The name of the register to operate on.
            transition_matrix: The stochastic transition matrix to apply.
            op_name: An optional name for the operation, used in history tracking.

        Raises:
            ValueError: If the register is not found or if the operation fails.
        """
        register = self.get_register(register_name)
        register.apply_stochastic_operation(transition_matrix)
        self._history.append(f"Applied '{op_name}' to '{register_name}': {register}")

    def measure_register(self, register_name: str) -> Any:
        """Measures (collapses) a specified register and returns its outcome.

        Args:
            register_name: The name of the register to measure.

        Returns:
            The definite state that the register collapsed into.

        Raises:
            ValueError: If the register is not found.
        """
        register = self.get_register(register_name)
        result = register.collapse()
        self._history.append(f"Measured '{register_name}', result: {result}")
        return result

    def get_history(self) -> Tuple[str, ...]:
        """Returns the operational history of the system as an immutable tuple."""
        return tuple(self._history)

    def __str__(self) -> str:
        s = f"--- {self.name} ---"
        if not self._registers:
            s += "\n  (No registers added yet)"
        else:
            for name, reg in self._registers.items():
                s += f"\n  '{name}': {reg}"
        return s

# Example usage (demonstrating the module's capabilities):
if __name__ == "__main__":
    print("--- Initializing Quantum-Inspired System ---")
    system = QuantumInspiredSystem("SensorNetworkSimulator")

    # Add a sensor register that is initially 50/50 HIGH/LOW due to noise
    sensor_a = system.add_register("SensorA", {'HIGH': 0.5, 'LOW': 0.5})
    print(system)
    print(f"SensorA initially: {sensor_a}")

    # Add another sensor register, initially biased towards 'ON'
    sensor_b = system.add_register("SensorB", {'ON': 0.8, 'OFF': 0.2})
    print(system)
    print(f"SensorB initially: {sensor_b}")

    print("\n--- Applying operations ---")
    # Define a 'filter' operation for SensorA
    # If HIGH, mostly stays HIGH (0.9), sometimes flips to LOW (0.1)
    # If LOW, mostly stays LOW (0.8), sometimes flips to HIGH (0.2)
    filter_op_matrix = {
        'HIGH': {'HIGH': 0.9, 'LOW': 0.1},
        'LOW': {'HIGH': 0.2, 'LOW': 0.8}
    }
    system.apply_operation_to_register("SensorA", filter_op_matrix, "ApplyFilter")
    print(f"SensorA after filter: {sensor_a}")

    # Define a 'toggle' operation for SensorB
    # Effectively flips the state with some uncertainty
    toggle_op_matrix = {
        'ON': {'ON': 0.3, 'OFF': 0.7},
        'OFF': {'ON': 0.6, 'OFF': 0.4}
    }
    system.apply_operation_to_register("SensorB", toggle_op_matrix, "ApplyToggle")
    print(f"SensorB after toggle: {sensor_b}")

    print("\n--- Measuring (Collapsing) Registers ---")
    # Repeatedly measure SensorA to observe probabilistic outcomes
    print("Simulating 5 measurements of SensorA:")
    for i in range(5):
        measurement_a = system.measure_register("SensorA")
        print(f"  Measurement {i+1} of SensorA: {measurement_a}")
        # Note: SensorA is now collapsed. Subsequent operations on it would fail.
        # To simulate further operations, you would re-initialize a new UncertainValue.
        # For this example, we'll only measure it once to demonstrate collapse.

    print(f"SensorA state after collapse: {sensor_a}")
    print(f"Is SensorA collapsed? {sensor_a.is_collapsed}")

    # Measure SensorB once
    measurement_b = system.measure_register("SensorB")
    print(f"\nMeasurement of SensorB: {measurement_b}")
    print(f"SensorB state after collapse: {sensor_b}")
    print(f"Is SensorB collapsed? {sensor_b.is_collapsed}")

    print("\n--- System State and History ---")
    print(system)
    print("\n--- Operational History ---")
    for event in system.get_history():
        print(event)

    print("\n--- Demonstrating Error Handling ---")
    try:
        # Try to apply an operation to a collapsed register
        system.apply_operation_to_register("SensorA", filter_op_matrix, "AttemptFilterOnCollapsed")
    except ValueError as e:
        print(f"Caught expected error: {e}")

    try:
        # Try to initialize with invalid probabilities
        UncertainValue({'X': -0.1, 'Y': 1.1})
    except ValueError as e:
        print(f"Caught expected error: {e}")

    try:
        # Try to apply operation with invalid transition matrix (probabilities don't sum to 1)
        invalid_op = {'ON': {'ON': 0.5, 'OFF': 0.3}} # Sums to 0.8
        system.add_register("TempSensor", {'ON': 1.0})
        system.apply_operation_to_register("TempSensor", invalid_op, "InvalidOp")
    except ValueError as e:
        print(f"Caught expected error: {e}")