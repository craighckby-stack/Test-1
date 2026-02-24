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
    This demonstrates applying the FFI interaction logic from KNOWLEDGE
    to implement an ABC from TARGET.
    """
    def __len__(self):
        if ctypes_ffi_lib:
            return ctypes_ffi_lib.get_data_size()
        else:
            return 0

# --- Applying logic from KNOWLEDGE here ---

def _math_add(a: int, b: int) -> int:
    """A simple addition function, analogous to KNOWLEDGE's 'add'."""
    return a + b

def _get_ffi_base_value_and_apply_offset(offset: int) -> int:
    """
    Fetches a base value from FFI (or mock) and applies an offset using _math_add.
    This represents the 'template method' concept from the KNOWLEDGE pattern,
    where the base value comes from FFI and _math_add is the 'strategy'.
    """
    base_val = 0
    if ctypes_ffi_lib:
        base_val = ctypes_ffi_lib.get_data_size()
    return _math_add(base_val, offset)

def get_ffi_size_incremented_by_one() -> int:
    """
    Corresponds to KNOWLEDGE's 'increment'.
    Returns the FFI data size incremented by 1.
    """
    return _get_ffi_base_value_and_apply_offset(1)

def get_ffi_size_incremented_by_two() -> int:
    """
    Corresponds to KNOWLEDGE's 'incrementBy2'.
    Returns the FFI data size incremented by 2.
    """
    return _get_ffi_base_value_and_apply_offset(2)

def get_ffi_size_decremented_incorrectly() -> int:
    """
    Corresponds to KNOWLEDGE's 'decrement', demonstrating its incorrect logic.
    It "decrements" by adding 1, mirroring the bug in KNOWLEDGE's 'decrement'.
    """
    return _get_ffi_base_value_and_apply_offset(1)

def get_ffi_size_decremented_correctly() -> int:
    """
    Shows the correct logic for decrementing by 1, contrasting with the KNOWLEDGE's 'decrement' bug.
    """
    return _get_ffi_base_value_and_apply_offset(-1)