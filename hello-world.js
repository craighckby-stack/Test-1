# Represents the PluginOptions interfaces from TARGET,
# analogous to AggressiveSplittingPluginOptions in KNOWLEDGE.
# These are simple data structures for configuration.

class BasePluginOptions:
    """Base class for all plugin options,
    analogous to AggressiveSplittingPluginOptions in its role as a configuration type."""
    pass

class OccurrenceChunkIdsPluginOptions(BasePluginOptions):
    """Configuration for Occurrence Chunk IDs Plugin.
    This class's attributes represent the customizable aspects of the plugin's behavior."""
    def __init__(self, chunk_setting: int = 1, chunk_strategy: str = "default"):
        self.chunk_setting = chunk_setting
        self.chunk_strategy = chunk_strategy

class OccurrenceModuleIdsPluginOptions(BasePluginOptions):
    """Configuration for Occurrence Module IDs Plugin."""
    def __init__(self, module_option: bool = True):
        self.module_option = module_option

# --- Applying Logic from KNOWLEDGE to TARGET patterns ---

# Dependency Injection:
# PluginOptions objects (e.g., OccurrenceChunkIdsPluginOptions, which serves
# the same role as AggressiveSplittingPluginOptions from KNOWLEDGE in defining configuration)
# are created externally and then 'injected' (passed as arguments) into the functions
# or worker processes that require this configuration to execute their tasks.
def worker_process(task_function, plugin_options: BasePluginOptions):
    """A simulated worker process that receives its task and configuration via Dependency Injection."""
    print(f"Worker executing task '{task_function.__name__}' with options from: {plugin_options.__class__.__name__}")
    task_function(plugin_options)

def get_prioritise_initial_setting(options: OccurrenceChunkIdsPluginOptions):
    """A task function that explicitly depends on OccurrenceChunkIdsPluginOptions."""
    print(f"  - Prioritising initial setting based on: {options.chunk_setting}, strategy: {options.chunk_strategy}")

# Factory Pattern:
# Functions like `create_occurrence_chunk_ids_plugin_options` are explicit factory methods.
# They centralize and encapsulate the logic for constructing instances of specific
# `PluginOptions` classes (like `OccurrenceChunkIdsPluginOptions`). This mirrors the
# concept of creating complex configuration objects like `AggressiveSplittingPluginOptions`.
def create_occurrence_chunk_ids_plugin_options(**kwargs) -> OccurrenceChunkIdsPluginOptions:
    """Factory function for creating OccurrenceChunkIdsPluginOptions instances."""
    return OccurrenceChunkIdsPluginOptions(
        chunk_setting=kwargs.get("chunk_setting", 1),
        chunk_strategy=kwargs.get("chunk_strategy", "default")
    )

def create_occurrence_module_ids_plugin_options(**kwargs) -> OccurrenceModuleIdsPluginOptions:
    """Factory function for creating OccurrenceModuleIdsPluginOptions instances."""
    return OccurrenceModuleIdsPluginOptions(
        module_option=kwargs.get("module_option", True)
    )

# Example usage of factories:
occurrence_options1 = create_occurrence_chunk_ids_plugin_options(chunk_setting=10, chunk_strategy="aggressive")
occurrence_options2 = create_occurrence_module_ids_plugin_options(module_option=False)

# Composite Pattern:
# The `TASKS_...` lists (e.g., `TASKS_OCCURRENCE_CHUNK_IDS`) act as composites,
# combining individual task units (represented as tuples of `(function, PluginOptions)`).
# Each `PluginOptions` object (like `occurrence_options1`), playing a role analogous
# to an instance of `AggressiveSplittingPluginOptions`, is a 'leaf' component within
# this larger, unified task structure.
TASKS_OCCURRENCE_CHUNK_IDS = [
    (get_prioritise_initial_setting, occurrence_options1),
    # More tasks could be added here, each potentially with different PluginOptions instances
]
# Example processing of the composite structure:
# for func, options in TASKS_OCCURRENCE_CHUNK_IDS:
#     worker_process(func, options)

# Single Responsibility Principle (SRP):
# Each `PluginOptions` interface or class (e.g., `OccurrenceChunkIdsPluginOptions`)
# adheres to SRP by having a single, focused responsibility: defining the
# configuration parameters for a specific plugin or feature.
# This directly reflects `AggressiveSplittingPluginOptions` from KNOWLEDGE,
# which is solely responsible for specifying aggressive splitting parameters.
# Similarly, factory functions adhere to SRP by only handling the creation of a specific type of options object.

# Strategy Pattern:
# The `PluginOptions` objects (like `occurrence_options1`, analogous to the configuration
# provided by `AggressiveSplittingPluginOptions`) define parameters that customize the behavior
# of the 'strategy' functions (e.g., `get_prioritise_initial_setting`).
# The actual execution logic (the 'strategy') is encapsulated in the function,
# but its specific behavior is determined by the options object passed to it.
# The `(function, options)` tuples effectively bundle a strategy with its specific configuration.
# Example: `get_prioritise_initial_setting` is a strategy; its execution details are guided by `occurrence_options1`.

# Observer Pattern:
# The TARGET description explicitly states that the Observer Pattern is "Not directly applicable."
# KNOWLEDGE (the AggressiveSplittingPluginOptions interface) also does not contain
# any elements or implications of an Observer Pattern.
# Therefore, no direct application of this pattern is observed or can be derived here.

# Example orchestration mimicking _run_tasks_with_multiprocessing from TARGET:
# if __name__ == "__main__":
#     print("--- Demonstrating Pattern Applications ---")
#
#     # Factory and SRP (for options creation)
#     options_chunk_ids = create_occurrence_chunk_ids_plugin_options(chunk_setting=25, chunk_strategy="balanced")
#     options_module_ids = create_occurrence_module_ids_plugin_options(module_option=True)
#
#     # Dependency Injection and Strategy (passing options to tasks)
#     print("\nExecuting individual tasks (DI & Strategy):")
#     worker_process(get_prioritise_initial_setting, options_chunk_ids)
#
#     # Composite (executing a collection of tasks)
#     print("\nExecuting composite task list (Composite, DI & Strategy):")
#     for task_func, task_options in TASKS_OCCURRENCE_CHUNK_IDS:
#         worker_process(task_func, task_options)
#     print("--- End of Demonstration ---")