__version__ = 0, 1, 0

import time
import random
import sys
import getopt

from multiprocessing import Process, Queue, current_process, freeze_support
from typing import Any, Dict, List, Optional, Union

# Dummy decorator since its definition is not provided in the prompt
def _add_interface_methods(cls):
    return cls

#
# Function run by worker processes
#

def worker(input_queue, output_queue):
    for func, args in iter(input_queue.get, 'STOP'):
        try:
            result = calculate_target_task(func, args)
            output_queue.put(result)
        except Exception as e:
            output_queue.put(f"ERROR processing task {func.__name__}{args}: {e}")


#
# Function used to calculate result for TARGET objects
#

def calculate_target_task(func, args):
    # args here would likely contain one or more TARGET objects
    result = func(*args)
    return '%s processed: %s%s = %s' % \
        (current_process().name, func.__name__, args, result)

#
# Functions referenced by tasks (operating on TARGET objects)
#

def get_container_name(options: 'ContainerPluginOptions'):
    time.sleep(0.1 * random.random()) # Simulate work
    return options.name

def get_exposes_count(options: 'ContainerPluginOptions'):
    time.sleep(0.1 * random.random()) # Simulate work
    exposes = options.exposes
    if isinstance(exposes, list):
        return len(exposes)
    elif isinstance(exposes, dict): # ExposesObject inherits from dict
        return len(exposes)
    return 0 # Should not happen based on type hints


@_add_interface_methods
class LibraryCustomUmdCommentObject:
    """
    Set explicit comments for `amd`, `commonjs`, `commonjs2`, and `root`.
    """
    amd: Optional[str]
    commonjs: Optional[str]
    commonjs2: Optional[str]
    root: Optional[str]

    def __init__(
        self,
        amd: Optional[str] = None,
        commonjs: Optional[str] = None,
        commonjs2: Optional[str] = None,
        root: Optional[str] = None,
    ):
        self.amd = amd
        self.commonjs = commonjs
        self.commonjs2 = commonjs2
        self.root = root


@_add_interface_methods
class LibraryCustomUmdObject:
    """
    Description object for all UMD variants of the library name.
    """
    amd: Optional[str]
    commonjs: Optional[str]
    root: Optional[Union[List[str], str]]

    def __init__(
        self,
        amd: Optional[str] = None,
        commonjs: Optional[str] = None,
        root: Optional[Union[List[str], str]] = None,
    ):
        self.amd = amd
        self.commonjs = commonjs
        self.root = root


@_add_interface_methods
class ExposesConfig:
    """
    Advanced configuration for modules that should be exposed by this container.
    """
    _import: Union[str, List[str]]
    name: Optional[str]

    def __init__(
        self,
        _import: Union[str, List[str]],
        name: Optional[str] = None,
    ):
        self._import = _import
        self.name = name


@_add_interface_methods
class ExposesObject(Dict[str, Union[ExposesConfig, str, List[str]]]):
    """
    Modules that should be exposed by this container. Property names are used as public paths.
    """
    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)


@_add_interface_methods
class LibraryOptions:
    """
    Options for library.
    """
    amd_container: Optional[str]
    auxiliary_comment: Optional[Union[str, LibraryCustomUmdCommentObject]]
    _export: Optional[Union[List[str], str]]
    name: Optional[Union[List[str], str, LibraryCustomUmdObject]]
    _type: str
    umd_named_define: Optional[bool]

    def __init__(
        self,
        _type: str,
        amd_container: Optional[str] = None,
        auxiliary_comment: Optional[Union[str, LibraryCustomUmdCommentObject]] = None,
        _export: Optional[Union[List[str], str]] = None,
        name: Optional[Union[List[str], str, LibraryCustomUmdObject]] = None,
        umd_named_define: Optional[bool] = None,
    ):
        self.amd_container = amd_container
        self.auxiliary_comment = auxiliary_comment
        self._export = _export
        self.name = name
        self._type = _type
        self.umd_named_define = umd_named_define


