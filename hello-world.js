from typing import Optional, Any, Dict, List, Callable, Protocol, TypeVar, Type, Union, Literal
import re

# Architectural Pattern: Command Pattern (via Protocol Interfaces)
# These protocols define the "command" interfaces that can be implemented by functions.
# Filter is a function that takes a ManifestItem and returns a boolean
class Filter(Protocol):
    def __call__(self, item: "ManifestItem") -> bool:
        ...

# Generate is a function that takes a ManifestObject, modifies it, and returns it
class Generate(Protocol):
    def __call__(self, manifest: "ManifestObject") -> "ManifestObject":
        ...

# Serialize is a function that takes a ManifestObject and returns a string
class Serialize(Protocol):
    def __call__(self, manifest: "ManifestObject") -> str:
        ...

# HandlerFn (from KNOWLEDGE for ProgressPlugin)
# Function that executes for every progress step.
class ProgressHandlerFunction(Protocol):
    def __call__(self, percentage: float, message: str, *args: str) -> None:
        ...

# --- NEW PROTOCOLS for SourceMapDevToolPluginOptions ---
# Condition used to match resource (string, RegExp or Function).
class MatcherFn(Protocol):
    # Assumed signature based on typical webpack matcher functions (e.g., resource string -> boolean match)
    def __call__(self, resource: str) -> bool:
        ...

# Function to create Templated Paths
class TemplatePathFn(Protocol):
    # Assumed signature based on TemplatedPathPlugin usage (e.g., pathData.url)
    def __call__(self, path_data: Dict[str, Any]) -> str:
        ...

# Function to create Module Filename Templates
class ModuleFilenameTemplateFunction(Protocol):
    # Assumed signature based on ModuleFilenameHelpers (e.g., module info dict -> string identifier)
    def __call__(self, info: Dict[str, Any]) -> str:
        ...

# --- NEW TYPES for SourceMapDevToolPluginOptions ---
Rule = Union[re.Pattern, str, MatcherFn]
Rules = Union[List[Rule], Rule]


T = TypeVar('T')

# Architectural Pattern: Decorator Pattern (and Adapter Pattern)
# This class decorator modifies target classes by adding 'to_dict' and '__repr__' methods.
# It "adapts" the class to a common interface for serialization and representation.
def _add_interface_methods(cls: Type[T]) -> Type[T]:
    """
    A class decorator to automatically add `to_dict` and `__repr__` methods
    for classes that mirror TypeScript interfaces. It assumes:
    1. Direct attributes represent explicit properties.
    2. An optional `_extra_properties` dict stores arbitrary additional properties.
    """
    def to_dict_method(self) -> Dict[str, Any]:
        data: Dict[str, Any] = {}
        for key, value in self.__dict__.items():
            if key == '_extra_properties':
                continue
            # Only include non-None values
            if value is not None:
                if hasattr(value, 'to_dict') and callable(getattr(value, 'to_dict')):
                    data[key] = value.to_dict()
                elif isinstance(value, list):
                    data[key] = [
                        v.to_dict() if hasattr(v, 'to_dict') and callable(getattr(v, 'to_dict')) else v
                        for v in value
                    ]
                elif isinstance(value, dict):
                    # Handle dictionaries that might contain nested objects with to_dict
                    processed_dict = {}
                    for k_inner, v_inner in value.items():
                        if hasattr(v_inner, 'to_dict') and callable(getattr(v_inner, 'to_dict')):
                            processed_dict[k_inner] = v_inner.to_dict()
                        else:
                            processed_dict[k_inner] = v_inner
                    data[key] = processed_dict
                else:
                    data[key] = value

        if hasattr(self, '_extra_properties') and self._extra_properties:
            # Recursively convert extra_properties if they contain objects with to_dict
            processed_extra_properties = {}
            for k, v in self._extra_properties.items():
                if hasattr(v, 'to_dict') and callable(getattr(v, 'to_dict')):
                    processed_extra_properties[k] = v.to_dict()
                else:
                    processed_extra_properties[k] = v
            data.update(processed_extra_properties)
        return data

    def repr_method(self) -> str:
        return f"{cls.__name__}({self.to_dict()})"

    cls.to_dict = to_dict_method
    cls.__repr__ = repr_method
    return cls

