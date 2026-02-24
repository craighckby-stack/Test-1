# PATTERN LOGIC APPLIED TO TARGET:

# Factory Pattern:
# • The 'create_*' factory functions (e.g., create_container_plugin_options, create_exposes_config)
#   explicitly implement the Factory Method or Simple Factory pattern. They encapsulate the creation
#   logic for complex configuration objects, centralizing object instantiation.
# • The '_type' attribute in LibraryOptions acts similarly to ExternalsType, where its string value
#   implicitly guides the "type" of object being produced or processed, thereby influencing
#   the specific configuration "product" from the factories.

# Facade Pattern:
# • ExposesObject and the 'exposes' attribute within ContainerPluginOptions act as facades.
#   They provide a simplified, unified interface for defining complex module exposure configurations,
#   hiding the underlying complexity of accepting simple strings, lists of strings, or detailed ExposesConfig objects.

# Repository Pattern:
# • The lists 'TASKS_CONTAINER_NAMES' and 'TASKS_EXPOSES_COUNTS', along with the 'task_queue' used
#   in the multiprocessing setup, collectively function as a temporary repository. They store,
#   reference, and allow retrieval of 'ContainerPluginOptions' objects (the "items") for subsequent processing.

# Strategy Pattern:
# • The '_type' attribute within LibraryOptions (e.g., "commonjs", "umd") allows users to select
#   an implementation strategy for how the library should be output or consumed. This attribute
#   defines the specific behavior or algorithm to be applied, without detailing the implementation itself.

# Template Method Pattern:
# • The 'ContainerPluginOptions' class itself embodies a structural Template Method pattern for configuration.
#   It defines a fixed "template" or skeleton for what a container plugin's configuration should look like,
#   specifying the mandatory and optional "slots" (like 'name', 'exposes', 'filename', 'library')
#   that must be filled to form a complete configuration.