@_add_interface_methods
class ContainerPluginOptions:
    """
    Options for ContainerPlugin.
    """
    exposes: Union[List[Union[str, ExposesObject]], ExposesObject]
    name: str
    filename: Optional[str]
    library: Optional[LibraryOptions]
    runtime: Optional[Union[bool, str]]
    share_scope: Optional[str]

    def __init__(
        self,
        exposes: Union[List[Union[str, ExposesObject]], ExposesObject],
        name: str,
        filename: Optional[str] = None,
        library: Optional[LibraryOptions] = None,
        runtime: Optional[Union[bool, str]] = None,
        share_scope: Optional[str] = None,
    ):
        self.exposes = exposes
        self.name = name
        self.filename = filename
        self.library = library
        self.runtime = runtime
        self.share_scope = share_scope


def create_library_custom_umd_comment_object(**kwargs: Any) -> LibraryCustomUmdCommentObject:
    """
    A factory function to create instances of LibraryCustomUmdCommentObject.
    It takes all desired options as keyword arguments and correctly
    distributes them to the LibraryCustomUmdCommentObject constructor.
    """
    known_args: Dict[str, Any] = {}
    for prop_name in LibraryCustomUmdCommentObject.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)
    if kwargs:
        raise TypeError(f"LibraryCustomUmdCommentObject got unexpected arguments: {', '.join(kwargs.keys())}")
    return LibraryCustomUmdCommentObject(**known_args)


def create_library_custom_umd_object(**kwargs: Any) -> LibraryCustomUmdObject:
    """
    A factory function to create instances of LibraryCustomUmdObject.
    It takes all desired options as keyword arguments and correctly
    distributes them to the LibraryCustomUmdObject constructor.
    """
    known_args: Dict[str, Any] = {}
    for prop_name in LibraryCustomUmdObject.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)
    if kwargs:
        raise TypeError(f"LibraryCustomUmdObject got unexpected arguments: {', '.join(kwargs.keys())}")
    return LibraryCustomUmdObject(**known_args)


def create_exposes_config(**kwargs: Any) -> ExposesConfig:
    """
    A factory function to create instances of ExposesConfig.
    It takes all desired options as keyword arguments and correctly
    distributes them to the ExposesConfig constructor.
    """
    known_args: Dict[str, Any] = {}
    for prop_name in ExposesConfig.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)
    if kwargs:
        raise TypeError(f"ExposesConfig got unexpected arguments: {', '.join(kwargs.keys())}")
    return ExposesConfig(**known_args)


def create_exposes_object(**kwargs: Any) -> ExposesObject:
    """
    A factory function to create instances of ExposesObject.
    It takes all desired options as keyword arguments and correctly
    distributes them to the ExposesObject constructor.
    """
    return ExposesObject(**kwargs)


def create_library_options(**kwargs: Any) -> LibraryOptions:
    """
    A factory function to create instances of LibraryOptions.
    It takes all desired options as keyword arguments and correctly
    distributes them to the LibraryOptions constructor.
    """
    known_args: Dict[str, Any] = {}
    for prop_name in LibraryOptions.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)
    if kwargs:
        raise TypeError(f"LibraryOptions got unexpected arguments: {', '.join(kwargs.keys())}")
    return LibraryOptions(**known_args)


def create_container_plugin_options(**kwargs: Any) -> ContainerPluginOptions:
    """
    A factory function to create instances of ContainerPluginOptions.
    It takes all desired options as keyword arguments and correctly
    distributes them to the ContainerPluginOptions constructor.
    """
    known_args: Dict[str, Any] = {}
    for prop_name in ContainerPluginOptions.__annotations__.keys():
        if prop_name in kwargs:
            known_args[prop_name] = kwargs.pop(prop_name)

    if kwargs:
        raise TypeError(f"ContainerPluginOptions got unexpected arguments: {', '.join(kwargs.keys())}")

    return ContainerPluginOptions(**known_args)