# Architectural Pattern: Extensible Object Pattern (Open/Closed Principle)
# This base class allows objects to have arbitrary additional properties,
# making them extensible without modifying their core definition.
class ExtensibleModel:
    """
    A base class for models that can have arbitrary additional properties,
    mirroring TypeScript interfaces with an index signature like `[k: string]: any;`.
    """
    def __init__(self, **kwargs: Any):
        # Initialize _extra_properties directly as a normal attribute before `__setattr__` is fully active
        super().__setattr__(self, '_extra_properties', {})
        # Assign all initial kwargs to _extra_properties
        for k, v in kwargs.items():
            self._extra_properties[k] = v

    def __getattr__(self, name: str) -> Any:
        """Allows access to arbitrary properties stored in _extra_properties."""
        if name in self._extra_properties:
            return self._extra_properties[name]
        # Raise AttributeError for non-existent attributes, consistent with standard Python behavior
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

    def __setattr__(self, name: str, value: Any) -> None:
        """
        Handles setting of predefined attributes or storing new/modified
        arbitrary properties in _extra_properties.
        """
        # If the attribute name is a predefined property (via type annotations)
        # or it's the special _extra_properties, set it as a normal instance attribute.
        if name in self.__annotations__ or name == '_extra_properties':
            super().__setattr__(name, value)
        # Otherwise, if _extra_properties exists, treat it as an arbitrary property.
        elif hasattr(self, '_extra_properties'):
            self._extra_properties[name] = value
        else:
            # Fallback for cases where _extra_properties might not be initialized yet
            # during very early object construction, although the ExtensibleModel.__init__
            # tries to prevent this by initializing it first.
            super().__setattr__(name, value)


@_add_interface_methods
# Architectural Pattern: Data Transfer Object (DTO)
# This class primarily holds data and has minimal behavior, serving as a DTO.
class ManifestItem:
    """
    Describes a manifest asset that links the emitted path to the producing asset.
    """
    file: str
    src: Optional[str]

    def __init__(self, file: str, src: Optional[str] = None):
        self.file = file
        self.src = src


@_add_interface_methods
# Architectural Pattern: Data Transfer Object (DTO)
# This class primarily holds data and has minimal behavior, serving as a DTO.
class ManifestEntrypoint:
    """
    Describes a manifest entrypoint.
    """
    imports: List[str]
    parents: Optional[List[str]]

    def __init__(self, imports: List[str], parents: Optional[List[str]] = None):
        self.imports = imports
        self.parents = parents


@_add_interface_methods
# Architectural Pattern: Data Transfer Object (DTO), Extensible Object, Composition
# This DTO uses Composition to hold ManifestItem and ManifestEntrypoint objects.
# It also extends ExtensibleModel, making it an Extensible Object.
class ManifestObject(ExtensibleModel):
    """
    The manifest object.
    """
    assets: Dict[str, ManifestItem]
    entrypoints: Dict[str, ManifestEntrypoint]

    # Architectural Pattern: Factory Pattern
    # The constructor acts as a factory, converting dictionaries into ManifestItem/ManifestEntrypoint objects.
    def __init__(self, assets: Optional[Dict[str, Union[ManifestItem, Dict[str, Any]]]] = None, entrypoints: Optional[Dict[str, Union[ManifestEntrypoint, Dict[str, Any]]]] = None, **kwargs: Any):
        super().__init__(**kwargs)

        self.assets = {}
        if assets is not None:
            for k, v in assets.items():
                if isinstance(v, dict):
                    self.assets[k] = ManifestItem(**v)
                else:
                    self.assets[k] = v

        self.entrypoints = {}
        if entrypoints is not None:
            for k, v in entrypoints.items():
                if isinstance(v, dict):
                    self.entrypoints[k] = ManifestEntrypoint(**v)
                else:
                    self.entrypoints[k] = v


@_add_interface_methods
# Architectural Pattern: Data Transfer Object (DTO)
class ManifestPluginOptions:
    """
    Represents the ManifestPluginOptions interface from TypeScript.
    """
    entrypoints: Optional[bool]
    filename: Optional[str]
    filter: Optional[Filter] # Command Interface
    generate: Optional[Generate] # Command Interface
    prefix: Optional[str]
    serialize: Optional[Serialize] # Command Interface

    def __init__(
        self,
        entrypoints: Optional[bool] = None,
        filename: Optional[str] = None,
        filter: Optional[Filter] = None,
        generate: Optional[Generate] = None,
        prefix: Optional[str] = None,
        serialize: Optional[Serialize] = None,
    ):
        self.entrypoints = entrypoints
        self.filename = filename
        self.filter = filter
        self.generate = generate
        self.prefix = prefix
        self.serialize = serialize


# Architectural Pattern: Factory Pattern
# This factory function encapsulates the creation logic for ManifestPluginOptions.
def create_manifest_plugin_options(**kwargs: Any) -> ManifestPluginOptions:
    """
    A factory function to create instances of ManifestPluginOptions.
    It takes all desired options as keyword arguments and correctly
    distributes them to the ManifestPluginOptions constructor.
    """
    known_args: Dict[str, Any] = {}

    for prop_name in ManifestPluginOptions.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)

    if kwargs:
        raise TypeError(f"ManifestPluginOptions got unexpected arguments: {', '.join(kwargs.keys())}")

    return ManifestPluginOptions(**known_args)

