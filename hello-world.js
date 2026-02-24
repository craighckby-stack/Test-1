Here are the architectural patterns extracted from the given code:

*   **Input validation - type checking:**
    *   The function includes `if (typeof mapper !== "function") { throw new TypeError("Mapper function is required"); }` and `if (!((Number.isSafeInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency >= 1)) { throw new TypeError(...) })` statements, which are direct implementations of input validation specifically for type and range checking.
*   **Exporting library as default:**
    *   The line `export default pMap;` explicitly demonstrates exporting the function as the default export of a module.
*   **Proxy Pattern:**
    *   Not explicitly used. The function directly processes an iterable rather than providing a surrogate or placeholder for another object to control access.
*   **Factory Pattern:**
    *   The function returns a `Promise`, which acts as a "factory" for the eventual result of the mapped operations. It "manufactures" a single asynchronous result (a promise) representing the outcome of all transformations.
*   **Factory Method Pattern (exemplified by the destructuring of the options object):**
    *   The function creates a `Promise` object (Factory Pattern). The destructuring of the `options` object with default values (`concurrency = Number.POSITIVE_INFINITY`, `stopOnError = true`) provides a flexible and configurable way to "manufacture" the asynchronous mapping operation, allowing for variations in its creation based on input parameters.
*   **Null Object Pattern (or Optional Chaining Pattern):**
    *   Not explicitly used. The function uses default parameters for `concurrency` and `stopOnError` within the `options` object, effectively handling missing values without needing a dedicated Null Object or optional chaining.
*   **Input validation using Guard Clauses:**
    *   The function extensively uses guard clauses such as `if (typeof mapper !== "function") { throw new TypeError(...) }` and `if (!((Number.isSafeInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency >= 1)) { throw new TypeError(...) }` to validate inputs and handle edge cases early, ensuring robust behavior.
*   **Decorator Pattern (regex decorator in replace()):**
    *   Not explicitly used. The function does not involve string replacement with regex.
*   **Strategy Pattern:**
    *   The `mapper` function is an external strategy that is used within `pMap` to process each item. It is replaceable and can change the outcome of `pMap` without affecting its internal flow. Additionally, the `stopOnError` option allows configuring the error handling strategy.
*   **Concurrency Limiter Pattern:**
    *   The `concurrency` option, `resolvingCount` variable, and the initial `for` loop work together to explicitly limit the number of simultaneous asynchronous operations, ensuring controlled resource usage.
*   **Producer-Consumer Pattern:**
    *   The `iterable` acts as a producer, yielding items (tasks) through its iterator. The `pMap` function, specifically the `next()` function and the async operations, acts as the consumer, processing these tasks with the `mapper` function.
*   **Asynchronous Programming / Promise Pattern:**
    *   The `pMap` function returns a `Promise` and extensively uses `async`/`await` internally, representing a fundamental pattern for handling non-blocking operations.
*   **Pipeline Processing Pattern:**
    *   The `pMap` function processes items from the `iterable` in a series of asynchronous stages: fetching, mapping, and collecting results or errors, effectively forming a data processing pipeline.