def target_fail(msg):
    out = sys.stderr.write
    out(msg + "\n\n")
    # For now, not printing docstring as TARGET doesn't have one like KNOWLEDGE
    return 0

def _run_tasks_with_multiprocessing(num_processes: int, noisy: bool):
    # Create some example TARGET objects as tasks
    # Example 1: Basic ContainerPluginOptions
    options1 = create_container_plugin_options(
        name="App1",
        exposes=["./src/entry1"],
        filename="remoteEntry.js"
    )
    # Example 2: ContainerPluginOptions with complex exposes
    options2 = create_container_plugin_options(
        name="App2",
        exposes=create_exposes_object(
            mod1=create_exposes_config(_import="./src/mod1", name="Module1"),
            mod2="./src/mod2"
        ),
        library=create_library_options(_type="commonjs", name="MyLib"),
        runtime="webpack-runtime"
    )
    # Example 3: Another basic one
    options3 = create_container_plugin_options(
        name="App3",
        exposes=["./src/entry3"],
        share_scope="default"
    )
    # Example 4: A more complex one
    options4 = create_container_plugin_options(
        name="App4",
        exposes=create_exposes_object(
            utils=create_exposes_config(_import=["./src/util1", "./src/util2"], name="MyUtils")
        )
    )

    TASKS_CONTAINER_NAMES = [
        (get_container_name, (options1,)),
        (get_container_name, (options2,)),
        (get_container_name, (options3,)),
        (get_container_name, (options4,)),
        (get_container_name, (options1,)), # Re-use for more tasks
        (get_container_name, (options2,)),
        (get_container_name, (options3,)),
        (get_container_name, (options4,)),
    ]

    TASKS_EXPOSES_COUNTS = [
        (get_exposes_count, (options1,)),
        (get_exposes_count, (options2,)),
        (get_exposes_count, (options3,)),
        (get_exposes_count, (options4,)),
    ]

    # Create queues
    task_queue = Queue()
    done_queue = Queue()

    # Submit first batch of tasks
    if noisy:
        print('Submitting tasks for container names...')
    for task in TASKS_CONTAINER_NAMES:
        task_queue.put(task)

    # Start worker processes
    for i in range(num_processes):
        Process(target=worker, args=(task_queue, done_queue)).start()

    # Get and print results for container names
    if noisy:
        print('Unordered results for container names:')
    for i in range(len(TASKS_CONTAINER_NAMES)):
        if noisy:
            print('\t', done_queue.get())
        else:
            done_queue.get() # still consume from queue even if quiet

    # Add more tasks using `put()` for exposes counts
    if noisy:
        print('\nSubmitting tasks for exposes counts...')
    for task in TASKS_EXPOSES_COUNTS:
        task_queue.put(task)

    # Get and print some more results
    if noisy:
        print('Unordered results for exposes counts:')
    for i in range(len(TASKS_EXPOSES_COUNTS)):
        if noisy:
            print('\t', done_queue.get())
        else:
            done_queue.get() # still consume from queue even if quiet

    # Tell child processes to stop
    for i in range(num_processes):
        task_queue.put('STOP')


def main(args):
    num_processes = 4 # default
    noisy = True # default

    try:
        opts, args = getopt.getopt(args, "qp:") # -q for quiet, -p for processes
    except getopt.error as detail:
        return target_fail(str(detail))

    for opt, val in opts:
        if opt == "-q":
            noisy = False
        elif opt == "-p":
            try:
                num_processes = int(val)
                if num_processes <= 0:
                    raise ValueError("Number of processes must be positive.")
            except ValueError as e:
                return target_fail(f"Invalid value for -p: {val} ({e})")

    if args: # No positional arguments expected for this example
        return target_fail("No positional arguments allowed.")

    _run_tasks_with_multiprocessing(num_processes, noisy)
    return 1 # Success

if __name__ == '__main__':
    freeze_support()
    if not main(sys.argv[1:]):
        sys.exit(1)