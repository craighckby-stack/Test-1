*   **Command-Query Separation pattern:**
    *   Classes like `ManifestItem`, `ManifestEntrypoint`, `ManifestObject`, and `ManifestPluginOptions` primarily serve as data holders (queries about state).
    *   The `to_dict` method, added by the `_add_interface_methods` decorator, is a query operation that returns a dictionary representation of the object's state.
    *   The `Generate` protocol defines a "command" (or operation) that modifies a `ManifestObject`.
    *   The `Filter` protocol defines a "query" (predicate) on a `ManifestItem`.
*   **Single Responsibility Principle pattern:**
    *   Each class generally has a single responsibility: `ManifestItem` for an asset, `ManifestEntrypoint` for an entrypoint, `ExtensibleModel` for dynamic properties, `ManifestObject` for the overall manifest structure, and `ManifestPluginOptions` for plugin configuration.
    *   The `_add_interface_methods` decorator has the responsibility of injecting common interface methods (`to_dict`, `__repr__`).
    *   `create_manifest_plugin_options` is responsible for safely constructing `ManifestPluginOptions` instances with strict argument validation.
*   **Factory Pattern pattern:**
    *   The `create_manifest_plugin_options` function is a clear **Simple Factory** (or Factory Method) responsible for creating instances of `ManifestPluginOptions`.
    *   The `ManifestObject.__init__` method acts as an internal factory, converting dictionaries into `ManifestItem` and `ManifestEntrypoint` objects for its `assets` and `entrypoints` properties.
*   **Template Method pattern:**
    *   The `_add_interface_methods` class decorator applies a common "template" of methods (`to_dict`, `__repr__`) to any class it decorates, ensuring a consistent interface for serialization and representation across different data models. The `to_dict` method itself follows a recursive template for converting nested objects.
*   **Strategy pattern:**
    *   The `filter`, `generate`, and `serialize` attributes in `ManifestPluginOptions` (which are defined by `Filter`, `Generate`, and `Serialize` protocols) are explicit examples of the Strategy pattern. They allow different algorithms or behaviors for filtering manifest items, generating/modifying the manifest, and serializing the final manifest to be injected and swapped at runtime.
*   **Dependency Inversion Principle (DIP):**
    *   The `ManifestPluginOptions` class depends on the `Filter`, `Generate`, and `Serialize` **protocols** (abstractions) rather than concrete implementations. This allows the high-level `ManifestPluginOptions` to remain decoupled from the specific details of how filtering, generation, or serialization are performed, adhering to DIP.
*   **Decorator Pattern:**
    *   The `_add_interface_methods` function is a class decorator, which is a structural design pattern that dynamically adds new behavior (methods `to_dict` and `__repr__`) to objects without changing their original class.
*   **Composite Pattern:**
    *   `ManifestObject` can be seen as a composite structure, as it contains collections of `ManifestItem` and `ManifestEntrypoint` objects. It represents a "whole" that is composed of "parts."
*   **Open/Closed Principle (OCP):**
    *   The `ExtensibleModel` class exemplifies OCP by allowing the addition of arbitrary, dynamic properties (`_extra_properties`) without modifying its core code. This means the class is "open for extension" but "closed for modification."
*   **Protocol/Interface Pattern:**
    *   The `Filter`, `Generate`, and `Serialize` `Protocol` definitions establish clear interfaces for callable objects, enabling type-checking and facilitating the Strategy and DIP patterns.