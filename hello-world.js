import uuid
from typing import List, Dict, Any, Optional

class SynthesisReport:
    """
    A comprehensive report detailing the outcome of a nexus branch synthesis cycle for a specific entity.
    This report can contain sub-reports for child entities.
    """
    def __init__(self,
                 entity_id: str,
                 entity_name: str,
                 total_output_value: float = 0.0,
                 nodule_activity_metrics: Dict[str, float] = None,
                 energy_consumed: float = 0.0,
                 integrity_change_for_entity: float = 0.0,
                 final_integrity: float = 0.0,
                 synthesized_artifacts: List[str] = None,
                 child_reports: List['SynthesisReport'] = None):
        self.entity_id = entity_id
        self.entity_name = entity_name
        self.total_output_value = total_output_value
        self.nodule_activity_metrics = nodule_activity_metrics if nodule_activity_metrics is not None else {}
        self.energy_consumed = energy_consumed
        self.integrity_change_for_entity = integrity_change_for_entity
        self.final_integrity = final_integrity
        self.synthesized_artifacts = synthesized_artifacts if synthesized_artifacts is not None else []
        self.child_reports = child_reports if child_reports is not None else []

    def __str__(self, indent: int = 0) -> str:
        prefix = "  " * indent
        report_str = (f"{prefix}--- Synthesis Report for {self.entity_name} (ID: {self.entity_id[:8]}) ---\n"
                      f"{prefix}  Total Output Value: {self.total_output_value:.2f}\n"
                      f"{prefix}  Energy Consumed: {self.energy_consumed:.2f} units\n"
                      f"{prefix}  Integrity Change (Direct): {self.integrity_change_for_entity:+.2f}\n"
                      f"{prefix}  Final Integrity: {self.final_integrity:.2f}\n"
                      f"{prefix}  Nodule Activity (Avg): {sum(self.nodule_activity_metrics.values()) / max(1, len(self.nodule_activity_metrics)):.2f}\n"
                      f"{prefix}  Artifacts Produced: {len(self.synthesized_artifacts)} items\n")
        if self.child_reports:
            report_str += f"{prefix}  Child Reports ({len(self.child_reports)}):\n"
            for child_rep in self.child_reports:
                report_str += child_rep.__str__(indent + 2)
        return report_str

class EnergyConduit:
    """
    Represents a source of synthesis energy for the nexus branches.
    """
    def __init__(self, conduit_id: str, initial_energy: float, max_capacity: float = 1000.0, efficiency: float = 0.95):
        self.id = conduit_id
        self.current_energy = initial_energy
        self.max_capacity = max_capacity
        self.efficiency = efficiency # How much energy is actually delivered

    def provide_energy(self, requested_amount: float) -> float:
        """
        Attempts to provide a specified amount of energy.
        Returns the actual amount of energy delivered, considering current capacity and efficiency.
        """
        if self.current_energy <= 0:
            return 0.0
        actual_delivered = min(requested_amount, self.current_energy) * self.efficiency
        self.current_energy -= actual_delivered
        return actual_delivered

    def recharge(self, amount: float):
        """
        Recharges the conduit with a given amount of energy, up to its max capacity.
        """
        self.current_energy = min(self.max_capacity, self.current_energy + amount)
        # print(f"Energy Conduit {self.id} recharged by {amount:.2f}. Current energy: {self.current_energy:.2f}")

