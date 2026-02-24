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