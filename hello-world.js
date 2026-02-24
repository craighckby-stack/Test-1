def add_variadic(*args: int) -> int:
    """
    Implements the logic of KNOWLEDGE's 'exports.add' function,
    which sums an arbitrary number of arguments.
    """
    total_sum = 0
    for arg in args:
        total_sum += arg
    return total_sum

def multiply_variadic_buggy(*args: int) -> int:
    """
    Implements the logic of KNOWLEDGE's 'exports.multiply' function,
    faithfully replicating its bug.
    
    The original JS code initializes `product` to 0, then attempts to use
    an undeclared variable `sum` for multiplication, finally returning `sum`.
    
    For Python, we'll interpret the practical effect:
    1. If `sum` was intended to be `product`, then `product` starting at 0
       would make the result always 0.
    2. If `sum` was a truly independent undeclared variable, it would cause
       a runtime error (like Python's `NameError`).
    
    To "apply logic" including the bug, we'll simulate the "always returns 0"
    effect if `sum` was a typo for `product` and `product` started at 0.
    If no arguments are provided, the JS loop doesn't run, and it would
    try to return an undeclared `sum`. If `sum` was `product`, it would return 0.
    """
    product_accumulator = 0 # Mimics `var product = 0;`

    if not args:
        return product_accumulator # 0, consistent with JS `product=0` if loop doesn't run.

    # For any arguments, `product_accumulator` is 0, so any multiplication
    # will keep it 0. This simulates the `product *= arg` part if `product`
    # was initialized to 0.
    for arg in args:
        product_accumulator *= arg
        
    return product_accumulator


def get_ffi_size_plus_arbitrary_values(*extra_values: int) -> int:
    """
    Combines the FFI data size with additional values using the `add_variadic` logic.
    """
    base_val = 0
    if ctypes_ffi_lib:
        base_val = ctypes_ffi_lib.get_data_size()
    
    return add_variadic(base_val, *extra_values)

def get_ffi_size_multiplied_by_arbitrary_values_buggy(*multipliers: int) -> int:
    """
    Combines the FFI data size with multipliers using the `multiply_variadic_buggy` logic,
    thus replicating its buggy behavior (always resulting in 0 if any arguments or base_val are given).
    """
    base_val = 0
    if ctypes_ffi_lib:
        base_val = ctypes_ffi_lib.get_data_size()

    return multiply_variadic_buggy(base_val, *multipliers)