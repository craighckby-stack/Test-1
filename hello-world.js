* Composite Pattern:
    - BannerPluginArgument can be a string, BannerPluginOptions, or BannerFunction, which are different ways to define the banner content.
    - Rules can be an array of Rule or a single Rule, allowing for a tree-like structure of filtering conditions.
* Strategy Pattern:
    - `banner` in `BannerPluginOptions` can be either a `string` or a `BannerFunction`, allowing the user to choose different strategies for defining the banner's content.
* Decorator Pattern:
    - The `raw` option in `BannerPluginOptions` acts as a decorator, modifying the default behavior of the banner by preventing it from being wrapped in a comment.
* Template Method Pattern:
    - The `BannerPlugin` (not fully shown, but implied by `BannerPluginArgument` and `BannerPluginOptions`) likely defines a template for how banners are applied, with `banner` (string or function), `include`, `exclude`, `footer`, `entryOnly`, `raw`, and `stage` being customizable steps or parameters within that template.
* Builder Pattern:
    - `BannerPluginOptions` provides a clear structure for building a complex banner configuration step-by-step through its various properties (`banner`, `entryOnly`, `exclude`, etc.), rather than through a long constructor.
* Chain of Responsibility Pattern:
    - The `include`, `exclude`, and `test` options in `BannerPluginOptions` (which use `Rules`) can be seen as defining a chain of conditions that a module must pass or fail for the banner to be applied. Each rule in `Rules` could potentially be a "handler" in the chain.
* Proxy Pattern:
    - `BannerFunction` acts as a proxy for the actual banner content, allowing for dynamic generation or deferred execution of the banner content at the time of application.
* Facade Pattern:
    - The `BannerPluginArgument` type serves as a simplified interface (a "facade") for defining a banner, allowing users to provide a simple string, a function, or a full options object without needing to know all the internal details of `BannerPluginOptions` immediately.