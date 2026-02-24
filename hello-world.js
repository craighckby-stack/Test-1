@_add_interface_methods
class WatchIgnorePluginOptions:
    """
    Options for WatchIgnorePlugin.
    """
    paths: List[Union[re.Pattern, str]]

    def __init__(
        self,
        paths: List[Union[re.Pattern, str]],
    ):
        self.paths = paths


def create_watch_ignore_plugin_options(**kwargs: Any) -> WatchIgnorePluginOptions:
    """
    A factory function to create instances of WatchIgnorePluginOptions.
    It takes all desired options as keyword arguments and correctly
    distributes them to the WatchIgnorePluginOptions constructor.
    """
    known_args: Dict[str, Any] = {}
    for prop_name in WatchIgnorePluginOptions.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)

    if kwargs:
        raise TypeError(f"WatchIgnorePluginOptions got unexpected arguments: {', '.join(kwargs.keys())}")

    return WatchIgnorePluginOptions(**known_args)