class SynthesisNodule:
    """
    A processing unit on a NexusBranch responsible for synthesizing data.
    """
    def __init__(self,
                 nodule_id: str,
                 location_tag: str,
                 synthesis_potential: float = 1.0, # Base efficiency of synthesis
                 data_conversion_rate: float = 0.5): # How much data translates to output
        self.id = nodule_id
        self.location_tag = location_tag
        self.synthesis_potential = synthesis_potential
        self.data_conversion_rate = data_conversion_rate
        self.current_activity = 0.0 # Metric of recent processing
        self.output_buffer: List[str] = []

    def process_synthesis(self, energy_input: float, data_input_payload: str) -> float:
        """
        Processes an input data string using provided energy.
        Generates an output value and potentially a new 'artifact'.
        """
        if energy_input <= 0 or not data_input_payload:
            self.current_activity = 0.0
            return 0.0

        # Synthesis logic: output value depends on energy, data complexity, and nodule potential
        # Arbitrary heuristic for data complexity
        data_complexity = len(data_input_payload) / 10.0 if data_input_payload else 0.1
        raw_output = energy_input * self.synthesis_potential * (data_complexity * self.data_conversion_rate)

        # Simulate artifact generation: if enough output is generated, create an artifact
        if raw_output > 5.0 and energy_input > 1.0: # Arbitrary thresholds
            artifact_name = f"Artifact_{self.id}_{uuid.uuid4().hex[:4]}"
            self.output_buffer.append(artifact_name)

        self.current_activity = raw_output # Update activity based on this cycle's output
        return raw_output

    def get_output(self) -> List[str]:
        """ Clears and returns the accumulated artifacts. """
        artifacts = self.output_buffer
        self.output_buffer = []
        return artifacts

class NexusBranch:
    """
    A foundational component of the Nexus system, capable of hosting nodules
    and child branches.
    """
    def __init__(self,
                 branch_id: str,
                 name: str,
                 initial_integrity: float = 100.0,
                 growth_factor: float = 0.05,
                 stability_factor: float = 0.01):
        self.id = branch_id
        self.name = name
        self.integrity = initial_integrity
        self.growth_factor = growth_factor # How much synthesis output contributes to integrity
        self.stability_factor = stability_factor # How much energy consumption impacts integrity
        self.nodules: List[SynthesisNodule] = []
        self.children: List['NexusBranch'] = []
        self.parent: Optional['NexusBranch'] = None

    def add_nodule(self, nodule: SynthesisNodule):
        """ Adds a synthesis nodule to this branch. """
        self.nodules.append(nodule)

    def add_child_branch(self, branch: 'NexusBranch'):
        """ Adds a child branch to this branch. """
        self.children.append(branch)
        branch.parent = self

    def _distribute_data(self, data_stream: List[str], num_recipients: int) -> List[List[str]]:
        """ Simple round-robin data distribution for simulation. """
        if not data_stream or num_recipients == 0:
            return [[] for _ in range(num_recipients)]

        distributed_data = [[] for _ in range(num_recipients)]
        for i, item in enumerate(data_stream):
            distributed_data[i % num_recipients].append(item)
        return distributed_data

    def conduct_synthesis(self, energy_source: EnergyConduit, data_stream: List[str]) -> SynthesisReport:
        """
        Orchestrates synthesis across its nodules and recursively for its children.
        """
        # print(f"  Conducting synthesis for branch: {self.name} (ID: {self.id[:8]})")
        total_branch_output = 0.0
        total_energy_consumed = 0.0
        branch_artifacts: List[str] = []
        nodule_activity: Dict[str, float] = {}
        initial_integrity_for_cycle = self.integrity

        # --- Nodule Synthesis ---
        num_nodule_recipients = len(self.nodules)
        nodule_data_streams = self._distribute_data(data_stream, num_nodule_recipients)

        for i, nodule in enumerate(self.nodules):
            # Each nodule requests a portion of energy based on its potential
            energy_request = nodule.synthesis_potential * 15 # Arbitrary request size
            energy_provided = energy_source.provide_energy(energy_request)
            total_energy_consumed += energy_provided

            nodule_input_data = " ".join(nodule_data_streams[i]) if nodule_data_streams[i] else ""

            output_value = nodule.process_synthesis(energy_provided, nodule_input_data)
            total_branch_output += output_value
            nodule_activity[nodule.id] = nodule.current_activity
            branch_artifacts.extend(nodule.get_output())

        # --- Integrity Calculation for THIS branch ---
        # Output generally improves integrity, energy consumption can slightly decrease it.
        direct_integrity_change = (total_branch_output * self.growth_factor) - (total_energy_consumed * self.stability_factor)
        self.integrity += direct_integrity_change

        # print(f"    Branch {self.name} direct integrity change: {direct_integrity_change:+.2f} (new: {self.integrity:.2f})")

        # --- Child Branch Synthesis (Recursive) ---
        child_reports: List[SynthesisReport] = []
        if self.children:
            # Children receive either artifacts produced by this branch, or a share of the original data.
            data_for_children = branch_artifacts if branch_artifacts else data_stream
            num_child_recipients = len(self.children)
            child_data_streams = self._distribute_data(data_for_children, num_child_recipients)

            for i, child_branch in enumerate(self.children):
                child_report = child_branch.conduct_synthesis(energy_source, child_data_streams[i])
                child_reports.append(child_report)
                # Aggregate child outputs and energy consumption into this branch's totals
                total_branch_output += child_report.total_output_value
                total_energy_consumed += child_report.energy_consumed
                # Simulate indirect integrity impact from children (e.g., instability in child affects parent)
                self.integrity += child_report.integrity_change_for_entity * 0.05 # Smaller impact from children

        return SynthesisReport(
            entity_id=self.id,
            entity_name=self.name,
            total_output_value=total_branch_output,
            nodule_activity_metrics=nodule_activity,
            energy_consumed=total_energy_consumed,
            integrity_change_for_entity=(self.integrity - initial_integrity_for_cycle), # Actual change including child impacts
            final_integrity=self.integrity,
            synthesized_artifacts=branch_artifacts, # Only artifacts directly produced by THIS branch's nodules
            child_reports=child_reports
        )


