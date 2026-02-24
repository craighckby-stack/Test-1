from typing import Optional, Any, Dict

# Decorator to add common interface-like methods to the class
def _add_interface_methods(cls):
    """
    A class decorator to automatically add `to_dict` and `__repr__` methods.
    It assumes the class structure includes 'debug', 'minimize', 'options' attributes
    and an '_extra_properties' dictionary for arbitrary key-value pairs.
    """
    def to_dict_method(self) -> Dict[str, Any]:
        data: Dict[str, Any] = {}
        if hasattr(self, 'debug') and self.debug is not None:
            data['debug'] = self.debug
        if hasattr(self, 'minimize') and self.minimize is not None:
            data['minimize'] = self.minimize
        if hasattr(self, 'options') and self.options:
            data['options'] = self.options
        if hasattr(self, '_extra_properties'):
            data.update(self._extra_properties)
        return data

    def repr_method(self) -> str:
        return f"{cls.__name__}({self.to_dict()})"

    cls.to_dict = to_dict_method
    cls.__repr__ = repr_method
    return cls

@_add_interface_methods
class LoaderOptionsPluginOptions:
    """
    Represents the LoaderOptionsPluginOptions interface from TypeScript.
    Supports optional properties 'debug', 'minimize', 'options',
    and arbitrary additional properties via **kwargs.
    """
    def __init__(self, debug: Optional[bool] = None, minimize: Optional[bool] = None, options: Optional[Dict[str, Any]] = None, **kwargs: Any):
        self.debug = debug
        self.minimize = minimize
        self.options = options if options is not None else {}
        self._extra_properties: Dict[str, Any] = kwargs # Stores arbitrary additional root-level properties

    def __getattr__(self, name: str) -> Any:
        """Allows access to arbitrary properties stored in _extra_properties."""
        if name in self._extra_properties:
            return self._extra_properties[name]
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

    def __setattr__(self, name: str, value: Any) -> None:
        """
        Handles setting of predefined attributes or storing new/modified
        arbitrary properties in _extra_properties.
        """
        if name in ['debug', 'minimize', 'options', '_extra_properties']:
            super().__setattr__(name, value)
        else:
            # For dynamic properties, store them in _extra_properties
            if hasattr(self, '_extra_properties'):
                self._extra_properties[name] = value
            else:
                # During initial object construction, _extra_properties might not be set yet
                super().__setattr__(name, value)


# Factory Function
def create_loader_options(**kwargs: Any) -> LoaderOptionsPluginOptions:
    """
    A factory function to create instances of LoaderOptionsPluginOptions.
    It takes all desired options as keyword arguments and correctly
    distributes them to the LoaderOptionsPluginOptions constructor,
    handling both predefined and arbitrary properties.
    """
    return LoaderOptionsPluginOptions(**kwargs)

# Example Usage: Demonstrates creating and interacting with LoaderOptionsPluginOptions instances.
# This reflects the pattern of defining a class/policy and then instantiating/using it.
loader_opts_instance = create_loader_options(
    debug=True,
    minimize=False,
    options={
        "context": "/path/to/project",
        "legacyConfig": {"mode": "development", "version": 1}
    },
    customPluginName="MyCoolPlugin",
    timeoutMs=5000
)

# Accessing attributes
# print(f"Debug mode: {loader_opts_instance.debug}")
# print(f"Minimize mode: {loader_opts_instance.minimize}")
# print(f"Options context: {loader_opts_instance.options.get('context')}")
# print(f"Custom plugin name: {loader_opts_instance.customPluginName}")
# print(f"Timeout: {loader_opts_instance.timeoutMs} ms")

# Modifying attributes
loader_opts_instance.debug = False
loader_opts_instance.newDynamicProp = "a_new_value"

# Converting to a dictionary (useful for serialization or inspection)
# print("\nLoader Options as Dictionary:")
# print(loader_opts_instance.to_dict())

# Representing the object
# print("\nLoader Options Object Representation:")
# print(loader_opts_instance)