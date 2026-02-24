*   **Dependency Injection**:
    *   `getLogger(name?: string)`: Provides an instance of a `Logger` service to the loader.
    *   `resolve(context: string, request: string, callback: ResolveCallback)`: Injects the capability to resolve modules.
    *   `_module`, `_compilation`, `_compiler`: References to core Webpack objects are provided.

*   **Service Locator**:
    *   `getOptions(schema?: Schema)`: Allows the loader to retrieve its own configuration options.
    *   `loadModule(...)`, `importModule(...)`: Provides access to services for loading other modules dynamically.
    *   `getResolve(options?: ResolveOptionsWithDependencyType)`: Locates and provides a configured resolver function.

*   **Facade**:
    *   `emitWarning(warning: Error)`, `emitError(error: Error)`: Simplifies error and warning reporting to the Webpack compilation.
    *   `emitFile(...)`: Provides a simplified interface for outputting new files during compilation.
    *   `utils`: Groups common utility functions (`absolutify`, `contextify`, `createHash`) under a single interface.
    *   `rootContext`, `fs`, `sourceMap`, `mode`, `webpack`, `hashFunction`, `hashDigest`, `hashDigestLength`, `hashSalt`: These properties provide a simplified view of the compilation environment and configuration.

*   **Factory Method**:
    *   `getResolve(options?: ResolveOptionsWithDependencyType)`: Creates and returns a resolver function, potentially configured based on provided options.
    *   `utils.createHash(algorithm?: string | typeof Hash)`: Creates a hash object instance.

*   **Strategy**:
    *   `async()`: Allows the loader to switch its execution strategy from synchronous to asynchronous.
    *   `cacheable(flag?: boolean)`: Configures the caching strategy for the loader's result.
    *   `getResolve(options?: ResolveOptionsWithDependencyType)`: The `options` parameter enables retrieving different resolution strategies.

*   **Command**:
    *   `addBuildDependency(dep: string)`, `addContextDependency(context: string)`, `addDependency(file: string)`, `addMissingDependency(context: string)`: These methods act as commands to register various types of dependencies with the compilation.
    *   `clearDependencies()`: A command to remove all registered dependencies.

*   **Callback**:
    *   `callback`: The primary mechanism for asynchronous loaders to return their results and signal completion.
    *   `resolve(..., callback)`, `loadModule(..., callback)`: Asynchronous operations within the loader context rely on callbacks for result handling.

*   **Chain of Responsibility**:
    *   `loaders` property: Represents the ordered list of loaders, through which the resource content passes sequentially, implying a chain of processing.

*   **Decorator**:
    *   `LoaderContext<OptionsType> & ContextAdditions`: The TypeScript intersection type used in loader definitions effectively "decorates" the base `LoaderContext` with additional, specific properties for a given loader.