def calculate_nexus_branch_synthesis(
    root_branch: NexusBranch,
    global_energy_source: EnergyConduit,
    initial_data_stream: List[str],
    synthesis_cycles: int = 1
) -> List[SynthesisReport]:
    """
    Orchestrates the Nexus Branch Synthesis process over multiple cycles,
    starting from a root branch.

    Args:
        root_branch (NexusBranch): The top-level branch of the nexus.
        global_energy_source (EnergyConduit): The shared energy supply.
        initial_data_stream (List[str]): The initial data input for the first cycle.
        synthesis_cycles (int): The number of synthesis iterations to perform.

    Returns:
        List[SynthesisReport]: A list of SynthesisReport objects, one for each cycle.
    """
    # print("\n--- Initiating Nexus Branch Synthesis Calculation ---")
    all_cycle_reports: List[SynthesisReport] = []
    current_data_stream = list(initial_data_stream) # Use a mutable copy

    for cycle in range(synthesis_cycles):
        # print(f"\n===== SYNTHESIS CYCLE {cycle + 1}/{synthesis_cycles} =====")
        # print(f"Global Energy Source status: {global_energy_source.current_energy:.2f} units available.")

        if global_energy_source.current_energy <= 0:
            # print("WARNING: Global energy source depleted. Cannot continue synthesis for subsequent cycles.")
            break

        cycle_report = root_branch.conduct_synthesis(global_energy_source, current_data_stream)
        all_cycle_reports.append(cycle_report)

        # For the next cycle, the data stream becomes the artifacts produced
        # by the root branch (and its children) in the current cycle.
        # If no artifacts are produced, or if we want to ensure continuous input,
        # we can revert to a default or original stream.
        if cycle_report.synthesized_artifacts:
            current_data_stream = cycle_report.synthesized_artifacts
        elif not initial_data_stream: # If original data was empty and no artifacts
             current_data_stream = [f"placeholder_data_cycle_{cycle+1}"] * 5 # Fallback
        # If original_data_stream was not empty and no artifacts were produced, keep it the same for next cycle
        elif not current_data_stream:
             current_data_stream = list(initial_data_stream) # Revert to initial if it became empty

    # print("\n--- Nexus Branch Synthesis Calculation Complete ---")
    return all_cycle_reports

