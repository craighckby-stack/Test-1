*   **Singleton Pattern:**
    *   The `sublist` module is initialized by `PyModuleDef_Init` and registered as a single instance within the Python interpreter. The `SubListType` itself is also a singleton type object, made globally available via `PyModule_AddObjectRef` within the module.

*   **Decorator Pattern:**
    *   `PyDoc_STR("...")` acts as a compile-time decorator, attaching documentation strings (metadata) to the `SubListType` and its `increment` method.

*   **Factory Pattern:**
    *   `PyType_Ready(&SubListType)` serves as a factory function, taking the raw `PyTypeObject` definition and constructing a fully initialized and ready-to-use Python type object. When `sublist.SubList()` is called from Python, new `SubListObject` instances are created via a factory-like mechanism (`tp_new`).

*   **Prototype Pattern:**
    *   The `static PyTypeObject SubListType = { ... }` declaration acts as a prototype, defining the blueprint and default configuration (methods, size, base type, flags) for all instances of the `sublist.SubList` type.

*   **Adapter Pattern:**
    *   The `SubListObject` and `SubListType` together act as an Adapter for `PyListObject`. By embedding `PyListObject` and setting `.tp_base = &PyList_Type`, `SubList` adapts the existing list functionality, allowing it to behave like a standard Python list while adding specific new attributes (`state`) and methods (`increment`).

*   **Composite Pattern:**
    *   The `sublist` module acts as a composite, grouping and exposing the `SubListType` (which itself is composed of `tp_init`, `tp_methods`, `tp_base`, etc.) as a single, unified entity within Python.