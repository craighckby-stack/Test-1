from typing import Optional, Any, Dict, List, Callable, Protocol, TypeVar, Type, Union

# Define Callable types for the functions referenced in ManifestPluginOptions
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

T = TypeVar('T')

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
class ManifestObject(ExtensibleModel):
    """
    The manifest object.
    """
    assets: Dict[str, ManifestItem]
    entrypoints: Dict[str, ManifestEntrypoint]

    def __init__(self, assets: Optional[Dict[str, Union[ManifestItem, Dict[str, Any]]]] = None, entrypoints: Optional[Dict[str, Union[ManifestEntrypoint, Dict[str, Any]]]] = None, **kwargs: Any):
        super().__init__(**kwargs) # Handles arbitrary extra properties
        
        self.assets = {}
        if assets is not None:
            for k, v in assets.items():
                if isinstance(v, dict):
                    self.assets[k] = ManifestItem(**v)
                else:
                    self.assets[k] = v # Assume it's already a ManifestItem

        self.entrypoints = {}
        if entrypoints is not None:
            for k, v in entrypoints.items():
                if isinstance(v, dict):
                    self.entrypoints[k] = ManifestEntrypoint(**v)
                else:
                    self.entrypoints[k] = v # Assume it's already a ManifestEntrypoint


@_add_interface_methods
class ManifestPluginOptions:
    """
    Represents the ManifestPluginOptions interface from TypeScript.
    """
    entrypoints: Optional[bool]
    filename: Optional[str]
    filter: Optional[Filter]
    generate: Optional[Generate]
    prefix: Optional[str]
    serialize: Optional[Serialize]

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


def create_manifest_plugin_options(**kwargs: Any) -> ManifestPluginOptions:
    """
    A factory function to create instances of ManifestPluginOptions.
    It takes all desired options as keyword arguments and correctly
    distributes them to the ManifestPluginOptions constructor.
    """
    # Initialize known arguments dictionary
    known_args: Dict[str, Any] = {}

    # Iterate through the expected attributes of ManifestPluginOptions to extract them from kwargs.
    # This also handles cases where the value might be a callable (for filter, generate, serialize).
    for prop_name in ManifestPluginOptions.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)

    # If any unexpected keyword arguments remain, raise a TypeError.
    # ManifestPluginOptions does not have an index signature like `[k: string]: any;` in TypeScript.
    if kwargs:
        raise TypeError(f"ManifestPluginOptions got unexpected arguments: {', '.join(kwargs.keys())}")

    return ManifestPluginOptions(**known_args)