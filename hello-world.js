* Strategy Pattern:
    - The `entryOnly` boolean property allows the DllPlugin to switch between distinct algorithms for exposing modules, either focusing only on entry points (when `true`) or potentially a broader set (when `false`), encapsulating these behaviors as interchangeable strategies.
* Builder Pattern:
    - DllPluginOptions provides a clear, property-by-property structure (`context`, `entryOnly`, `format`, `name`, `path`, `type`) for assembling a complex configuration for the DllPlugin, acting as the blueprint for what a builder would construct to configure the plugin.
* Value Object:
    - The DllPluginOptions interface defines a data-centric object whose identity is based purely on the values of its properties, grouping related configuration settings that define a specific state or characteristic for the DllPlugin.