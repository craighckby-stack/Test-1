import sys
from abc import ABCMeta, abstractmethod
try:
    from ctypes import cdll, c_int, util, c_void_p, c_char_p
except ImportError:
    print("ctypes isn't available; FFI system calls will not be available", file=sys.stderr)
    ctypes_ffi_lib = None
else:
    _my_lib_name = "my_data_lib"
    _lib_path = util.find_library(_my_lib_name)
    if _lib_path is None:
        print(f"FFI library '{_my_lib_name}' couldn't be loaded; using mock.", file=sys.stderr)
        class _MockFFILib:
            def __init__(self):
                self.get_data_size.restype = c_int
                self.get_data_size.argtypes = []
            def get_data_size(self):
                return 42
        ctypes_ffi_lib = _MockFFILib()
    else:
        try:
            ctypes_ffi_lib = cdll.LoadLibrary(_lib_path)
            ctypes_ffi_lib.get_data_size.restype = c_int
            ctypes_ffi_lib.get_data_size.argtypes = []
        except Exception as e:
            print(f"Failed to load FFI library '{_my_lib_name}': {e}; using mock.", file=sys.stderr)
            class _MockFFILib:
                def __init__(self):
                    self.get_data_size.restype = c_int
                    self.get_data_size.argtypes = []
                def get_data_size(self):
                    return 42
            ctypes_ffi_lib = _MockFFILib()


def _check_methods(C, *methods):
    return all(any(m in B.__dict__ for B in C.__mro__) for m in methods)

class Sized(metaclass=ABCMeta):
    __slots__ = ()
    @abstractmethod
    def __len__(self):
        return 0
    @classmethod
    def __subclasshook__(cls, C):
        if cls is Sized:
            return _check_methods(C, "__len__")
        return NotImplemented

class FFILenientSized(Sized):
    """
    A concrete implementation of the Sized ABC that retrieves its length
    by making a Foreign Function Interface (FFI) call using ctypes.
    """
    def __len__(self):
        if ctypes_ffi_lib:
            return ctypes_ffi_lib.get_data_size()
        else:
            return 0

# --- Applying logic from KNOWLEDGE here ---

# KNOWLEDGE's ABCMeta employs a Registry pattern via `_abc_registry`
# to keep track of virtual subclasses.
# We apply this logic by creating a similar application-level registry
# for 'Sized' implementation classes.
_sized_implementation_registry = {} # Stores named constructors or classes

def register_sized_implementation(name: str, sized_class: type):
    """
    Registers a Sized implementation class by a given name.
    Analogous to ABCMeta.register() which adds a subclass to `_abc_registry`.
    """
    if not issubclass(sized_class, Sized):
        raise TypeError(f"Class {sized_class.__name__} must be a subclass of Sized")
    _sized_implementation_registry[name] = sized_class
    print(f"Registered Sized implementation: '{name}' -> {sized_class.__name__}")

def get_sized_class_factory(name: str):
    """
    A simple factory function that returns a registered Sized implementation class.
    This reflects the spirit of the Factory pattern where a "product" (Sized class)
    is retrieved by a key, similar to how ABCMeta.register could be seen as a factory
    for registered subclasses.
    """
    sized_class = _sized_implementation_registry.get(name)
    if sized_class is None:
        raise ValueError(f"No Sized implementation registered under name: '{name}'")
    return sized_class # Returning the class itself as a factory callable

def create_sized_instance(name: str, *args, **kwargs) -> Sized:
    """
    Creates an instance of a registered Sized implementation.
    This is a client-facing factory method for object instantiation.
    """
    sized_class = get_sized_class_factory(name)
    return sized_class(*args, **kwargs)

# Demonstrate registration and usage:
# Register the FFILenientSized class using our custom registry.
register_sized_implementation("ffi_lenient_sized", FFILenientSized)

# Example of creating an instance using the factory
if __name__ == '__main__':
    print("\nDemonstrating Registry and Factory patterns inspired by ABCMeta:")

    # Create an FFILenientSized instance via the factory
    my_ffi_sized_obj = create_sized_instance("ffi_lenient_sized")
    print(f"Created instance of FFILenientSized via factory. Length: {len(my_ffi_sized_obj)}")

    # You could register other Sized implementations too
    class SimpleListSized(Sized):
        def __init__(self, data):
            self._data = data
        def __len__(self):
            return len(self._data)

    register_sized_implementation("simple_list_sized", SimpleListSized)

    my_list_sized_obj = create_sized_instance("simple_list_sized", [1, 2, 3, 4, 5])
    print(f"Created instance of SimpleListSized via factory. Length: {len(my_list_sized_obj)}")

    # The ABCMeta._abc_invalidation_counter (part of the Proxy/Builder logic)
    # is incremented on every call to ABC.register(), affecting caches.
    # We can observe its change.
    initial_token = ABCMeta._abc_invalidation_counter
    print(f"\nInitial ABC invalidation token: {initial_token}")

    # Registering a virtual subclass via Sized.register() will increment this.
    class MyVirtualSubclass:
        pass

    Sized.register(MyVirtualSubclass)
    print(f"ABC invalidation token after Sized.register(MyVirtualSubclass): {ABCMeta._abc_invalidation_counter}")