if __name__ == "__main__":
    # --- Setup Components ---
    # Global Energy Source
    global_source = EnergyConduit("Alpha_Conduit_001", initial_energy=700.0, max_capacity=1500.0, efficiency=0.9)

    # Root Branch
    root_branch = NexusBranch("NEXUS-ROOT-001", "Core Nexus Branch", initial_integrity=150.0, growth_factor=0.07, stability_factor=0.01)

    # Nodules for Root Branch
    root_branch.add_nodule(SynthesisNodule("RN-001", "Proximal", synthesis_potential=1.2, data_conversion_rate=0.6))
    root_branch.add_nodule(SynthesisNodule("RN-002", "Distal", synthesis_potential=0.8, data_conversion_rate=0.4))

    # Child Branch 1
    child_branch_1 = NexusBranch("NEXUS-CHILD-A", "Auxiliary Branch A", initial_integrity=80.0, growth_factor=0.06, stability_factor=0.015)
    child_branch_1.add_nodule(SynthesisNodule("C1N-001", "Primary", synthesis_potential=1.0, data_conversion_rate=0.5))
    child_branch_1.add_nodule(SynthesisNodule("C1N-002", "Secondary", synthesis_potential=0.7, data_conversion_rate=0.3))
    root_branch.add_child_branch(child_branch_1)

    # Grandchild Branch 1.1
    grandchild_branch_1_1 = NexusBranch("NEXUS-GCHILD-A1", "Sub-Auxiliary A1", initial_integrity=50.0, growth_factor=0.04, stability_factor=0.02)
    grandchild_branch_1_1.add_nodule(SynthesisNodule("GC11N-001", "Tertiary", synthesis_potential=0.9, data_conversion_rate=0.45))
    child_branch_1.add_child_branch(grandchild_branch_1_1)

    # Child Branch 2
    child_branch_2 = NexusBranch("NEXUS-CHILD-B", "Auxiliary Branch B", initial_integrity=90.0, growth_factor=0.065, stability_factor=0.012)
    child_branch_2.add_nodule(SynthesisNodule("C2N-001", "Main", synthesis_potential=1.1, data_conversion_rate=0.55))
    root_branch.add_child_branch(child_branch_2)

    # Initial Data Stream for Synthesis (simulating "hallucinations" or abstract data)
    initial_data_input = [
        "complex_thought_pattern_A_fragment_X1",
        "sensory_input_stream_gamma_sector_7",
        "historical_data_archive_query_alpha_prime",
        "hypothetical_simulation_result_set_delta_3",
        "undefined_signal_noise_pattern_epsilon",
        "nexus_architecture_blueprint_segment_omega",
        "energy_signature_trace_kappa_null",
        "temporal_anomaly_signature_theta_recursive",
        "inter-dimensional_flux_vector_zeta_inverted",
        "conceptual_framework_layer_9_sub_domain_Y"
    ]

    # --- Run Synthesis ---
    num_cycles = 3
    print(f"\n--- Initiating Nexus Branch Synthesis for {num_cycles} Cycles ---")
    results = calculate_nexus_branch_synthesis(root_branch, global_source, initial_data_input, synthesis_cycles=num_cycles)

    # --- Display Results ---
    print("\n===== FINAL SYNTHESIS SUMMARY =====")
    for i, report in enumerate(results):
        print(f"\n--- Cycle {i+1} Aggregate Report ---")
        print(report)

    print(f"\nGlobal Energy Source remaining: {global_source.current_energy:.2f} units.")
    print(f"\n--- Final Integrity Values ---")
    print(f"  {root_branch.name} (ID: {root_branch.id[:8]}): {root_branch.integrity:.2f}")
    for child in root_branch.children:
        print(f"    {child.name} (ID: {child.id[:8]}): {child.integrity:.2f}")
        for grandchild in child.children:
             print(f"      {grandchild.name} (ID: {grandchild.id[:8]}): {grandchild.integrity:.2f}")