@_add_interface_methods
# Architectural Pattern: Data Transfer Object (DTO)
class ProgressPluginOptions:
    """
    Options object for the ProgressPlugin.
    """
    activeModules: Optional[bool]
    dependencies: Optional[bool]
    dependenciesCount: Optional[int]
    entries: Optional[bool]
    handler: Optional[ProgressHandlerFunction] # Command Interface
    modules: Optional[bool]
    modulesCount: Optional[int]
    percentBy: Optional[Literal["entries", "modules", "dependencies"]]
    profile: Optional[bool]

    def __init__(
        self,
        activeModules: Optional[bool] = None,
        dependencies: Optional[bool] = None,
        dependenciesCount: Optional[int] = None,
        entries: Optional[bool] = None,
        handler: Optional[ProgressHandlerFunction] = None,
        modules: Optional[bool] = None,
        modulesCount: Optional[int] = None,
        percentBy: Optional[Literal["entries", "modules", "dependencies"]] = None,
        profile: Optional[bool] = None,
    ):
        self.activeModules = activeModules
        self.dependencies = dependencies
        self.dependenciesCount = dependenciesCount
        self.entries = entries
        self.handler = handler
        self.modules = modules
        self.modulesCount = modulesCount
        self.percentBy = percentBy
        self.profile = profile

ProgressPluginArgument = Union[ProgressPluginOptions, ProgressHandlerFunction]

# Architectural Pattern: Factory Pattern
# This factory function encapsulates the creation logic for ProgressPluginOptions.
def create_progress_plugin_options(**kwargs: Any) -> ProgressPluginOptions:
    """
    A factory function to create instances of ProgressPluginOptions.
    It takes all desired options as keyword arguments and correctly
    distributes them to the ProgressPluginOptions constructor.
    """
    known_args: Dict[str, Any] = {}
    for prop_name in ProgressPluginOptions.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)

    if kwargs:
        raise TypeError(f"ProgressPluginOptions got unexpected arguments: {', '.join(kwargs.keys())}")

    return ProgressPluginOptions(**known_args)

@_add_interface_methods
# Architectural Pattern: Data Transfer Object (DTO)
class SourceMapDevToolPluginOptions:
    """
    Options for SourceMapDevToolPlugin.
    """
    append: Optional[Union[Literal[False, None], str, TemplatePathFn]] # Command Interface
    columns: Optional[bool]
    debugIds: Optional[bool]
    exclude: Optional[Rules] # Contains MatcherFn (Command Interface)
    fallbackModuleFilenameTemplate: Optional[Union[str, ModuleFilenameTemplateFunction]] # Command Interface
    fileContext: Optional[str]
    filename: Optional[Union[Literal[False, None], str]]
    ignoreList: Optional[Rules] # Contains MatcherFn (Command Interface)
    include: Optional[Rules] # Contains MatcherFn (Command Interface)
    module: Optional[bool]
    moduleFilenameTemplate: Optional[Union[str, ModuleFilenameTemplateFunction]] # Command Interface
    namespace: Optional[str]
    noSources: Optional[bool]
    publicPath: Optional[str]
    sourceRoot: Optional[str]
    test: Optional[Rules] # Contains MatcherFn (Command Interface)

    def __init__(
        self,
        append: Optional[Union[Literal[False, None], str, TemplatePathFn]] = None,
        columns: Optional[bool] = None,
        debugIds: Optional[bool] = None,
        exclude: Optional[Rules] = None,
        fallbackModuleFilenameTemplate: Optional[Union[str, ModuleFilenameTemplateFunction]] = None,
        fileContext: Optional[str] = None,
        filename: Optional[Union[Literal[False, None], str]] = None,
        ignoreList: Optional[Rules] = None,
        include: Optional[Rules] = None,
        module: Optional[bool] = None,
        moduleFilenameTemplate: Optional[Union[str, ModuleFilenameTemplateFunction]] = None,
        namespace: Optional[str] = None,
        noSources: Optional[bool] = None,
        publicPath: Optional[str] = None,
        sourceRoot: Optional[str] = None,
        test: Optional[Rules] = None,
    ):
        self.append = append
        self.columns = columns
        self.debugIds = debugIds
        self.exclude = exclude
        self.fallbackModuleFilenameTemplate = fallbackModuleFilenameTemplate
        self.fileContext = fileContext
        self.filename = filename
        self.ignoreList = ignoreList
        self.include = include
        self.module = module
        self.moduleFilenameTemplate = moduleFilenameTemplate
        self.namespace = namespace
        self.noSources = noSources
        self.publicPath = publicPath
        self.sourceRoot = sourceRoot
        self.test = test


# Architectural Pattern: Factory Pattern
# This factory function encapsulates the creation logic for SourceMapDevToolPluginOptions.
def create_source_map_dev_tool_plugin_options(**kwargs: Any) -> SourceMapDevToolPluginOptions:
    """
    A factory function to create instances of SourceMapDevToolPluginOptions.
    It takes all desired options as keyword arguments and correctly
    distributes them to the SourceMapDevToolPluginOptions constructor.
    """
    known_args: Dict[str, Any] = {}
    for prop_name in SourceMapDevToolPluginOptions.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)

    if kwargs:
        raise TypeError(f"SourceMapDevToolPluginOptions got unexpected arguments: {', '.join(kwargs.keys())}")

    return SourceMapDevToolPluginOptions(**known_args)